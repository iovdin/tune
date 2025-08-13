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
  }

  model = model || "gemini-2.5-pro-preview-03-25";  

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
  // Determine if "filename" is a local path or a Gemini Files reference/URI
  const isRemote = /^https?:\/\//i.test(filename) || filename.startsWith('files/');

  const FILE_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10 MB
  let parts;
  let mimeType;

  if (isRemote) {
    // ---------------------- Remote (Gemini Files) ----------------------
    // Extract the canonical file name ("files/abc123") so we can query metadata
    let fileName = filename;
    if (!fileName.startsWith('files/')) {
      // try to extract between /files/ and the next /
      const m = filename.match(/\/files\/([^/?]+)/i);
      if (!m) {
        throw new Error('Could not extract Gemini file name (files/ID) from URI');
      }
      fileName = `files/${m[1]}`;
    }

    // Poll until state == ACTIVE (max 60s)
    const metadataEndpoint = `https://generativelanguage.googleapis.com/v1beta/${fileName}`;
    const deadline = Date.now() + 60000;
    let fileMeta;
    while (Date.now() < deadline) {
      const resp = await fetch(`${metadataEndpoint}?key=${key}`);
      if (!resp.ok) {
        const errTxt = await resp.text();
        throw new Error(`Failed to fetch file metadata (${resp.status}): ${errTxt}`);
      }
      const json = await resp.json();
      fileMeta = json.file || json;
      if (fileMeta.state === 'ACTIVE') break;
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!fileMeta || fileMeta.state !== 'ACTIVE') {
      throw new Error(`File ${fileName} is not ACTIVE (state=${fileMeta?.state}). Try again later.`);
    }

    const fileUri = fileMeta.uri || fileMeta.fileUri;
    mimeType = fileMeta.mimeType || fileMeta.mime_type;
    if (!fileUri || !mimeType) {
      throw new Error(`Could not determine uri/mimeType from metadata: ${JSON.stringify(fileMeta)}`);
    }

    parts = [
      { file_data: { mime_type: mimeType, file_uri: fileUri } },
      { text }
    ];
  } else {
    // --------------------------- Local file ---------------------------
    const ext = path.extname(filename).toLowerCase();
    mimeType = EXTENSION_TO_MIME[ext];
    if (!mimeType) {
      throw new Error(`Unsupported or unknown file extension: ${ext}. Gemini only supports specific MIME types.`);
    }

    // Get file size
    let stats;
    try {
      stats = await fs.stat(filename);
    } catch (err) {
      throw new Error(`Error stating file ${filename}: ${err.message}`);
    }
    const fileSize = stats.size;

    if (fileSize > FILE_SIZE_THRESHOLD) {
      throw new Error(`File ${filename} is larger than 10 MB. Please upload it first using gemini_files tool and then pass its uri/name here.`);
    }

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
