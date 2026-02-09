var assert, tune, rpc, path, fs, os, cp, stream;
assert = require("assert");

function tpl(str) {
  var _i;
  var params = 2 <= arguments.length ? [].slice.call(arguments, 1, _i = arguments.length - 0) : (_i = 1, []);
  return (function(paramIndex, params) {
    var _ref;
    try {
      _ref = str.replace(/{(\W*)(\w*)(\W*)}/gm, (function(_, pre, name, post) {
        return (function(res) {
          paramIndex += 1;
          return ((typeof res !== 'undefined') ? ((pre || "") + res + (post || "")) : "");
        })(params[name || paramIndex]);
      }));
    } catch (e) {
      _ref = console.log.apply(console, [].concat([e, str]).concat(params));
    }
    return _ref;
  })(0, (((typeof params[0] === "object") && (params.length === 1)) ? params[0] : params));
}

function showHelp() {
  console.log("TUNE-CLI - Command Line Interface for Tune SDK");
  console.log("");
  console.log("USAGE:");
  console.log("  tune-sdk [cmd] [OPTIONS]");
  console.log("");
  console.log("COMMANDS:");
  console.log("  rpc                   Start RPC server mode");
  console.log("  init                  Initialize Tune config directory");
  console.log("");
  console.log("EXAMPLES:");
  console.log("  # Quick chat with system prompt");
  console.log("  tune-sdk --system \"You are Groot\" --user \"Hi how are you?\"");
  console.log("");
  console.log("  # Continue existing chat");
  console.log("  tune-sdk --user \"continue the conversation\" --filename chat.chat --save");
  console.log("");
  console.log("  # Set context variables");
  console.log("  tune-sdk --set-test=hello --user \"@test\" --system \"Echo assistant\"");
  console.log("");
  console.log("  # RPC mode for editor integration");
  console.log("  tune-sdk rpc");
  console.log("");
  console.log("  # Initialize or reinitialize config directory");
  console.log("  tune-sdk init --force");
  console.log("");
  console.log("OPTIONS:");
  console.log("  --user <text>         User message to send");
  console.log("  --system <text>       System prompt to use");
  console.log("  --filename <file>     Chat file to load/save");
  console.log("  --save                Save conversation to file");
  console.log("  --stop <mode>         Stop condition: assistant|step|<custom>");
  console.log("  --text <content>      chat content");
  console.log("  --response <type>     Response format: content|json|messages|chat (default: content)");
  console.log("  --set-<name>=<value>  Set context parameter");
  console.log("  --path <paths>        Additional search paths (colon-separated)");
  console.log("  --home <dir>          Tune config directory (default: ~/.tune)");
  console.log("  --debug               Enable debug output");
  console.log("  --silent              Suppress output");
  console.log("  --force               Force config initialization (with 'init')");
  console.log("  --help                Show this help");
  console.log("  --version             Show CLI version");
  return console.log("");
}
showHelp;

function validateArgs(args) {
  assert(!!args && (typeof args === "object"), "Arguments must be an object");
  if (args.user) assert(typeof args.user === "string", "--user must be a string");
  if (args.system) assert(typeof args.system === "string", "--system must be a string");
  if (args.filename) assert(typeof args.filename === "string", "--filename must be a string");
  if (args.text) assert(typeof args.text === "string", "--text must be a string");
  if (args.response) assert(typeof args.response === "string", "--response must be a string");
  if (args.stop) assert(typeof args.stop === "string", "--stop must be a string");
  if (args.path) assert(typeof args.path === "string", "--path must be a string");
  if (args.home) assert(typeof args.home === "string", "--home must be a string");
  if (!!args.save) assert(typeof args.save === "boolean", "--save must be a boolean");
  if (!!args.debug) assert(typeof args.debug === "boolean" || typeof args.debug === "string", "--debug must be a boolean");
  if (!!args.silent) assert(typeof args.silent === "boolean", "--silent must be a boolean");
  if (!!args.force) assert(typeof args.force === "boolean", "--force must be a boolean");
  if (typeof args.rpc !== "undefined") assert(false, "Use 'tune-sdk rpc' instead of --rpc");
  if (typeof args.forceInit !== "undefined") assert(false, "Use 'tune-sdk init --force' instead of --force-init");
  if (args.params) assert(!!args.params && (typeof args.params === "object"), "--set-* parameters must form a valid object");
  if ((args.stop && (typeof args.stop === "string"))) assert((args.stop === "assistant") || (args.stop === "step") || (args.stop.length > 0), "--stop must be 'assistant', 'step', or a non-empty custom string");
  if (args.cmd) {
    assert(typeof args.cmd === "string", "Command must be a string");
    assert((args.cmd === "rpc") || (args.cmd === "init"), "Unknown command: " + args.cmd);
  }
  if ((!args.help && !args.version && !args.cmd && !args.user && !args.filename && !args.text)) assert(false, "Must specify --user, --filename, a command (rpc|init), --version, or --help");
  return args;
}
validateArgs;

