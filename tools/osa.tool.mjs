import { execSync } from 'node:child_process';
import util from 'node:util'

export default async function osa({ text }) {
  let result = ""
  try {
    result = execSync("osascript -", { input: text, encoding: "utf8" })
  } catch (e) {
    result = e.stderr + e.stdout
  }
  return (result || "").replaceAll("@", "\\@");
}
