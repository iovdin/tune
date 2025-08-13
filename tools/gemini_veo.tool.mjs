import fs from 'fs/promises';
import path from 'path';

/**
 * Simple command-line–style wrapper around the Gemini Veo video-generation REST API.
 * Accepts a single `text` string which contains a command in the following
 * mini-CLI grammar (similar to the proposal chosen by the user):
 *
 *   create --prompt "..." [--image path] [--aspect-ratio 16:9] [--duration 6]
 *          [--person-generation dont_allow] [--output file.mp4] [--wait]
 *   status <operation-id>
 *   get <operation-id> --output file.mp4
 *   list [--status active|completed|failed]
 *
 * The function parses the string, invokes the correct Gemini REST endpoints and
 * returns either the operation id, status information or downloads a video to
 * the requested output path and returns a confirmation message.
 *
 * NOTE  🛈
 *   – This tool purposefully keeps external dependencies to zero (intended to
 *     run inside the same environment as the other Gemini tools).
 *   – It only supports the official public Veo model name
 *           "veo-2.0-generate-001".  When Google releases Veo-3 you can simply
 *         change the constant below.
 *   – The code performs only lightweight argument validation; runtime errors
 *     from the Gemini service are surfaced verbatim.
 *
 * @param   {Object}   params
 * @param   {string}   params.text  – CLI-like command string (see grammar)
 * @param   {Object}   ctx          – Tune context (for GEMINI_KEY)
 * @returns {Promise<string>}       – Human readable result / status
 */
