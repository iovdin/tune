import { spawnSync } from 'node:child_process';
import util from 'node:util'

export default async function nu({ text }) {
  let result = ""
  try {
    result =  spawnSync("nu", 
      ["-c", text, "--error-style", "plain"], 
      { encoding: "utf8", shell: false })
  } catch (e) {
    result = e.stderr + e.stdout
  }
  return (result.stdout || result.stderr || "").replaceAll("@", "\\@");
}
