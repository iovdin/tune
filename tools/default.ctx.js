const fs = require('fs') 
const path = require('path')

const { runFile, fsctx } = require("../dist/fsctx.js");

async function makeSchema(params, ctx) {
  return runFile(path.join(__dirname, "schema.tool.chat"), ctx, params);
}
let dirs = [];
if (process.env.TUNE_PATH) {
  dirs = process.env.TUNE_PATH.split(path.delimiter);
}


module.exports = [
  async function filename(name, params) {
    if (!this.stack || !this.stack.length) {
      return
    }
    const { filename } = this.stack[0];
    let value
    switch(name) {
      case "__filename": 
        value = filename
        break
      case "__dirname":
        value = path.dirname(filename)
        break
      case "__basename":
        value = path.basename(filename)
        break
      case "__name":
        value = path.parse(filename).name
        break
      case "__ext":
        value = path.parse(filename).ext
        break
      default:
        break
    }
    if (value) {
      return {
        type: "text",
        read: async () => value
      }
    }
    return
  },
  fsctx(dirs, { makeSchema }),
  require("./openai.ctx.js"),
  require("./openrouter.ctx.js"),
  require("./antrophic.ctx.js"),
  require("./gemini.ctx.js"),
  require("./mistral.ctx.js"),
  require("./groq.ctx.js"),
  async function write(filename, data) {
    const directory = path.dirname(filename);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(filename, data)
  }
];
