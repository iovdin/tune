function parse(text) {
  const lines = text.split("\n").map(item => item.trim()).filter(item => item);
  return lines.reduce((memo, line) => { 
    const idx = line.indexOf("-")
    if (idx === -1) return memo
    const status = line.slice(0, idx).trim()
    const task = line.slice(idx+1).trim()
    memo[task] = status
    return memo
  }, 
    {})
}
export default async function list({text, filename}, ctx) {
  let todo = parse(await ctx.read(filename) || "")
  const changes = parse(text)
  todo = { ...todo, ...changes }
  todo = Object.keys(todo).map(key => `${todo[key]} - ${key}`).join("\n")
  await ctx.write(filename, todo)
  return "list updated"
}
