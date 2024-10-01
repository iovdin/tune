import { YoutubeTranscript } from 'youtube-transcript';

export default async function fetchAndStoreTranscript({videoId}) {
  const res = await YoutubeTranscript.fetchTranscript(videoId, {languages: ["en"]});
  return res.map(item => item.text).join("\n")
}
