import fs from 'fs';
export default async function yandexTTS({ text, voice, filename }, ctx) {
  const key = await ctx.read("YC_TOKEN");
  const folderId = await ctx.read("YC_FOLDER_ID")
  const [v, r] = voice.split("-")
  const hints = [{ voice: v}]
  if (r) {
    hints.push({ role: r})
  }
  const response = await fetch("https://tts.api.cloud.yandex.net/tts/v3/utteranceSynthesis", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "x-folder-id": folderId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      hints
    }),
  });


  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(`Error: ${response.status} ${response.statusText}\n${error.message}`);
  }
  const result =  await response.json()
  await ctx.write(filename, Buffer.from(result.result.audioChunk.data, 'base64'));
  return "speech generated"
}
