import { File } from 'buffer';
export default async function transcribeAudio({ file }, ctx) {
    const url = "https://api.groq.com/openai/v1/audio/transcriptions";

    const formData = new FormData();
    const filename = ctx.resolve(file);
    let buf = ctx.read(filename);
    buf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    formData.append('file', new File([buf], file));
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'text');
  
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        "Authorization": `Bearer ${ctx.env.GROQ_KEY}`
      },
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText} ${await response.text()}`);
    }
  
    return await response.text();
  }