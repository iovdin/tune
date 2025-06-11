import { relative, dirname } from 'path' 

export default async function readFile({ filename, linenum }, ctx) {
  const resolved = await ctx.resolve(filename)
  if (!resolved) {
    return "File not found"
  }
  const relFile = relative(process.cwd(), filename)
  const path = [ relFile ]
  if (resolved.type !== 'text') {
    path.push('text')
  }
  if (linenum) {
    path.push('linenum')
  }
  if (path.length > 1) {
    return`@\{ ${path.join(" | ")} \}`;
  }
  return `@${relFile}`;

}
