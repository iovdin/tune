#!/usr/bin/env node

// Minimal inline argument parser
const args = {};
let currentKey = null;

process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    if (typeof value !== 'undefined') {
      args[key] = value;
      currentKey = null;
    } else {
      currentKey = key;
      args[currentKey] = true
    }
  } else if (currentKey) {
    args[currentKey] = arg;
    currentKey = null;
  }
});

const tune = require('../dist/tune.js');
const { fsctx } = require('../dist/fsctx.js');
const fs = require("fs"); 
const path = require("path");

async function main() {
  try {
    let chat = ""
    // where to search for inclusions
    let dirs = [];

    if (args.filename && fs.existsSync(args.filename)) {
      chat = fs.readFileSync(args.filename, "utf8")
      dirs.push(path.dirname(path.resolve(args.filename)))
    }

    if (!chat && args.system) {
      chat = `system:\n${args.system}`
    }

    if (args.user) {
      chat = `${chat}\nuser:\n${args.user}`
    }

    if(process.env.TUNE_PATH) {
      dirs = dirs.concat(process.env.TUNE_PATH.split(path.delimiter))
    }

    dirs.push(process.cwd())

    const ctx = tune.makeContext(process.env)
    if (args.filename) {
      ctx.stack.push({ 
        filename: args.filename,
        name: path.basename(args.filename),
        dirname: path.dirname(path.resolve(args.filename))
      })
    }
    ctx.use(fsctx(dirs))

    for (const dir of dirs) {
      let filename = ["default.ctx.js", "default.ctx.cjs", "default.ctx.mjs"].find(name  => fs.existsSync(path.join(dir, name)));
      if (!filename) continue;
      filename = path.join(dir, filename);
      let ext = path.extname(filename);
      let module
      if ((ext === ".js" || ext === ".cjs")) {
        module = require(filename);
      } else {
        module = await import(filename);
        module = module.default;
      }
      if (typeof module === "function") {
        ctx.use(module);
      } else if (Array.isArray(module)) {
        for (const m of module) {
          if (typeof m === "function") {
            ctx.use(m)
          } else {
            throw(Error(`err: Context file export is not an array of functions or function ${filename}`))
          }
        }
      } else {
        throw(Error(`err: Context file export is not an array of functions or function ${filename}`))
      }
    }
    let stopVal = args.stop || "assistant";
    if (stopVal !== "step" && stopVal != "assistant") {
      stopVal = function(msgs) {
        if (!msgs.length) return false
        const lastMsg = msgs[msgs.length - 1]
        if (!lastMsg.content) return false
        return (lastMsg.content.indexOf(args.stop) !== -1)
      }
    }

    let res = await tune.text2run(chat, ctx, { stop: stopVal })

    const longFormatRegex = /^(system|user|tool_call|tool_result|assistant|error):/;
    res = tune.msg2text(res, longFormatRegex.test(chat))
    if (args.filename && args.save) {
      chat += "\n" + res 
      fs.writeFileSync(args.filename, chat)
    }
    if (!args.save) {
      console.log(res)
    }
  } catch (e) {
    console.error(e)
  }
}

main()
