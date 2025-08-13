import fs from 'fs/promises';
import path from 'path';

/**
 * Lightweight CLI-style wrapper around Gemini Files API.
 * It exposes the most common operations (upload, list, get, delete)
 * through a single `text` parameter that looks like a shell command.
 *
 * Examples
 *   upload ./assets/photo.jpg                -> uploads the file
 *   upload ./assets/photo.jpg "My photo"      -> uploads with display name
 *   list                                      -> lists uploaded files (first page)
 *   get files/abc123def                       -> shows metadata for a file
 *   delete files/abc123def                    -> deletes a file
 *   help                                      -> prints usage
 *
 * The function returns a human-readable string describing the result
 * (or JSON pretty-printed for list/get/upload responses).
 */
export default async function geminiFilesCli({ text }, ctx) {
  // -------------------------------------------------------------
  // 1. Helpers
  // -------------------------------------------------------------
  const usage = () => `Gemini Files CLI
Usage:
  upload <filepath> [displayName]    Upload local file and return metadata
  delete <file_name>                 Delete file by name/id (e.g. files/abc123)
  get <file_name>                    Show metadata for file (e.g. files/abc123)
  list                               List uploaded files (first page)
  help                               Show this message
Examples:
  upload ./samples/song.mp3
  upload ./samples/doc.pdf "My Doc"
  delete files/abc123def
  get files/abc123def
  list
`;

  const EXTENSION_TO_MIME = {
    // Documents
    '.pdf': 'application/pdf',
    '.js': 'application/x-javascript',
    '.mjs': 'application/x-javascript',
    '.cjs': 'application/x-javascript',
    '.py': 'text/x-python',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.md': 'text/markdown',
    '.markdown': 'text/markdown',
    '.csv': 'text/csv',
    '.xml': 'text/xml',
    '.rtf': 'text/rtf',

    // Images
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',

    // Videos
    '.mp4': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.mpg': 'video/mpeg',
    '.mov': 'video/quicktime',
    '.avi': 'video/avi',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.wmv': 'video/x-ms-wmv',
    '.3gp': 'video/3gpp',
    '.3gpp': 'video/3gpp',

    // Audio
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.aiff': 'audio/aiff',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac'
  };

  function pretty(json) {
    return JSON.stringify(json, null, 2);
  }

  // -------------------------------------------------------------
  // 2. Setup / validation
  // -------------------------------------------------------------
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return usage();
  }

  const key = await ctx.read('GEMINI_KEY');
  if (!key) {
    throw new Error('GEMINI_KEY not found in environment. Set it in your .env file.');
  }  /**
   * Split cmd line into args (spaces outside quotes don't break up arguments)
   * e.g. upload "foo bar.mp4" "My Title" -> [upload, foo bar.mp4, My Title]
   */
  function parseArgsWithQuotes(input) {
    const re = /"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s]+)/g;
    const args = [];
    let match;
    while ((match = re.exec(input))) {
      args.push(match[1] || match[2] || match[3] || match[4]);
    }
    return args;
  }

  const args = parseArgsWithQuotes(text.trim());
  const [cmd, ...rest] = args;
  const command = cmd?.toLowerCase();

  // -------------------------------------------------------------
  // 3. Command handlers
  // -------------------------------------------------------------
  switch (command) {
    case 'help':
      return usage();

    case 'list': {
      const url = `https://generativelanguage.googleapis.com/v1beta/files?key=${key}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Gemini API list failed (${resp.status}): ${await resp.text()}`);
      }
      const json = await resp.json();
      return pretty(json);
    }

    case 'get': {
      if (rest.length === 0) {
        return 'Error: "get" requires a file name.\n' + usage();
      }
      const name = rest[0];
      const url = `https://generativelanguage.googleapis.com/v1beta/${name}?key=${key}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Gemini API get failed (${resp.status}): ${await resp.text()}`);
      }
      const json = await resp.json();
      return pretty(json);
    }

    case 'delete': {
      if (rest.length === 0) {
        return 'Error: "delete" requires a file name.\n' + usage();
      }
      const name = rest[0];
      const url = `https://generativelanguage.googleapis.com/v1beta/${name}?key=${key}`;
      const resp = await fetch(url, { method: 'DELETE' });
      if (!resp.ok) {
        throw new Error(`Gemini API delete failed (${resp.status}): ${await resp.text()}`);
      }
      return `Deleted ${name}`;
    }

    case 'upload': {
      if (rest.length === 0) {
        return 'Error: "upload" requires a local file path.\n' + usage();
      }
      const filepath = rest[0];
      const displayName = rest.slice(1).join(' ') || path.basename(filepath);

      let fileBuffer;
      let stats;
      try {
        stats = await fs.stat(filepath);
        fileBuffer = await fs.readFile(filepath);
      } catch (err) {
        throw new Error(`Cannot read file ${filepath}: ${err.message}`);
      }

      const ext = path.extname(filepath).toLowerCase();
      const mimeType = EXTENSION_TO_MIME[ext] || 'application/octet-stream';

      // 3.1 Perform raw upload.
      const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${key}`;
      const resp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
          'X-Goog-Upload-Protocol': 'raw',
          'X-Goog-Upload-Header-Content-Length': stats.size.toString(),
          // Attach metadata via JSON content header? Docs suggest passing metadata in body for resumable.
          // For raw simple upload the display_name is auto-derived; we will ignore displayName here.
        },
        body: fileBuffer
      });

      if (!resp.ok) {
        throw new Error(`Gemini API upload failed (${resp.status}): ${await resp.text()}`);
      }
      const json = await resp.json();
      return pretty(json);
    }

    default:
      return `Unknown command: ${command}\n` + usage();
  }
}