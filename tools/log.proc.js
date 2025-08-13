const fs = require("fs")
const path = require("path")

module.exports = async (node, args, ctx)  => ({
  ...node,
  exec: async function(payload, ctx) {
    const res = await node.exec(payload, ctx)
    const body = JSON.parse(res.body)
    payload = {...res, body};
    const filename = args.trim() || "log.json"
    const content =  path.extname(filename) == ".chat" ? ctx.msg2text(payload.body.messages, true) : JSON.stringify(payload, null, "  ") 
    fs.writeFileSync(filename, content);
    return res
  }
})
