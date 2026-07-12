const { Command, Option } = require("commander");
const tune = require("../dist/tune.js");
const ws = require("./ws.js");
const rpc = require("./rpc.js");
const path = require("path");
const fs = require("fs");
const os = require("os");
const cp = require("child_process");
const stream = require("stream");

// tune app - run web server from current directory serving index.html and making it availble to call ctx via websocket
// tune ps - list of executing agents or the ones finished
// tune spawn - spawn an agent
// tune kill - kill/stop agent
// tune serve - tune manage server, run in background and spawn agents 
// tune  - execute call/file and quit
// tune rpc - run rpc server

function getHomedir(home) {
  return path.resolve(path.normalize((home || process.env.TUNE_HOME || "~/.tune")
    .replace("~", os.homedir())));
}


function readStdin() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) return resolve("");
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => data += chunk);
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function parseToolArgs(argv) {
  return argv.reduce((memo, item) => {
    if (!item.startsWith("--")) return memo;
    const arg = item.slice(2);
    const eq = arg.indexOf("=");
    if (eq === -1) {
      memo[arg] = true;
      return memo;
    }
    const key = arg.slice(0, eq);
    const value = arg.slice(eq + 1);
    memo[key] = value;
    return memo;
  }, {});
}
async function initConfig({ home, force }) {
  let stdout, stderr, _i;
  const homedir = getHomedir(home);
  if (!force && fs.existsSync(homedir)) return;
  console.error("[tune] initialize " + homedir);
  fs.mkdirSync(homedir, {
    recursive: true
  });
  console.error("[tune] copying files");
  fs.cpSync(path.resolve(__dirname, "../config"), path.resolve(homedir), { recursive: true });
  console.error("[tune] installing npm");
  try {
    stdout = cp.execSync("npm i", {
      cwd: homedir,
      encoding: "utf8"
    });
    if (stdout.trim()) console.error("[tune]", stdout.trim());
    //stderr.trim() ? console.error("[tune]", stderr.trim()) : undefined;
  } catch (err) {
    console.error(err)
  }
  console.error("[tune] done");
  console.error(`[tune] edit ${homedir}/.env and add OPENAI_KEY and other keys, change ${homedir}/default.ctx.js to customize tune`);
}

async function suggest(params, ctx) {
  var node, _ref;
  var node;
  node = await ctx.resolve(params.query, {
    output: "all",
    match: "regex"
  });
  if (!node) {
    _ref = [];
  } else if (!Array.isArray(node)) {
    _ref = Array(node);
  } else {
    _ref = node;
  }
  node = _ref;
  return node.map((function(item) {
    return {
      name: item.name,
      dirname: item.dirname,
      source: item.source || item.fullname,
      fullname: item.fullname,
      basename: (item.fullname ? path.basename(item.fullname) : undefined),
      type: item.type
    }
  }));
}

async function remoteContext(name, params) {
  var server, node;
  var server;
  server = this;
  var node;
  node = await server.resolve({
    name: name,
    params: params
  });
  if (!node) return
  // backward compatible, remove in the future
  if (node.error) return

  node.read = (function() {
    return server.read({
      name: name,
      params: params
    });
  });
  node.exec = (function() {
    return server.exec({
      name: name,
      params: params
    });
  });
  return node;
}

