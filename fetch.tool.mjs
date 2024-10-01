export default async function fetchFromUrl({ url }) {
  const wurl = `https://r.jina.ai/${url}`;
  
  const response = await fetch(wurl);
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.text();
}