function parseArgs(args) {
  var curKey, res, res1, key, value, stop, _ref, _len;
  assert(Array.isArray(args), "parseArgs expects an array of arguments");
  var curKey;
  curKey = null;
  var res;
  res = args.reduce((function(memo, arg) {
    var key, value, _ref, _i;
    assert(typeof arg === "string", "Each argument must be a string");
    if (arg.startsWith("--")) {
      _ref = arg.substring(2)
        .split("=");
      key = _ref[0];
      value = _ref[1];
      assert((typeof key === "string") && (key.length > 0), "Argument key must be a non-empty string");
      if (!!value) {
        memo[key] = value;
        curKey = null;
      } else {
        curKey = key;
        memo[key] = true;
      }
    } else if (curKey) {
      memo[curKey] = arg;
      curKey = null;
    } else {
      if (!memo.__cmd) {
        memo.__cmd = arg;
      } else {
        assert(false, "Only a single positional command is allowed");
      }
    }
    return memo;
  }), {});
  assert(!!res && (typeof res === "object"), "Parsed arguments must form an object");
  var res1;
  res1 = {};
  _ref = res;
  for (key in _ref) {
    value = _ref[key];
    assert(typeof key === "string", "Argument keys must be strings");
    if (key === "__cmd") {
      res1.cmd = value;
      continue;
    }
    if (key.startsWith("set-")) {
      res1.params = res1.params || {}
      assert(key.substr(4).length > 0, "Set parameter name cannot be empty");
      res1.params[key.substr(4)] = value;
    } else {
      res1[key] = value;
    }
  }
  if ((res1.h || res1.help)) res1.help = true;
  if ((res1.v || res1.version)) res1.version = true;
  stop = res1.stop;
  if ((!!stop && (stop !== "step" && stop !== "assistant"))) {
    assert(typeof stop === "string", "Custom stop condition must be a string");
    assert(stop.length > 0, "Custom stop condition cannot be empty");
    res1.stop = (function(msgs) {
      var lastMsg;
      assert(Array.isArray(msgs), "Messages must be an array");
      if (!msgs.length) return false;
      var lastMsg;
      lastMsg = msgs["slice"](-1)[0];
      assert(!!lastMsg && (typeof lastMsg === "object"), "Last message must be an object");
      if (!lastMsg.content) return false;
      assert(typeof lastMsg.content === "string", "Message content must be a string");
      return (-1 !== lastMsg.content.indexOf(stop));
    });
  }
  return res1;
}
parseArgs;
tune = require("../dist/tune.js");
rpc = require("../src/rpc.js");
path = require("path");
fs = require("fs");
os = require("os");
cp = require("child_process");
stream = require("stream");

