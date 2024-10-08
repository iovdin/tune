import { execSync } from 'node:child_process';

export default async function sh({ text }) {
  return execSync(text, { encoding: "utf8" });
}
