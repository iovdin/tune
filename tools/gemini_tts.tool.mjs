import fs from 'fs';

/**
 * Generate speech from text using Gemini's Text-to-Speech API
 * Supports both single-speaker and multi-speaker audio generation
 *
 * @param {Object} params
 * @param {string} params.text - Text to convert to speech
 * @param {string} params.filename - Output filename for the audio (should end in .wav)
 * @param {string} [params.model] - Gemini model to use (default: gemini-2.5-flash-preview-tts)
 * @param {string} [params.voice] - Voice name for single-speaker mode
 * @param {Array} [params.speakers] - Array of speaker configurations for multi-speaker mode
 * @param {Object} ctx - Tune context object
 * @returns {Promise<string>} Success message
 */
export default async function geminiTTS({ text, filename, model, voice, speakers }, ctx) {
  const key = await ctx.read('GEMINI_KEY');
  if (!key) {
    throw new Error('GEMINI_KEY not found in environment. Please set it in your .env file.');
  }

  // Default model
  model = model || "gemini-2.5-flash-preview-tts";

  // Validate inputs
  if (!text || !filename) {
    throw new Error('Both text and filename are required');
  }

  // Ensure filename ends with .wav
  if (!filename.endsWith('.wav')) {
    filename += '.wav';
  }

  // Build the request body
  const body = {
    contents: [{
      parts: [{ text }]
    }],
    generationConfig: {
      responseModalities: ["AUDIO"]
    }
  };

  // Configure speech settings based on whether it's single or multi-speaker
  if (speakers && Array.isArray(speakers) && speakers.length > 0) {
    // Multi-speaker mode
    if (speakers.length > 2) {
      throw new Error('Maximum 2 speakers are supported for multi-speaker mode');
    }

    body.generationConfig.speechConfig = {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: speakers.map(speaker => ({
          speaker: speaker.name,
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: speaker.voice
            }
          }
        }))
      }
    };
  } else {
    // Single-speaker mode
    const voiceName = voice || 'Kore'; // Default voice
    body.generationConfig.speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName
        }
      }
    };
  }

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
      const errorJson = JSON.parse(errorText);
      detailedError = JSON.stringify(errorJson.error || errorJson, null, 2);
    } catch (parseError) {
      // Ignore if parsing fails, just use the raw text
    }
    throw new Error(`Gemini API Error ${response.status}: ${detailedError}`);
  }

  const json = await response.json();

  try {
    // Extract the audio data
    const candidates = json?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error(`Gemini API returned no candidates. Full response: ${JSON.stringify(json, null, 2)}`);
    }

    const candidate = candidates[0];
    const finishReason = candidate?.finishReason;

    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
      throw new Error(`Gemini API finished prematurely. Reason: ${finishReason}. Full response: ${JSON.stringify(json, null, 2)}`);
    }

    const content = candidate?.content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error(`Gemini API returned no content parts. Full response: ${JSON.stringify(json, null, 2)}`);
    }

    const audioPart = content.parts.find(part => part.inlineData && part.inlineData.data);
    if (!audioPart) {
      throw new Error(`No audio data found in response. Full response: ${JSON.stringify(json, null, 2)}`);
    }

    // Decode base64 audio data and save as WAV
    const audioData = Buffer.from(audioPart.inlineData.data, 'base64');
    
    // The API returns PCM data, we need to create a proper WAV file
    const wavHeader = createWavHeader(audioData.length, 1, 24000, 16);
    const wavBuffer = Buffer.concat([wavHeader, audioData]);
    
    await ctx.write(filename, wavBuffer);
    
    return `Speech generated successfully and saved to ${filename}`;

  } catch (e) {
    console.error("Error processing Gemini TTS response:", e);
    throw new Error(`Error processing response: ${e.message}`);
  }
}

/**
 * Create a WAV file header for PCM audio data
 * @param {number} dataLength - Length of PCM data in bytes
 * @param {number} channels - Number of audio channels (1 for mono, 2 for stereo)
 * @param {number} sampleRate - Sample rate in Hz
 * @param {number} bitsPerSample - Bits per sample (8, 16, 24, or 32)
 * @returns {Buffer} WAV header buffer
 */
function createWavHeader(dataLength, channels = 1, sampleRate = 24000, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  
  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  
  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Sub-chunk size
  header.writeUInt16LE(1, 20);  // Audio format (1 = PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28); // Byte rate
  header.writeUInt16LE(channels * bitsPerSample / 8, 32); // Block align
  header.writeUInt16LE(bitsPerSample, 34);
  
  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  
  return header;
}