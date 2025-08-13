import fs from 'fs';

export default async function openaiSTT({ 
  file, 
  model = "gpt-4o-transcribe", 
  language, 
  prompt, 
  response_format = "json", 
  temperature = 0,
  timestamp_granularities,
  stream = false
}, ctx) {
  const key = await ctx.read("OPENAI_KEY");
  
  if (!file) {
    throw new Error('File parameter is required');
  }
  
  const formData = new FormData();
  
  // Add file
  const fileBlob = await fs.openAsBlob(file);
  formData.append('file', fileBlob, file);
  
  // Add required model
  formData.append('model', model);
  
  // Add optional parameters
  if (language) formData.append('language', language);
  if (prompt) formData.append('prompt', prompt);
  if (response_format) formData.append('response_format', response_format);
  if (temperature !== undefined) formData.append('temperature', temperature.toString());
  if (stream) formData.append('stream', stream.toString());
  
  // Timestamp granularities (only supported for whisper-1 with verbose_json)
  if (timestamp_granularities && model === 'whisper-1' && response_format === 'verbose_json') {
    timestamp_granularities.forEach(granularity => {
      formData.append('timestamp_granularities[]', granularity);
    });
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error: ${response.status} ${response.statusText}\n${errorText}`);
  }
  
  if (stream) {
    // For streaming responses, return the response stream
    return response.body;
  } else {
    // For non-streaming responses, parse JSON or return text based on response_format
    if (response_format === 'text') {
      return await response.text();
    } else {
      return await response.json();
    }
  }
}