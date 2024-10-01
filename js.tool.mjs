import { spawnSync } from 'node:child_process';

/**
 * Executes JavaScript code.
 * @param {Object} params - The parameters for the tool.
 * @param {string} params.code - The JavaScript code to execute.
 * @returns {string} - The output from executing the JavaScript code.
 */
export default async function jsExec({ text }) {
  const res = spawnSync("node", ["-e", text], { encoding: "utf8" });
  return (res.stdout || res.stderr || "").trim();
}