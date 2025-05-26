import fs from "node:fs/promises";

// Patch tool to apply custom diffs marked with <<<<<<< ORIGINAL and >>>>>>> UPDATED
// Handles patches with context and applies only the segments between markers.

export default async function patch({ text, filename }, ctx) {
  // Regex to match each patch block
  const patchRegex = /<<<<<<< ORIGINAL[^\n]*\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> UPDATED[^\n]*(?:\n|$)/g;
  const patches = [];
  let match;

  // Extract all old/new segments
  while ((match = patchRegex.exec(text)) !== null) {
    const oldPart = match[1].replace(/^\n+|\n+$/g, "");
    const newPart = match[2].replace(/^\n+|\n+$/g, "");
    patches.push({ oldPart, newPart });
  }

  if (patches.length === 0) {
    throw new Error("No valid patch segments found");
  }

  let fileContent = await ctx.read(filename);

  for (const { oldPart, newPart } of patches) {
    // Escape regex special chars in oldPart, then allow flexible whitespace
    const escaped = oldPart
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    const oldRegex = new RegExp(escaped, "g");

    // Perform replacement using a function to avoid replacement string ambiguities
    fileContent = fileContent.replace(oldRegex, () => newPart);
  }

  await ctx.write(filename, fileContent);
  return "patched";
}
