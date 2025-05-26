import { promises as fs } from 'fs';
import path from 'path';

export default async function writeFile({ filename, text }) {
  // Ensure that directory exists
  const directory = path.dirname(filename);
  await fs.mkdir(directory, { recursive: true }).catch(err => {
    // Ignore error if directory already exists
    if (err.code !== 'EEXIST') throw err;
  });
  
  // Write file
  await fs.writeFile(filename, text, 'utf8');
  return `written`;
}

