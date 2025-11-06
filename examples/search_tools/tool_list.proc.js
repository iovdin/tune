module.exports = async function toolList(node, args, ctx) {
  const tools = await ctx.resolve(".*", {
    type: "tool", 
    output: "all",
    match: "regex"
  })

  return {
    type: "text",
    read: async () => 
      tools.map(tool => `## tool: '${tool.name}'\n${tool.schema?.description}\n` ).join("\n")

  }
}
