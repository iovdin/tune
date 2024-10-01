import { parse } from 'url';
import { extname } from 'path';

export default async function generateImage({ text }, ctx) {
  const url = "https://api.openai.com/v1/images/generations";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ctx.env.OPENAI_KEY}`
    },
    body: JSON.stringify({
      prompt: text,
      n: 1,
      size: "1024x1024",
      ///response_format: "b64_json"
    })
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  const res = await response.json();
  const imUrl = res.data[0].url;
  const imr = await fetch(imUrl);
  if (!imr.ok) {
    throw new Error(`Error: ${imr.status} ${imr.statusText}`);
  }
  const content = await imr.arrayBuffer()
  return Buffer.from(content) 
}