async function runRpc({ debug, home, path }) {
  var inStream, outStream, debugStream, ctx, server;
  inStream = stream.Readable.toWeb(process.stdin);
  outStream = stream.Writable.toWeb(process.stdout);
  debugStream = ((typeof debug === "string") ? fs.createWriteStream(debug, {
    flags: "a"
  }) : undefined);
  ctx = await initContext({ home, path });
  let cleanCtx = ctx.clone()
  server = rpc.jsonrpc({
    inStream: inStream,
    outStream: outStream,
    debug: ((typeof debug === "string") ? (function() {
      var _i;
      var args = 1 <= arguments.length ? [].slice.call(arguments, 0, _i = arguments.length - 0) : (_i = 0, []);
      return debugStream.write(args.join(" ") + "\n", "utf8");
    }) : true),
    name: "server"
  }, {
      init: (async function(methods) {
        if ((-1 !== methods.indexOf("resolve"))) ctx.use(remoteContext.bind(server));
        return;
      }),
      resolve: async function(name, params) {
        const node = await cleanCtx.resolve(name, params)
        delete node.exec
        delete node.read
        return node 
      },
      read: async function read(name) {
        const node = await cleanCtx.resolve(name)
        if (!node || node.type === 'image') {
          return ""
        }
        // todo binary
        return node.read()
      },

      write: async function write(name, content) {
        return cleanCtx.write(name, content)
      },
      exec: async function exec(name, params) {
        const node  = await cleanCtx.resolve(name)
        if (!node) {
          throw Error(`cant execute ${name} - not found`)
        }
        return node.exec(params, cleanCtx)
      },
      file2run: (async function(params, stream) {
        // backward compatibility
        let payload = params
        let args = {}
        if (params.payload) {
          payload = params.payload
          args = params.params
        }
        return ctx.file2run({
          ...payload, 
          errors: "message",
          stream
        }, args);
      }),
    suggest: (async function(params) {
      return suggest(params, ctx);
    })
  });
  // const node = await server.resolve("OLLAMA_URL")
  // console.log("node", node)
  return null;
}
async function run({ home, stop, params, silent, user, system, save, text , response, path, filename }) {
  const ctx = await initContext({ home, path });
  const res = await ctx.file2run({ user, system, save, text, response, errors: "message", stop, filename }, params);
  if (!silent) {
    console.log(res)
  }
}

async function toolCall({ home, path: addPaths, toolName, args, silent }) {
  const ctx = await initContext({ home, path: addPaths });
  const node = await ctx.resolve(toolName);

  if (!node) {
    throw Error(`tool not found: ${toolName}`);
  }

  if (node.type !== "tool") {
    throw Error(`resolved node is not a tool: ${toolName} (${node.type})`);
  }

  const stdinText = await readStdin();
  if (stdinText && typeof args.text === "undefined") {
    args.text = stdinText;
  }

  const res = await node.exec(args, ctx);
  if (!silent && typeof res !== "undefined") {
    console.log(res);
  }
}

function flatten(array) {
  return array.reduce((memo, item) => {
    if (Array.isArray(item)) {
      return memo.concat(item)
    }
    memo.push(item)
    return memo
  }, [])
}

