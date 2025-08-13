import fs from 'fs';

export default async function groqWhisper({ 
  file, 
  url, 
  model = "whisper-large-v3-turbo", 
  language, 
  text, 
  response_format = "json", 
  temperature = 0,
  timestamp_granularities = ["segment"]
}, ctx) {
  const key = await ctx.read("GROQ_KEY");
  
  const formData = new FormData();
  
  // Add file or url
  if (file) {
    if (!fs.existsSync(file)) {
        return "file not found"
    }
    const fileBlob = await fs.openAsBlob(file);
    formData.append('file', fileBlob, file);
  } else if (url) {
    formData.append('url', url);
  } else {
    throw new Error('Either file or url parameter is required');
  }
  
  // Add required model
  formData.append('model', model);
  
  // Add optional parameters
  if (language) formData.append('language', language);
  if (text) formData.append('prompt', text);
  if (response_format) formData.append('response_format', response_format);
  if (temperature !== undefined) formData.append('temperature', temperature.toString());
  if (timestamp_granularities && response_format === 'verbose_json') {
    timestamp_granularities.forEach(granularity => {
      formData.append('timestamp_granularities[]', granularity);
    });
  }

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
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
  
  const result = await response.json();
  return result;
}