export default async function geminiVeo({ text }, ctx) {
  if (!text || typeof text !== 'string') {
    throw new Error('Expected a non-empty "text" string with Veo command.');
  }

  const key = await ctx.read('GEMINI_KEY');
  if (!key) {
    throw new Error('GEMINI_KEY not found in environment. Please set it in your .env file.');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helper utilities
  // ────────────────────────────────────────────────────────────────────────────
  const API_ROOT   = 'https://generativelanguage.googleapis.com/v1beta';
  const VEO_MODEL  = 'veo-2.0-generate-001';   // public release model id

  /** Very tiny argv parser (handles --flag value  and  --flag=value  forms) */
  function parseArgs(cmdString) {
    const RE = /(?:"([^"]*)"|'([^']*)'|(\S+))/g; // split by space, keep quoted
    const tokens = [];
    let m;
    while ((m = RE.exec(cmdString)) !== null) {
      tokens.push(m[1] ?? m[2] ?? m[3]);
    }

    const result = { _: [] };
    for (let i = 0; i < tokens.length; ++i) {
      const t = tokens[i];
      if (t.startsWith('--')) {
        const eq = t.indexOf('=');
        if (eq !== -1) {
          const k = t.slice(2, eq);
          const v = t.slice(eq + 1);
          result[k] = v;
        } else {
          const k = t.slice(2);
          const v = tokens[i + 1] && !tokens[i + 1].startsWith('--') ? (tokens[++i]) : true;
          result[k] = v;
        }
      } else {
        result._.push(t);
      }
    }
    return result;
  }

  async function fetchJson(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status} error from Gemini API: ${txt}`);
    }
    return res.json();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Command dispatch
  // ────────────────────────────────────────────────────────────────────────────
  const argv = parseArgs(text);
  const [command, ...positionals] = argv._;

  switch (command) {
    // ─────────────────────────── CREATE ──────────────────────────────
    case 'create': {
      const prompt = argv.prompt;
      if (!prompt) {
        throw new Error('create:  --prompt "…"  is required.');
      }      const body = {
        instances: [
          {
            prompt,
            ...(argv.image ? { image: await inlineOrUploadImage(argv.image, key) } : {}),
          },
        ],
        parameters: {
          sampleCount: 1,
          ...(argv['aspect-ratio'] ? { aspectRatio: argv['aspect-ratio'] } : {}),
          ...(argv.duration ? { durationSeconds: Number(argv.duration) } : {}),
          ...(argv['person-generation'] ? { personGeneration: argv['person-generation'] } : {}),
        },
      };

      const url = `${API_ROOT}/models/${VEO_MODEL}:predictLongRunning?key=${key}`;
      const json = await fetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const operationId = json.name || json.operation || json.id;
      if (!operationId) {
        throw new Error(`Unexpected response from create: ${JSON.stringify(json)}`);
      }

      if (argv.wait) {
        const final = await pollOperationUntilDone(operationId, key);
        if (argv.output) {
          await downloadFirstVideo(final, argv.output, key);
          return `Video saved to ${argv.output}`;
        }
        return JSON.stringify(final, null, 2);
      }

      return `Operation started: ${operationId}`;
    }

    // ─────────────────────────── STATUS ──────────────────────────────
    case 'status': {
      const opId = positionals[0];
      if (!opId) throw new Error('status: <operation-id> argument missing.');
      const status = await fetchJson(`${API_ROOT}/${opId}?key=${key}`);
      return JSON.stringify(status, null, 2);
    }

    // ─────────────────────────── GET ─────────────────────────────────
    case 'get': {
      const opId = positionals[0];
      if (!opId) throw new Error('get: <operation-id> argument missing.');
      const output = argv.output;
      if (!output) throw new Error('get: --output <file> is required.');

      const final = await pollOperationUntilDone(opId, key);
      await downloadFirstVideo(final, output, key);
      return `Video saved to ${output}`;
    }

    // ─────────────────────────── LIST ────────────────────────────────
    case 'list': {
      // NOTE: The public Operations.List endpoint isn’t released yet in v1beta
      // (as of 2024-06).  We still implement a best-effort call; if the backend
      // doesn’t support it we surface the 404 to the user.
      const statusFilter = argv.status;
      let url = `${API_ROOT}/operations?key=${key}`;
      if (statusFilter) {
        url += `&filter=done%3D${statusFilter === 'completed' ? 'true' : 'false'}`;
      }
      const list = await fetchJson(url);
      return JSON.stringify(list, null, 2);
    }

    default:
      throw new Error(`Unknown Veo command: ${command}`);
  }

  // ────────────────────────────────────────────────────────────────────
  // Helper sub-routines
  // ────────────────────────────────────────────────────────────────────
  async function pollOperationUntilDone(opId, apiKey) {
    while (true) {
      const op = await fetchJson(`${API_ROOT}/${opId}?key=${apiKey}`);
      if (op.done) return op;
      await new Promise((r) => setTimeout(r, 10000)); // 10 s polling interval
    }
  }

  async function downloadFirstVideo(operationResponse, outfile, apiKey) {    // Google has changed/extended the response schema a few times. Attempt the
    // most common variants before giving up.
    let uri =
      operationResponse?.response?.generatedVideos?.[0]?.video?.uri ||
      operationResponse?.response?.generateVideoResponse?.generatedVideos?.[0]?.video?.uri ||
      operationResponse?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      operationResponse?.response?.generatedSamples?.[0]?.video?.uri;
    if (!uri) {
      throw new Error('No video URI found in operation response.');
    }
    const res = await fetch(`${uri}&key=${apiKey}`);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to download video: ${txt}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await ctx.write(outfile, buffer);
  }

  async function inlineOrUploadImage(imagePath, apiKey) {
    // Keep it simple: if the image path is a remote URL we send it by URI; if
    // it is a local path (<10 MB) we inline as base64.  Larger files should be
    // uploaded with the Gemini Files API (not implemented here yet).
    /*
    if (/^https?:\/\//i.test(imagePath)) {
      return { uri: imagePath }; // remote URL
    }
    const stats = await fs.stat(imagePath);
    const MAX = 10 * 1024 * 1024; // 10 MB
    if (stats.size > MAX) {
      throw new Error('Local image larger than 10 MB. Upload it first and pass an URL.');
    }
    */
    const data = await ctx.read(imagePath);
    const b64  = data.toString('base64');
    // Detect mime from extension
    const ext = path.extname(imagePath).toLowerCase();
    const mime = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    }[ext] || 'image/png';
    return { bytesBase64Encoded: b64, mimeType: mime };
  }
}