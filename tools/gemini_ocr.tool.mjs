import fs from 'fs/promises';
import mime from 'mime-types'; // Import the mime-types package

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

  let fileData;
  try {
    fileData = await fs.readFile(filename);
  } catch (err) {
    throw new Error(`Error reading file ${filename}: ${err.message}`);
  }
  model = model || "gemini-2.5-pro-preview-03-25"

  // Use mime-types package to determine MIME type from filename extension
  const mimeType = mime.lookup(filename);

  if (!mimeType) {
    // Try to determine common types not covered by extension alone if needed, or just error out
    throw new Error(`Could not determine MIME type for file: ${filename}. Ensure the file has a standard extension recognizable by the 'mime-types' package.`);
  }

  // Log the determined mime type for debugging
  // console.log(`Using MIME type: ${mimeType} for file ${filename}`);

  const encodedData = fileData.toString('base64');

  const body = {
    contents: [{
      parts: [
        // The order matters: file data first, then the text prompt
        { inline_data: { mime_type: mimeType, data: encodedData } },
        { text } // User's instruction/question about the file
      ]
    }]
    // You might want to add generationConfig here if needed, e.g., for temperature
    // generationConfig: {
    //   temperature: 0.7
    // }
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
