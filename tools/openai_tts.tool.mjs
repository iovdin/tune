import fs from 'fs';
export default async function openaiTTS({ text, voice, instructions, filename }, ctx) {
  const key = await ctx.read("OPENAI_KEY");
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "model": "gpt-4o-mini-tts",
      input: text,
      instructions,
      voice: voice
    }),
  });


  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(`Error: ${response.status} ${response.statusText}\n${error.message}`);
  }
  const buf = await response.arrayBuffer();
  await ctx.write(filename, Buffer.from(buf));
  return "speech generated"
}
