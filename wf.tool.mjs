import { promises as fs } from 'fs';

export default async function writeFile({ filename, text }) {
  await fs.writeFile(filename, text, 'utf8');
  return `File ${filename} written successfully.`;
}