async function initContext({ home, path: addPaths }) {
  var dirs, pwd, ctx, dir, ctxName, ext, module, m, _i, _ref, _len, _i0, _ref0, _len0;
  var dirs;
  var pwd;
  dirs = [];
  pwd = process.cwd();
  if (addPaths) dirs = addPaths.split(path.delimiter)
    .map((function(dir) {
      return path.resolve(pwd, dir);
    }));
  dirs.push(getHomedir(home));
  dirs.unshift(pwd);
  if (process.env.TUNE_PATH) {
    dirs = dirs.concat(process.env.TUNE_PATH.split(path.delimiter))
  }
  process.env.TUNE_PATH = dirs.join(path.delimiter);
  ctx = tune.makeContext({
    TUNE_PATH: process.env.TUNE_PATH,
    TUNE_HOME: getHomedir(home)
  });
  _ref = dirs;
  for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
    dir = _ref[_i];
    var ctxName;
    ctxName = ["default.ctx.js", "default.ctx.cjs", "default.ctx.mjs"]
      .map((function(name) {
        return path.join(dir, name);
      }))
      .find((function(name) {
        return fs.existsSync(name);
      }));
    if (!ctxName) continue;
    var ext;
    var module;
    ext = path.extname(ctxName);
    module = null;
    if ((ext === ".js" || ext === ".cjs")) {
      module = require(ctxName);
    } else {
      module = await import(ctxName);
      module = module.default;
    }
    if ((typeof module === "function")) {
      ctx.use(module);
    } else if (Array.isArray(module)) {
      _ref0 = module.flat(Infinity);
      for (_i0 = 0, _len0 = _ref0.length; _i0 < _len0; ++_i0) {
        m = _ref0[_i0];
        if ((typeof m === "function")) {
          ctx.use(m);
        } else {
          throw Error(`err: Context file export is not an array of functions or function ${ctxName}: ${m}`);
        }
      }
    } else {
      throw Error(`err: Context file export is not an array of functions or function ${ctxName}: ${m}`);
    }
  }
  return ctx;
}
async function main() {

  let version = "0.0.0";
  try {
    var pkg = require(path.resolve(__dirname, "../package.json"));
    version = pkg.version || "0.0.0"
  } catch (e) {
  }

  const program = new Command();

  program
    .name("tune")
    .description("Command Line Interface for Tune")
    .version(version)
    .helpOption(true)
    .option("--home <dir>", "Tune config directory (default: ~/.tune)")
    .option("--path <paths>", "Additional search paths (colon-separated)")
    .addHelpText("after", "\nEXAMPLES:\n  tune --system \"You are Groot\" --user \"Hi how are you?\"\n  tune --user \"continue the conversation\" --filename chat.chat --save\n  tune --set test=hello --user \"@test\" --system \"Echo assistant\"\n  tune rpc\n  tune init --force\n");

  program
    .command("gen", { isDefault: true })
    .description("start or continue ai conversation,\ndefault command")
    .argument("[user]", "user message, the same as --user", (value) => value.replace(/\\n/g, "\n"))
    .option("-u, --user <text>", "User message ", (value) => value.replace(/\\n/g, "\n"))
    .option("-s, --system <text>", "System prompt to use", (value) => value.replace(/\\n/g, "\n"))
    .option("-f, --filename <file>", "Chat file to load/save")
    .option("--save", "Save conversation to file")
    .addOption(new Option("--stop <mode>", "Stop condition", "assistant").choices(["assistant", "step"]).default("assistant"))
    .option("--text <content>", "chat file content, overwrites system message", (value) => value.replace(/\\n/g, "\n"))
    .addOption(new Option("-r, --response <type>", "response format").choices(["content", "json", "messages", "chat"]).default("content"))
    .option("--silent", "generate response but do not print it")
    .option("--set [params...]", "set a template variables, --set a=b --set c=d")
    .action(async (user, opts, cmd) => {
      opts = { ...opts, ...cmd.parent.opts() }
      opts.user ||= user
      opts.params = (opts.set || []).reduce((memo, item) => {
        const [key, value] = item.split("=");
        memo[key] = value
        return memo
      }, {})
      // console.log("gen ", opts)
      if (!opts.user && !opts.text && !opts.filename && !opts.system) {
        return cmd.help();
      }

      await initConfig({ home: opts.home });
      await run(opts);
    })

  program
    .command("rpc")
    .description("Start rpc server mode over stdio")
    .option("-d, --debug [file]", "Enable debug output or write debug output to file")
    .action(async (opts, cmd) => {
      opts = { ...opts, ...cmd.parent.opts() }
      // console.log(opts)
      await initConfig(opts); // ensure config exists if needed
      await runRpc(opts);
    })

  program
    .command("ws")
    .description("Start static webserver with tune context available browser side")
    .option("-p, --port <port>", "port or socket to listen to", 8080)
    .option("-s, --static", "should it serve static files like index.html etc", true)
    .option("-r, --root <path>", "root directory for server", process.cwd())
    .action( async (opts, cmd) => {
      opts = { ...opts, ...cmd.parent.opts() }
      // console.log(opts)
      const { home, path, static, port, root } = opts
      
      await initConfig({ home });

      const ctx = await initContext({ home, path });
      ws({ port, static, root, ctx})
    })


  program
    .command("tc")
    .alias("tool-call")
    .description("Resolve a tool from context and execute it with --key=value args, reading text from stdin/pipe into text param")
    .argument("<toolName>", "Tool name to resolve and execute")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action(async (toolName, opts, cmd) => {
      opts = { ...opts, ...cmd.parent.opts() };
      const rawArgs = cmd.parent.rawArgs;
      const tcIndex = rawArgs.findIndex(arg => arg === "tc" || arg === "tool-call");
      const args = parseToolArgs(tcIndex === -1 ? [] : rawArgs.slice(tcIndex + 2));
      await initConfig({ home: opts.home });
      await toolCall({
        home: opts.home,
        path: opts.path,
        toolName,
        args,
        silent: opts.silent
      });
    })

  program
    .command("init")
    .description("Initialize Tune config directory")
    .option("--force", "Force config initialization (with 'init')")
    .action(async (opts, cmd) => {
      opts = { ...opts, ...cmd.parent.opts() }
      await initConfig(opts);
    })

  try {
    await program.parseAsync(process.argv);
  }catch (e) {
    console.error(e.stack)
    process.exit(1)
  }
}

exports.rpc = rpc;
exports.main = main;
exports.run = run;
exports.ws = ws;
