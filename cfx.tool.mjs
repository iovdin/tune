export default async function generateSound({ text, duration_seconds }, ctx) {
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ctx.env.ELEVENLABS_KEY // Use variable for API key
    },
    body: JSON.stringify({ text, duration_seconds })
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