function getHomedir(args) {
  assert(!!args && (typeof args === "object"), "getHomedir expects args to be an object");
  if (args.home) assert(typeof args.home === "string", "args.home must be a string");
  return path.resolve(path.normalize((args.home || process.env.TUNE_HOME || "~/.tune")
    .replace("~", os.homedir())));
}
getHomedir;
async function initConfig(args) {
  var homedir, stdout, stderr, _ref, _i;
  assert(!!args && (typeof args === "object"), "initConfig expects args to be an object");
  var homedir;
  homedir = getHomedir(args);
  assert(typeof homedir === "string", "Home directory must be a string");
  if ((!args.force && fs.existsSync(homedir))) return;
  console.error("[tune-sdk] initialize " + homedir);
  fs.mkdirSync(homedir, {
    recursive: true
  });
  console.error("[tune-sdk] copying files");
  fs.cpSync(path.resolve(__dirname, "../config"), path.resolve(homedir), { recursive: true });
  console.error("[tune-sdk] installing npm");
  try {
    _ref = cp.execSync("npm i", {
      cwd: homedir,
      encoding: "utf8"
    });
    stdout = _ref;
    if (stdout.trim()) console.error("[tune-sdk]", stdout.trim());
    //stderr.trim() ? console.error("[tune-sdk]", stderr.trim()) : undefined;
  } catch (err) {
    console.error(err)
  }
  console.error("[tune-sdk] done");
  console.error(`[tune-sdk] edit ${homedir}/.env and add OPENAI_KEY and other keys, change ${homedir}/default.ctx.js to customize tune`);
}
initConfig;
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
suggest;
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
remoteContext;
async function runRpc(args) {
  var inStream, outStream, debugStream, ctx, server;
  inStream = stream.Readable.toWeb(process.stdin);
  outStream = stream.Writable.toWeb(process.stdout);
  debugStream = ((typeof args.debug === "string") ? fs.createWriteStream(args.debug, {
    flags: "a"
  }) : undefined);
  ctx = await initContext(args);
  let cleanCtx = ctx.clone()
  server = rpc.jsonrpc({
    inStream: inStream,
    outStream: outStream,
    debug: ((typeof args.debug === "string") ? (function() {
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
        if (!node) {
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
runRpc;
async function run(args) {
  var ctx, stop, params, res;
  ctx = await initContext(args);
  var stop;
  stop = args.stop || "assistant";
  var params;
  params = args.params || {}
  delete args.params;
  var res;
  res = await ctx.file2run({ ...args, errors: "message", stop }, params);
  return (!args.silent ? console.log(res) : undefined);
}
run;

function flatten(array) {
  return array.reduce((memo, item) => {
    if (Array.isArray(item)) {
      return memo.concat(item)
    }
    memo.push(item)
    return memo
  }, [])
}

async function initContext(args) {
  var dirs, pwd, ctx, dir, ctxName, ext, module, m, _i, _ref, _len, _i0, _ref0, _len0;
  var dirs;
  var pwd;
  dirs = [];
  pwd = process.cwd();
  if (args.path) dirs = args.path.split(path.delimiter)
    .map((function(dir) {
      return path.resolve(pwd, dir);
    }));
  dirs.push(getHomedir(args));
  dirs.unshift(pwd);
  if (process.env.TUNE_PATH) {
    dirs = dirs.concat(process.env.TUNE_PATH.split(path.delimiter))
  }
  process.env.TUNE_PATH = dirs.join(path.delimiter);
  ctx = tune.makeContext({
    TUNE_PATH: process.env.TUNE_PATH,
    TUNE_HOME: getHomedir(args)
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
          throw Error(tpl("err: Context file export is not an array of functions or function {name}: {module}", {
            name: ctxName,
            module: m
          }));
        }
      }
    } else {
      throw Error(tpl("err: Context file export is not an array of functions or function {name}: {module}", {
        name: ctxName,
        module: module
      }));
    }
  }
  return ctx;
}
initContext;
async function main() {
  var args, _ref;
  try {
    var args;
    args = parseArgs(process.argv.slice(2));
    if (args.help) {
      showHelp();
      process.exit(0);
    }
    if (args.version) {
      try {
        var pkg = require(path.resolve(__dirname, "../package.json"));
        console.log(pkg.version || "0.0.0");
      } catch (e) {
        console.log("0.0.0");
      }
      process.exit(0);
    }
    validateArgs(args);
    if (args.cmd === "rpc") {
      await initConfig(args); // ensure config exists if needed
      _ref = await runRpc(args);
    } else if (args.cmd === "init") {
      await initConfig(args);
      _ref = null;
    } else {
      await initConfig(args); // auto-init if missing
      _ref = await run(args);
    }
  } catch (e) {
    console.error(e.stack);
    _ref = process.exit(1);
  }
  return _ref;
}
main;

tpl;
exports.parseArgs = parseArgs;
exports.rpc = rpc;
exports.main = main;
exports.run = run;
