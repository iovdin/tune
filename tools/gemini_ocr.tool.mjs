import fs from 'fs/promises';
import path from 'path';

/**
 * Process a local file (image, audio, document, etc.) using Gemini API
 *
 * @param {Object} params
 * @param {string} params.filename - Local path to the file
 * @param {string} params.text - Instruction or question about the file content (e.g. "Extract text", "Summarize", "Transcribe audio", "What is this image?")
 * @param {Object} ctx - Tune context object
 * @returns {Promise<string>} Result text from the API
 */
export default async function geminiFileProcessor({ filename, text, model }, ctx) {
  const key = await ctx.read('GEMINI_KEY');
  if (!key) {
    throw new Error('GEMINI_KEY not found in environment. Please set it in your .env file.');
  }  // Get file size first so we decide whether to upload or inline.
  let stats;
  try {
    stats = await fs.stat(filename);
  } catch (err) {
    throw new Error(`Error stating file ${filename}: ${err.message}`);
  }
  const fileSize = stats.size; // in bytes
  model = model || "gemini-2.5-pro-preview-03-25"  // Determine MIME type from file extension using a hard-coded map of Gemini-supported formats.
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
    '.md': 'text/md',
    '.markdown': 'text/md',
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
    '.mpg': 'video/mpg',
    '.mov': 'video/mov',
    '.avi': 'video/avi',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.wmv': 'video/wmv',
    '.3gp': 'video/3gpp',
    '.3gpp': 'video/3gpp',

    // Audio
    '.wav': 'audio/wav',
    '.mp3': 'audio/mp3',
    '.aiff': 'audio/aiff',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac'
  };

  const ext = path.extname(filename).toLowerCase();
  const mimeType = EXTENSION_TO_MIME[ext];

  if (!mimeType) {
    throw new Error(`Unsupported or unknown file extension: ${ext}. Gemini only supports specific MIME types. Please refer to the documentation for supported formats.`);
  }  // Decide whether to inline the file or upload via Files API (>10MB)
  const FILE_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10 MB

  let parts;

  if (fileSize > FILE_SIZE_THRESHOLD) {
    // --- Upload using Files API ---
    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(filename);
    } catch (err) {
      throw new Error(`Error reading file ${filename}: ${err.message}`);
    }

    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${key}`;

    let uploadResp;
    try {
      uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
          'X-Goog-Upload-Protocol': 'raw' // non-resumable simple upload
        },
        body: fileBuffer
      });
    } catch (err) {
      throw new Error(`Network error uploading file to Gemini Files API: ${err.message}`);
    }

    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      throw new Error(`Gemini Files API upload failed (${uploadResp.status}): ${errText}`);
    }    
    const uploadJson = await uploadResp.json();
    const fileObj = uploadJson?.file || uploadJson; // sometimes top-level is the File object
    const fileUri = fileObj?.uri || fileObj?.fileUri;
    const fileName = fileObj?.name; // e.g. "files/4su2ifuhe53n"

    if (!fileUri || !fileName) {
      throw new Error(`Could not parse file URI/name from upload response: ${JSON.stringify(uploadJson)}`);
    }

    // Wait until the file is ACTIVE (the backend might still be processing)
    const waitForActive = async (name, timeoutMs = 60000, intervalMs = 1000) => {
      const deadline = Date.now() + timeoutMs;
      const fileUrl = `https://generativelanguage.googleapis.com/v1beta/${name}?key=${key}`;
      while (Date.now() < deadline) {
        try {
          const resp = await fetch(fileUrl);
          if (resp.ok) {
            const info = await resp.json();
            if (info?.file?.state === 'ACTIVE' || info?.state === 'ACTIVE') {
              return; // Ready!
            }
          }
        } catch (e) {
          // ignore transient errors
        }
        await new Promise(r => setTimeout(r, intervalMs));
      }
      console.warn(`Timed out waiting for file ${name} to become ACTIVE`);
    };

    await waitForActive(fileName);

    parts = [
      { file_data: { mime_type: mimeType, file_uri: fileUri } },
      { text }
    ];
  } else {
    // --- Inline small file (<10MB) ---
    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(filename);
    } catch (err) {
      throw new Error(`Error reading file ${filename}: ${err.message}`);
    }
    const encodedData = fileBuffer.toString('base64');

    parts = [
      { inline_data: { mime_type: mimeType, data: encodedData } },
      { text }
    ];
  }

  const body = {
    contents: [{ parts }]
    // generationConfig can be added here if needed
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
     throw new Error(`Network error calling Gemini API: ${err.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    let detailedError = errorText;
    try {
        // Try to parse the JSON error response from Gemini for better details
        const errorJson = JSON.parse(errorText);
        detailedError = JSON.stringify(errorJson.error || errorJson, null, 2);
    } catch (parseError) {
        // Ignore if parsing fails, just use the raw text
    }
    throw new Error(`Gemini API Error ${response.status}: ${detailedError}`);
  }

  const json = await response.json();

  try {
    // Extract the response text, handling potential variations in structure
    const candidates = json?.candidates;
    if (!candidates || candidates.length === 0) {
        return `Gemini API returned no candidates. Full response: ${JSON.stringify(json, null, 2)}`;
    }

    // Check for issues like finishReason other than "STOP" or safety blocks
    const candidate = candidates[0];
    const finishReason = candidate?.finishReason;
    const safetyRatings = candidate?.safetyRatings;

    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
        return `Gemini API finished prematurely. Reason: ${finishReason}. Safety Ratings: ${JSON.stringify(safetyRatings)}. Full response: ${JSON.stringify(json, null, 2)}`;
    }

    const content = candidate?.content;
    if (!content || !content.parts || content.parts.length === 0) {
         // If no parts but finished normally, might be an empty response or an issue
         return `Gemini API returned no text parts (Finish Reason: ${finishReason}). Full response: ${JSON.stringify(json, null, 2)}`;
    }

    // Concatenate text from all parts
    return content.parts.map(p => p.text).join('\n').trim();

  } catch (e) {
    console.error("Error processing Gemini response:", e);
    return `Error processing response structure. Full response: ${JSON.stringify(json, null, 2)}`;
  }
}
