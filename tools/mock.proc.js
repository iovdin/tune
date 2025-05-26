module.exports = async function mock(node, args, ctx) {
  const re = /(?<name>\w+)\s*=/
  let lastName;
  let m;
  let text = args;
  const vars = {};
  while ((m = re.exec(text)) !== null) {
    const { name } = m.groups

    if (lastName) {
      vars[lastName] = text.slice(0, m.index).trim()
    }
    text = text.slice(m.index + m[0].length)
    lastName = name
  }
  if (lastName) {
    vars[lastName] = text.trim()
  }
  ctx.use((name, ctx, args)=> {
    if (!vars.hasOwnProperty(name)) {
      return 
    }
    return {
      ...node,
      type: "text",
      name,
      read: async () => vars[name]
    }
  })
  return { 
    ...node,
    type: "text", 
    read: async() => ""
  }
}
