export default async function searchWeb({ query }) {
    const url = `https://s.jina.ai/${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }