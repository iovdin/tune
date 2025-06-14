const fs = require("fs")
module.exports = async (node, args, ctx)  => {
  const newNode = Object.assign({}, node);
  newNode.exec = async function(payload, ctx) {
    const res = await node.exec(payload, ctx)
    const body = JSON.parse(res.body)
    payload = {...res, body};
    fs.writeFileSync(args.trim() || "log.json", JSON.stringify(payload, null, "  "));
    return res
  }
  return newNode
}
