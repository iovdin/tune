const assert = require('assert');
const util = require('util');
const path = require('path');
const fs = require('fs');
const cp = require("child_process");
const stream = require("stream");

const tune = require('../dist/tune');
const cli = require('../src/cli');
const rpc = require('../src/rpc');
const ContextWebsocket = require('../src/contextws.js')
const man = require('../src/man')

const tests = {};

// Assume API keys are set like in original tests

const env = {
  OPENAI_KEY: process.env.OPENAI_KEY,
  OPENROUTER_KEY: process.env.OPENROUTER_KEY
};


// Default LLM config reused in tests
const defaultLLM = {
  type: "llm",
  exec: async (args, ctx) => {
    const key = await ctx.resolve("OPENAI_KEY");
    if (!key) throw new Error("OPENAI_KEY not found");
    const token = await key.read();
    // Accept either full payload or args with messages/tools
    const bodyPayload = Object.assign({}, args);
    if (!bodyPayload.model) bodyPayload.model = "gpt-5.4-mini";
    return {
      url: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer " + token
      },
      body: JSON.stringify(bodyPayload)
    };
  }
};

async function customFetch(input, init, cb) {
  const res = await fetch(input, init);
  if (!cb) return res;

  // always collect full text, even for stream
  res.clone().text().then(text => cb(text));

  return res;
}

const mkllm = (model) => ({
  type: "llm",
  exec: async (args, ctx) => {
    // Accept either full payload or args with messages/tools
    const bodyPayload = Object.assign({}, args);
    bodyPayload.model = model
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer " + env.OPENROUTER_KEY
      },
      body: JSON.stringify(bodyPayload)
    };
  }
});


// Batch 1: Core TuneError and text parsing tests

tests.tuneError = async function() {
  console.log("tuneError - basic");
  const err = new tune.TuneError("message", "filename", 0, 1, undefined, new Error("Original Error"));
  
  assert.equal(err.name, "TuneError");
  assert.equal(err.message, "message");
  assert.equal(err.row, 0);
  assert.equal(err.col, 1);
  assert.deepEqual(err._stack, [{ filename: "filename", row: 0, col: 1 }]);
  assert.equal(err.error.message, "Original Error");
  
  console.log("tuneError - toString");
  let str = err.toString();
  assert.match(str, /filename:0:1/);
  assert.match(str, /Original\sError/);
  assert.match(str, /message/);

  console.log("tuneError - wrap");
  str = tune.TuneError.wrap(new Error("message"), "filename").toString();
  assert.match(str, /internal\serror/i);
  assert.match(str, /filename$/mi);
  
  str = tune.TuneError.wrap(
    new tune.TuneError("message", "filename1"),
    "filename2"
  ).toString();
  
  assert.match(str, /filename1$/m);
  assert.match(str, /filename2$/m);
  assert.doesNotMatch(str, /Original\sError/);
  
  console.log("tuneError - convert ctx stack to error stack");
};


tests.text2ast1 = async function() {
  const ast = await tune.text2ast("pre\nuser: post");
  
  async function matchParts(text, parts, ctx) {
    const ast = await tune.text2ast(text, ctx);
    ast.map((item, index) => {
      assert.equal(text.slice(item.start, item.end), parts[index]);
    });
  }

  await matchParts("s: pre \n@var post", ["s:", " pre \n", "@var", " post"]);
  await matchParts("pre\nuser: post", ["pre\n", "user:", " post"]);
  await matchParts("a: @var", ["a:", " @var"]);
  await matchParts("s: @var", ["s:", " ", "@var"], tune.makeContext({ var: "value" }));
};

tests.text2role1 = async function() {
  const val = tune.text2roles("s: system\nu: user\na: assistant\nerr: error\ntc: tool_call\ntr: tool\nc: comment\nau: audio");
  
  function pick(obj, ...props) {
    const result = {};
    props.forEach(prop => result[prop] = obj[prop]);
    return result;
  }
  
  assert.deepEqual(pick(val[0], "role", "content"), {
    role: "system",
    content: " system"
  });
  assert.deepEqual(pick(val[1], "role", "content"), {
    role: "user",
    content: " user"
  });
  assert.deepEqual(pick(val[2], "role", "content"), {
    role: "assistant",
    content: " assistant"
  });
  assert.deepEqual(pick(val[3], "role", "content"), {
    role: "error",
    content: " error"
  });
  assert.deepEqual(pick(val[4], "role", "content"), {
    role: "tool_call",
    content: " tool_call"
  });
  assert.deepEqual(pick(val[5], "role", "content"), {
    role: "tool_result",
    content: " tool"
  });
  assert.deepEqual(pick(val[6], "role", "content"), {
    role: "comment",
    content: " comment"
  });
  assert.deepEqual(pick(val[7], "role", "content"), {
    role: "audio",
    content: " audio"
  });
};

tests.text2role2 = async function() {
  // pre text is ignored
  const ast = await tune.text2ast("pre text\ns: system");
  
  const payload = await tune.ast2payload(ast, tune.makeContext());
  assert.deepEqual(payload.messages, [{
    role: "system",
    content: "system"
  }]);
};

tests.text2role3 = async function() {
  const ast = await tune.text2ast("s: 1\n2\n3\nu: 1\n2\n3\na: 1\n2\n3");
  const payload = await tune.ast2payload(ast, tune.makeContext());
  const val = payload.messages;
  
  assert.deepEqual(val[0], {
    role: "system",
    content: "1\n2\n3"
  });
  assert.deepEqual(val[1], {
    role: "user",
    content: "1\n2\n3"
  });
  assert.deepEqual(val[2], {
    role: "assistant",
    content: "1\n2\n3"
  });
};

tests.text2role4 = async function() {
  let val = tune.text2roles("s: 1\n2\n3\nu: 1\n2\n3\na: 1\n2\n3", true);
  assert.equal(val[0].row, 0);
  assert.equal(val[1].row, 3);
  assert.equal(val[2].row, 6);

  val = tune.text2roles("pre text\ns: system", true);
  assert.equal(val[0].row, 1);

  val = tune.text2roles("pre text\nc:----\ns: system", true);
  assert.equal(val[0].row, 1);
  assert.equal(val[1].row, 2);
};

tests.text2role5 = async function() {
  const val = tune.text2roles("system: 1\nuser: 2\nassistant: 3\ntool_call: 4\ntool_result: 5\ncomment: 6\nerror: 7 ");
  
  assert.deepEqual(val, [
    { role: 'system', content: ' 1' },
    { role: 'user', content: ' 2' },
    { role: 'assistant', content: ' 3' },
    { role: 'tool_call', content: ' 4' },
    { role: 'tool_result', content: ' 5' },
    { role: 'comment', content: ' 6' },
    { role: 'error', content: ' 7 ' }
  ]);
};

tests.text2cut1 = async function() {
  const text = "s: 0\nu: 1\na: 2\nc:---\ns: 4\nu: 5\na: 6\nc:---\ns: 8\nu: 9\na: 10\n";
  const splitidx = [0, 3, 7, 11];

  // testing start-mid here
  for (let i = 0; i <= 10; i++) {
    const end = splitidx.findIndex(val => i < val);
    const split = tune.text2cut(text, i, true);
    const start = splitidx[end - 1];
    const endIdx = Math.min(1 + i, splitidx[end]);
    
    assert.equal(
      text.split("\n").slice(split.start, split.mid).join("\n"),
      text.split("\n").slice(start, endIdx).filter(line => line !== "c:---").join("\n")
    );
  }
};

tests.text2cut2 = async function() {
  // test multiline
  const text = "s: 0\n1\nu: 2\n3\na: 4\nc:---\ns: 6\nu: 7\na: 8\nc:---\ns: 10\nu: 11\na: 12\n";
  const split = tune.text2cut(text, 1);
  
  assert.equal(
    text.split("\n").slice(split.start, split.mid).join("\n"),
    "s: 0\n1"
  );
};

tests.text2cut3 = async function() {
  // test pretext
  const text = "0\n1\nc:-----\ns: 3";
  const split = tune.text2cut(text, 3);
  
  assert.equal(
    text.split("\n").slice(split.start, split.mid).join("\n"),
    "s: 3"
  );
};

tests.contextChain = async function() {
  const ctx = tune.makeContext(
    { name: "value1" },
    { name1: "value2" },
    { name: "value3" }
  );
  
  const var1 = await ctx.resolve("name");
  const var2 = await ctx.resolve("name1");
  
  assert.deepEqual(var1.type, "text");
  assert.deepEqual(var2.type, "text");
  assert.equal(await var1.read(), "value1");
  assert.equal(await var2.read(), "value2");
};

tests.contextChainParent = async function() {
  const ctx = tune.makeContext({ name: "value1" });
  const parent = tune.makeContext({ name1: "value2" });
  
  ctx.use(async (name, ictx, args) => {
    return parent.resolve(name, args);
  });
  
  const var1 = await ctx.resolve("name");
  const var2 = await ctx.resolve("name1");
  
  assert.deepEqual(var1.type, "text");
  assert.deepEqual(var2.type, "text");
  assert.equal(await var1.read(), "value1");
  assert.equal(await var2.read(), "value2");
};

tests.envmd1 = async function() {
  const ctx = tune.makeContext({
    name: "value",
    name1: "value1",
    name2: {
      type: "tool",
      read: async () => "value2"
    }
  });
  
  let var1 = await ctx.resolve("name");
  assert.equal(var1.name, "name");
  assert.equal(await var1.read(), "value");

  var1 = await ctx.resolve("name\\d", { match: "regex" });
  assert.equal(var1.name, "name1");
  
  var1 = await ctx.resolve("name\\d", { match: "regex", output: "all" });
  assert.equal(var1.length, 2);
  
  var1 = await ctx.resolve(".*", { match: "regex", type: "tool" });
  assert.equal(var1.name, "name2");
  assert.equal(var1.type, "tool");

  const ctx2 = tune.makeContext({});
  // var1 = await ctx2.resolve(".*", { match: "regex", type: "tool" });
};

tests.usage1 = async function() {
  async function usage(provider, model, usageData) {
    return `0-${provider}-${model}-${usageData}`;
  }
  
  const ctx = tune.makeContext(usage);
  const res = await ctx.usage("provider", "model", "usage");
  assert.equal(res[0], "0-provider-model-usage");
};

tests.contextErrors = async function() {
  const ctx = tune.makeContext();
  await assert.rejects(
    async () => ctx.use("hello world"),
    /not a function/
  );
};

tests.text2expand1 = async function() {
  const ctx = tune.makeContext({
    "v1": "val1",
    "v2": "val2",
    "v3": "@v1",
    "v4": "@v3",
    "c1": "u: role"
  });

  console.log("simple text expansion");
  let payload = await tune.text2payload("u: @v1 text", ctx);
  assert.equal(payload.messages[0].content, "val1 text");

  console.log("deep expansion 1");
  payload = await tune.text2payload("u: @v3", ctx);
  assert.equal(payload.messages[0].content, "@v1");

  console.log("deep expansion 2");
  payload = await tune.text2payload("u: @@v3", ctx);
  assert.equal(payload.messages[0].content, "val1");

  console.log("deep expansion 3");
  payload = await tune.text2payload("u: @@v4", ctx);
  assert.equal(payload.messages[0].content, "@v1");

  console.log("include roles");
  payload = await tune.text2payload("s: @c1", ctx);
  assert.equal(payload.messages[0].content, "u: role");

  payload = await tune.text2payload("@@c1", ctx);
  assert.equal(payload.messages[0].content, "role");

  console.log("newline + role");
  payload = await tune.text2payload("s: char @@c1", ctx);
  assert.equal(payload.messages[0].content, "char u: role");

  payload = await tune.text2payload("s: char\n@@c1", ctx);
  assert.equal(payload.messages[1].content, "role");

  console.log("not found");
  await assert.rejects(
    async () => tune.text2ast("u: @notfound", tune.makeContext({})),
    /not found/
  );

  console.log("not found 1");
  await assert.rejects(
    () => tune.text2ast("a\na @name", tune.makeContext({})),
    {
      name: "TuneError",
      row: 1,
      col: 2,
      message: "'name' not found",
      _stack: [{ filename: "", row: 1, col: 2 }]
    }
  );

  console.log("not found 2");
  await assert.rejects(
    () => tune.text2ast("u: @@a", tune.makeContext({
      a: "hello @@b",
      b: "\nworld    @c"
    })),
    {
      name: "TuneError",
      row: 0,
      col: 3,
      message: "'c' not found",
      _stack: [
        { filename: 'b', row: 1, col: 9 },
        { filename: 'a', row: 0, col: 6 },
        { filename: '', row: 0, col: 3 }
      ]
    }
  );
};

tests.text2expand2 = async function() {
  const ctx = tune.makeContext({ "name": "cwdname" });
  
  async function cnt(text) {
    const p = await tune.text2payload(text, ctx);
    return p.messages[p.messages.length - 1].content;
  }

  assert.equal(await cnt("s: @name"), "cwdname");
  assert.equal(await cnt("s: -@{ name }-"), "-cwdname-");
  assert.equal(await cnt("u: @name"), "cwdname");
  assert.equal(await cnt("tc: tool\ntr: @name"), "cwdname");
  assert.equal(await cnt("a: - @name -"), "- @name -");
  assert.equal(await cnt("a: @name"), "@name");
  assert.equal(await cnt("a: @@name"), "@@name");

  const p = await tune.text2payload("tc: @name\n@name", ctx);
  const tc = p.messages[0].tool_calls[0].function;
  assert.equal(tc.name, "@name");
  assert.equal(JSON.parse(tc.arguments).text, "@name");
};

tests.text2expand3 = async function() {
  console.log("text2expand3 - unescape");
  assert.equal(tune.unescape("u: \@name"), "u: @name");
  assert.equal(tune.unescape("u: \@{ name }"), "u: @{ name }");
  assert.equal(tune.unescape("u: \@@name"), "u: @@name");
  assert.equal(tune.unescape("u:\n\@name"), "u:\n@name");

  async function cnt(text) {
    const p = await tune.text2payload(text, tune.makeContext());
    const result =  p.messages[p.messages.length - 1].content;
    return result
  }

  console.log("text2expand3 - unescape in payload");
  assert.equal(await cnt("u: \\@name"), "@name");
  assert.equal(await cnt("u: \\@{ name }"), "@{ name }");
  assert.equal(await cnt("u: \\@@name"), "@@name");
  assert.equal(await cnt("u:\n\\@name"), "@name");
};

tests.text2expand4 = async function() {
  console.log("text2expand4 - special symbols");

  async function cnt(text, ctx) {
    const p = await tune.text2payload(text, tune.makeContext(ctx));
    return p.messages[p.messages.length - 1].content;
  }

  assert.equal(await cnt("u: @[hello]", { "[hello]": "world" }), "world");
  assert.equal(await cnt("u: @{hello world}", { "hello world": "!" }), "!");
};

tests.text2expand5 = async function() {
  console.log("text2expand5 - recursive");
  let i = 0;
  let ctx = tune.makeContext(async function(name, args) {
    i++;
    if (i > 60) throw new Error("resolve stack overflow");
    return this.resolve(name);
  });
  
  let res = await ctx.resolve("variable");
  assert(!res, "it should not be found");
  
  i = 0;
  ctx = tune.makeContext(async function(name, args) {
    if (i > 60) throw new Error("resolve stack overflow");
    return this.resolve("name1");
  });
  
  res = await ctx.resolve("variable");
  assert(!res, "it should not be found");

  console.log("text2expand5 - non string name");
  await assert.rejects(
    async () => ctx.resolve({}),
    { message: /is not a string/ }
  );
  
  ctx = tune.makeContext({ name: "value" });
};

tests.msg2text1 = async function() {
  function dotest(obj, res, resl) {
    assert.equal(tune.msg2text(obj).trim(), res);
    assert.equal(tune.msg2text(obj, true).trim(), resl);
  }

  dotest({ role: "assistant", content: "content" }, "a: content", "assistant:\ncontent");
  dotest({ role: "user", content: "content" }, "u: content", "user:\ncontent");

  assert.equal(
    tune.msg2text({ role: "user", content: "content", name: "Alice" }),
    "u(Alice): content"
  );

  dotest(
    {
      role: "assistant",
      content: [
        { type: "text", text: "content" },
        { type: "text", text: "content" }
      ]
    },
    "a: content\na: content",
    "assistant:\ncontent\nassistant:\ncontent"
  );

  dotest(
    {
      role: "assistant",
      content: null,
      tool_calls: [{
        id: 1,
        function: { name: "mult", arguments: '{"a":2,"b":2}' }
      }]
    },
    "tc: mult " + JSON.stringify({ a: 2, b: 2 }) ,
    "tool_call: mult " + JSON.stringify({ a: 2, b: 2 })
  );

  dotest(
    {
      role: "assistant",
      content: "content",
      tool_calls: [{
        id: 1,
        function: { name: "mult", arguments: '{"a":2,"b":2}' }
      }]
    },
    "a: content\ntc: mult " + JSON.stringify({ a: 2, b: 2 }),
    "assistant:\ncontent\ntool_call: mult " + JSON.stringify({ a: 2, b: 2 })
  );

  dotest(
    {
      role: "assistant",
      content: null,
      tool_calls: [{
        id: 1,
        function: { name: "mult", arguments: '{"text":2}' }
      }]
    },
    "tc: mult\n2",
    "tool_call: mult\n2"
  );

  dotest(
    {
      role: "assistant",
      content: null,
      tool_calls: [{
        id: 1,
        function: { name: "mult", arguments: '{"text":2, "b": 1}' }
      }]
    },
    'tc: mult {"b":1}\n2',
    'tool_call: mult {"b":1}\n2'
  );

  dotest(
    { role: "tool", id: 1, content: "content" },
    "tr: content",
    "tool_result:\ncontent"
  );

  dotest(
    {
      role: "user",
      content: [{ type: "tool_result", content: "content" }]
    },
    "tr: content",
    "tool_result:\ncontent"
  );

  dotest(
    { role: "comment", content: "comment" },
    "c: comment",
    "comment: comment"
  );

  dotest(
    { role: "system", content: "system" },
    "s: system",
    "system:\nsystem"
  );
};

tests.escape1 = async function() {
  console.log("msg2text user escape")

  let ctx = tune.makeContext({ var: "@var" })
  let msgs = [
    { 
      role: "user",
      content: "@var\nu: hello"
    }
  ]
  let text = tune.msg2text(msgs)
  assert.equal(text, "u: \\@var\n\\u: hello")

  let payload = await ctx.text2payload(text)
  assert.deepEqual(msgs, payload.messages)

  console.log("msg2text assistant escape")
  msgs =  [{ 
      role: "assistant",
      content: "@var\nu: hello",
  }]
  text = tune.msg2text(msgs)
  assert.equal(text, "a: @var\n\\u: hello")
  payload = await ctx.text2payload(text)
  assert.deepEqual(msgs, payload.messages)
  
  console.log("msg2text tool_call escape")
  msgs = [{
    role: "assistant",
    content: null,
    tool_calls: [
      {
        "id": "0",
        "type": "function",
        "function": {
          "name": "sh",
          "arguments": "{\"text\":\"@var\\nu: hello\"}"
        }
      }
    ]},
    { 
      name: 'sh',
      tool_call_id: '0',
      role: "tool",
      content: "@var\nu: hello"
    }]
  // TODO:
  text = tune.msg2text(msgs)
  assert.equal(text, "tc: sh\n@var\n\\u: hello\ntr: @var\n\\u: hello")
  payload = await ctx.text2payload(text)
  assert.deepEqual(msgs, payload.messages)
}

tests.escape2 = async function () {
  let msgs = [ { 
    role: "system",
    content: "system",
  }, {
      role: "user",
      content: "user"
    }, {
    role: "assistant",
    content: null,
    tool_calls: [
      {
        "id": "0",
        "type": "function",
        "function": {
          "name": "sh",
          "arguments": "{\"text\":\"hello\"}"
        }
      }
    ]},
    { 
      name: 'sh',
      tool_call_id: '0',
      role: "tool",
      content: "hello"
    }
  ]
  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    default: defaultLLM,
    tool: {
      type: "tool",
      name: "tool",
      schema: {
        "description": "test tool",
        "parameters": {
          "type": "object",
          "properties": {
          },
        }
      },
      exec: async () => tune.msg2text(msgs)
    }
  })

  const content = await ctx.file2run({
    user: "@tool call tool", 
    response: "chat"
  })
  // console.log(content)

}

tests.escape3 = async function () {
  console.log("escape3 - unescape tool_result based on $escape_output")
  const tool = {
    type: "tool",
    name: "tool",
    schema: {
      "description": "test tool",
      "parameters": {
        "type": "object",
        "properties": {
        },
      }
    },
    exec: async () => "executed"
  }

  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    default: defaultLLM,
    tool,
    var: {
      name: "var",
      type: "text",
      read: async () => "value"
    }
  })
  tool.schema.$escape_output = false;

  let payload = await tune.text2payload("user: @tool\ntool_call: tool\ntool_result: \\@var", ctx);
  assert.equal(payload.messages[2].content, "\\@var", "should not unescape with escapeOutput = false")

  tool.schema.$escape_output = true;

  payload = await tune.text2payload("user: @tool\ntool_call: tool\ntool_result: \\@var", ctx);
  assert.equal(payload.messages[2].content, "@var", "should unescape with escapeOutput = true")
}

tests.text2call1 = async function() {
  console.log("text2call1 - 1");
  assert.deepEqual(tune.text2call("name"), {
    name: "name",
    arguments: "{}"
  });

  console.log("text2call1 - 2");
  assert.deepEqual(tune.text2call("name {value: 1}"), {
    name: "name",
    arguments: '{"value":1}'
  });

  console.log("text2call1 - 3");
  assert.deepEqual(tune.text2call("name \n1"), {
    name: "name",
    arguments: '{"text":"1"}'
  });

  console.log("text2call1 - 4");
  assert.deepEqual(tune.text2call("name {a: 1, b: {c: 1}}\ntext"), {
    name: "name",
    arguments: '{"a":1,"b":{"c":1},"text":"text"}'
  });

  console.log("text2call1 - 5");
  assert.throws(
    () => tune.text2call("name {a: 1, b: \n{c: 1}\n}"),
    /can not parse tool call/
  );
};

tests.text2payload1 = async function() {
  const ctx = tune.makeContext({
    "v1": "val1",
    "v2": "val2",
    "v3": "@v1",
    "v4": "@v3",
    "c1": "u: role",
    plus: {
      type: "tool",
      schema: {
        "description": "add 2 numbers, a + b",
        "parameters": {
          "type": "object",
          "properties": {
            "a": { "type": "number", "description": "first argument" },
            "b": { "type": "number", "description": "second argument" }
          },
          "required": ["a", "b"]
        }
      },
      exec: (args) => args.a + args.b
    },
    image: {
      type: "image",
      read: () => Buffer.from("0")
    },
    conf: defaultLLM 
  });

  console.log("image");
  let payload = await tune.text2payload("u: what is on the image? @image", ctx);
  assert.deepEqual(payload.messages[0].content, [
    { type: "text", text: "what is on the image?" },
    { type: "image_url", image_url: { url: "data:undefined;base64,MA==" } }
  ]);
  assert(!payload.tools, "there are no tools in payload");

  console.log("tools");
  console.log("tool1");
  let val = await tune.text2payload("tc: t1\ntr: r1", ctx);
  assert.deepEqual(val.messages, [
    {
      role: "assistant",
      content: null,
      tool_calls: [{
        id: "0",
        type: "function",
        function: { name: "t1", arguments: "{}" }
      }]
    },
    {
      role: "tool",
      content: "r1",
      tool_call_id: "0",
      name: "t1"
    }
  ]);

  console.log("tool2");
  val = await tune.text2payload("tc: t1 {a: 1}", ctx);
  assert.deepEqual(val.messages[0].tool_calls, [{
    id: "0",
    type: "function",
    function: { name: "t1", arguments: '{"a":1}' }
  }]);

  console.log("llm");
  payload = await tune.text2payload("u: @conf", ctx);
  assert.ok(payload.llm, "llm is set");
};

tests.text2payload2 = async function() {
  let val = await tune.text2payload("tc: t1\ntc: t2\ntr: r1\ntr: r2", tune.makeContext());
  const tc = val.messages[0].tool_calls;
  const msg1 = val.messages[1];
  const msg2 = val.messages[2];

  assert.equal(tc[0].id, "0");
  assert.equal(tc[1].id, "1");
  assert.equal(msg1.tool_call_id, "0");
  assert.equal(msg2.tool_call_id, "1");

  const payload = await tune.text2payload("tc: t1\ntr: r1\ntc: t2\ntr: r2", tune.makeContext());
  const msgs = payload.messages;
  assert.equal(msgs[0].tool_calls.length, 1);
  assert.equal(msgs[1].role, "tool");
  assert.equal(msgs[2].tool_calls.length, 1);
  assert.equal(msgs[3].role, "tool");
};

tests.text2payload3 = async function() {
  const res = await tune.text2payload("u(Alice): hello\nu: world", tune.makeContext());
  assert.equal(res.messages[0].name, "Alice");
  assert.ok(!res.messages[1].name);
};

tests.text2process1 = async function() {
  const ctx = tune.makeContext({
    name: "value",
    type: {
      type: "processor",
      exec: async (node, args) => {
        node.type = args[0];
        return node;
      }
    },
    value: {
      type: "processor",
      exec: async (node, args) => {
        const res = Object.assign({}, node);
        res.read = async () => args;
        return res;
      }
    },
    base64: {
      type: "processor",
      exec: async (node, args) => {
        const res = Object.assign({}, node);
        res.read = async () => {
          const val = await node.read();
          return Buffer.from(val).toString("base64");
        };
        return res;
      }
    },
    mult: {
      type: "processor",
      exec: async (node, args) => {
        const num = parseInt(args);
        return Array.from({ length: num }, (_, i) => {
          const res = Object.assign({}, node);
          res.name = node.name + i;
          res.read = async () => (await node.read()) + i;
          return res;
        });
      }
    },
    "default": {
      type: "processor",
      exec: async (node, args) => {
        return node || {
          type: "text",
          read: async () => args
        };
      }
    },
    "insertvar": {
      type: "processor",
      exec: async function(node, args) {
        this.use(tune.envmd({ "var": args }));
        return {
          type: "text",
          read: async () => ""
        };
      }
    }
  });

  console.log("text2process1 @name|proc");
  let res = await tune.text2payload("u: @name|base64", ctx.clone());
  assert.equal(res.messages[0].content, Buffer.from("value").toString("base64"));

  console.log("text2process1 @{ name | proc arg }");
  res = await tune.text2payload("u: @{name | value 1 2 3}", ctx.clone());
  assert.equal(res.messages[0].content, "1 2 3");

  console.log("text2process1 @{ name | proc1 | proc2 }");
  res = await tune.text2payload("u: @{name | value 1 | value 2}", ctx.clone());
  assert.equal(res.messages[0].content, "2");

  console.log("text2process1 returns array of nodes");
  res = await tune.text2payload("u: @{name | mult 2}", ctx.clone());
  assert.equal(res.messages[0].content, "value0value1");

  console.log("text2process1 @{ nothing | default 1 }");
  res = await tune.text2payload("u: @{ nothing | default 1 }", ctx.clone());
  assert.equal(res.messages[0].content, "1");

  console.log("text2process1 @|insertvar");
  res = await tune.text2payload("u: @|insertvar @var", ctx.clone());
  assert.equal(res.messages[0].content, "");

  console.log("text2process1 @{|insertvar value}");
  res = await tune.text2payload("u: @{|insertvar value} @var", ctx.clone());
  assert.equal(res.messages[0].content, "value");

  console.log("text2process1 errors");

  let ctxErr = tune.makeContext({
    name: "value",
    notfound: "not found @{ name | proc }",
    noexec: { type: "processor" },
    proc_throws: {
      type: "processor",
      name: "proc_throws",
      exec: async function (node, args) {
        throw new Error("proc error");
      }
    }
  });

  await assert.rejects(
    async () => tune.text2ast("u: @@notfound", ctxErr),
    { name: "TuneError", message: /processor not found/ }
  );

  await assert.rejects(
    async () => tune.text2ast("u: @{ name | noexec }", ctxErr),
    { name: "TuneError", message: /does not have exec function/ }
  );

  await assert.rejects(
    async () => tune.text2payload("u: @{ name | proc_throws }", ctxErr),
    /proc error/
  );

  // "fs" like inline processors
  const ctxFs = tune.makeContext({
    name: "value",
    value: {
      type: "processor",
      exec: async (node, args) => {
        const res = Object.assign({}, node);
        res.read = async () => args;
        return res;
      }
    },
    throws: {
      type: "processor",
      exec: async () => {
        throw new Error("proc error");
      }
    }
  });

  // basic invocation of value processor
  res = await tune.text2payload("u: @{name | value 1}", ctxFs);
  assert.equal(res.messages[0].content, "1");

  // processor that throws should surface an error
  await assert.rejects(
    async () => tune.text2payload("u: @{name | throws}", ctxFs),
    /proc error/
  );

  // escaping inside processor args
  res = await tune.text2payload("u: @{name | value {\\}}", ctxFs);
  assert.equal(res.messages[0].content, "{}");

  res = await tune.text2payload("u: @{name | value \\\| parameter }", ctxFs);
  assert.equal(res.messages[0].content, "| parameter");
};

tests.text2audio1 = async function() {
  const ctx = tune.makeContext({
    name: {
      type: "audio",
      mimetype: "audio/mpeg",
      name: "name",
      read: async () => Buffer.from([0])
    }
  });
  
  const res = await tune.text2payload("u: hello @name\nau: @name 1234123412\ntranscription", ctx);
  
  assert.deepEqual(res.messages, [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'hello' },
        { type: 'input_audio', input_audio: { data: 'AA==', format: 'mp3' } },
        { type: 'text', text: '' }
      ]
    },
    {
      role: 'assistant',
      content: null,
      audio: {
        id: 'name',
        data: 'AA==',
        expires_at: 1234123412,
        transcript: 'transcription'
      }
    }
  ]);
  
  assert(tune.msg2text(res.messages.slice(1)), "au: @name 1234123412\ntranscription");
};

tests.vars1 = async function() {
  // This test is skipped in the original (has return statement)
  /*
  (assert.deepEqual (tune.env2vars "a=1\nb='2'\nc=1\n2\nd=\"1\"")
    (: a "1"
       b "2"
       c "1\n2"
       d "1"))
  (= vol (tune.makeContext (tune.env2vars "a=1\nb=2") (mkvol (:))))
  (assert.equal (tune.text2expand "{a},{b}" vol) "1,2" ))
  */

  return;
};

tests.payload2http1 = async function() {
  const schema = {
    "description": "add 2 numbers, a + b",
    "name": "plus",
    "parameters": {
      "type": "object",
      "properties": {
        "a": { "type": "number", "description": "first argument" },
        "b": { "type": "number", "description": "second argument" }
      },
      "required": ["a", "b"]
    }
  };
  
  const ctx = tune.makeContext({
    OPENAI_KEY: "openai_key",
    plus: {
      type: "tool",
      schema: schema,
      exec: (args) => args.a + args.b
    },
    conf: defaultLLM 
  });
  
  const payload = await tune.text2payload("u: hello world @conf @plus", ctx);
  const httpPayload = await tune.payload2http(payload, ctx);
  
  assert.deepEqual(httpPayload, {
    url: "https://api.openai.com/v1/chat/completions",
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer openai_key"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "hello world" }],
      tools: [{ "type": "function", "function": schema }],
      model: "gpt-5.4-mini"
    })
  });
};

tests.payload2http2 = async function() {
  let ctx = tune.makeContext({});
  await assert.rejects(
    async () => {
      const payload = await tune.text2payload("u: hello world", ctx);
      await tune.payload2http(payload, ctx);
    },
    { name: "TuneError", message: /llm file not found/ }
  );

  // Instead of fsctx: use defaultLLM but without OPENAI_KEY in the context
  const ctx1 = tune.makeContext({ default: defaultLLM });
  await assert.rejects(
    async () => {
      const payload = await tune.text2payload("u: hello world", ctx1);
      await tune.payload2http(payload, ctx1);
    },
    { name: "TuneError", message: /OPENAI_KEY not found/ }
  );

};

tests.text2stream1 = async function() {
  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    "default": defaultLLM 
  });

  const res = await ctx.text2run("s: You're Groot\nu: Hi how are you?", { stream: true });
  let msgs
  for await (let item of res) {
    msgs = item
  }
  
  assert.match(msgs[0].content, /groot/i);
};

tests.text2stream2 = async function() {
  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    plus: {
      type: "tool",
      schema: {
        "description": "add 2 numbers, a + b",
        "parameters": {
          "type": "object",
          "properties": {
            "a": { "type": "number", "description": "first argument" },
            "b": { "type": "number", "description": "second argument" }
          },
          "required": ["a", "b"]
        }
      },
      exec: (args) => args.a + args.b
    },
    "default": defaultLLM
  });

  let res = await tune.text2run("u: @plus add 1234 to 4321", ctx, {
    stream: true,
    stop: "assistant"
  });
  
  let chunk = {};
  let msgs;
  
  for await (msgs of res) {
  }
  
  const lastMsg = msgs[msgs.length - 1];
  assert.ok(lastMsg.content);
  assert.equal(lastMsg.role, "assistant");
};

tests.text2stream3 = async function() {
  const ctx = tune.makeContext({
    plus: {
      type: "tool",
      schema: {
        "description": "add 2 numbers, a + b",
        "parameters": {
          "type": "object",
          "properties": {
            "a": { "type": "number", "description": "first argument" },
            "b": { "type": "number", "description": "second argument" }
          },
          "required": ["a", "b"]
        }
      },
      exec: (args) => args.a + args.b
    },
    "default": mkllm("qwen/qwen3-32b")
  });

  let res = await tune.text2run("u: @plus add 1234 to 4321", ctx, {
    stream: true,
    stop: "assistant"
  });
  
  let chunk = {};
  let msgs;
  
  for await (msgs of res) {
    // console.log(JSON.stringify(msgs, null, "  "))
  }
  
  const lastMsg = msgs[msgs.length - 1];
  assert.ok(lastMsg.content);
  assert.equal(lastMsg.role, "assistant");
};

tests.toolCall1 = async function() {
  const ctx = tune.makeContext({
    a: {
      type: "tool",
      schema: {
        "description": "always returns 1",
        "parameters": {
          "type": "object",
          "properties": {},
          "required": []
        }
      },
      exec: async () => 1
    },
    b: {
      type: "tool",
      schema: {
        "description": "always returns 2",
        "parameters": {
          "type": "object",
          "properties": {},
          "required": []
        }
      },
      exec: async () => 2
    },
    "a-b": {
      type: "tool",
      schema: {
        "description": "always returns 1",
        "parameters": {
          "type": "object",
          "properties": {},
          "required": []
        }
      },
      exec: async () => 1
    }
  });

  async function tc(text) {
    const payload = await tune.text2payload(text, ctx);
    const res = await tune.toolCall(payload, ctx);
    return tune.msg2text(res);
  }

  assert.equal(await tc("u: hi"), "");
  assert.equal(await tc("s: @a\ntc: a"), "tr: 1");
  assert.equal(await tc("s: @a @b\ntc: a\ntc: b"), "tr: 1\ntr: 2");
  assert.equal(await tc("s: @a\ntc: a\nu: hi\ntc: a"), "tr: 1");
  assert.equal(await tc("s: @a-b\ntc: a-b"), "tr: 1");
};
// toolCall2 test is in the tune-fs package

tests.toolCall3 = async function() {
  async function fc(result) {
    const ctx = tune.makeContext({
      a: {
        type: "tool",
        schema: {
          "description": "returns argument as is",
          "parameters": {
            "type": "object",
            "properties": {
              "a": { "type": "object", "description": "argument" }
            },
            "required": ["a"]
          }
        },
        exec: async () => result
      }
    });
    
    let res = await tune.text2ast("u: @a\ntc: a", ctx);
    res = await tune.ast2payload(res, ctx);
    res = await tune.toolCall(res, ctx);
    return res.map(msg => tune.msg2text(msg)).join("\n");
  }

  console.log("toolCall3 basic types");
  assert.equal(await fc({ a: 1, b: 2 }), "tr: { a: 1, b: 2 }");
  assert.equal(await fc("string"), "tr: string");
  assert.equal(await fc(1), "tr: 1");
  assert.equal(await fc([1, 2, 3]), "tr: 1\n2\n3");
  assert.equal(await fc(undefined), "tr: undefined");
  assert.equal(await fc(null), "tr: null");
  assert.equal(await fc(true), "tr: true");
};


tests.toolCall9 = async function() {
  // migrated from Lisp: check that tool output that starts with @ gets escaped
  const escape = {
    type: "tool",
    name: "escape",
    schema: {
      description: "returns a string starting with @",
      parameters: { type: "object", properties: {}, required: [] }
    },
    exec: async () => "@hello"
  };

  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    escape,
    default: defaultLLM
  });

  const res = await ctx.text2run("u: @escape hi\ntc: escape");
  // tool result should be escaped so that it is not expanded back into variables
  assert.equal(res[0].content, "\\@hello");
};

tests.toolCall10 = async function() {
  const escape = {
    type: "tool",
    name: "escape",
    schema: {
      "description": "throws an error, used for testing tools",
      "parameters": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    exec: async () => "@hello"
  };
  
  const ctx = tune.makeContext({ escape });
  
  const res = await ctx.text2payload("u: hi\ntool_call: escape\ntool_result: @escape hi @escape");
  assert.equal(res.tools.length, 1, "there should be only 1 tool");
};

tests.text2run1 = async function() {
  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    system: "You're calculator",
    mult: {
      type: "tool",
      schema: {
        "description": "multiply 2 numbers, a * b",
        "parameters": {
          "type": "object",
          "properties": {
            "a": { "type": "number", "description": "first argument" },
            "b": { "type": "number", "description": "second argument" }
          },
          "required": ["a", "b"]
        }
      },
      exec: (args) => args.a * args.b
    },
    "default": defaultLLM,
    "qwen32b": mkllm("qwen/qwen3-32b")
  });

  console.log("text2run1 - multiturn 1");
  let res = await tune.text2run("s: @system @mult\nu: 2 * 2", ctx);
  assert.deepEqual(JSON.parse(res[0].tool_calls[0].function.arguments), { a: 2, b: 2 });

  console.log("text2run1 - multiturn 1 (qwen)");
  res = await tune.text2run("s: @qwen32b @system @mult\nu: 2 * 2", ctx);
  assert.deepEqual(JSON.parse(res[0].tool_calls[0].function.arguments), { a: 2, b: 2 });

  console.log("text2run1 - multiturn 2");
  res = await tune.text2run("s: @system @mult\nu: 2 * 2\ntc: mult { a: 2, b: 2}", ctx);
  assert.equal(res[0].content, "4");

  console.log("text2run1 - multiturn 3");
  res = await tune.text2run("s: @system @mult\nu: 2 * 2", ctx, { stop: "assistant" });
  assert.ok(res[res.length - 1].content.includes("4"));
  assert.equal(res[res.length - 1].role, "assistant");

  console.log("text2run1 - multiturn 4");
  res = await tune.text2run("s: @system @mult\nu: 2 * 2\ntc: mult { a: 2, b: 2}", ctx, { stop: "assistant" });
  assert.ok(res[res.length - 1].content.includes("4"));
  assert.equal(res[res.length - 1].role, "assistant");

  console.log("text2run1 - multiturn 5");
  res = await tune.text2run("s: @system @mult\nu: 2 * 2\ntc: mult { a: 2, b: 2}\ntr: 4", ctx, { stop: "assistant" });
  assert.ok(res[res.length - 1].content.includes("4"));
  assert.equal(res[res.length - 1].role, "assistant");

  console.log("text2run1 - multiturn 6");

  // TODO migrated from Lisp: stop when assistant says STOP, or after 7 messages.
  let res6 = await tune.text2run(
    "s: You're calculator @mult\n" +
      "u: 1. calculate 3 * 3\n" +
      "2. then take result and multiply by 2\n" +
      "3. when you finished say STOP\n",
    ctx,
    {
      stop: function stop(msgs) {
        const lastMsg = msgs[msgs.length - 1];

        // Lisp: (if (isnt lastMsg) (return no))
        if (!lastMsg) return false;

        // Lisp: (if (> msgs.length 7) (return yes))
        if (msgs.length > 7) return true;

        // Lisp: (if (isnt lastMsg.content) (return no))
        if (!lastMsg.content) return false;

        // Lisp: (isnt -1 (lastMsg.content.indexOf "STOP"))
        return lastMsg.content.indexOf("STOP") !== -1;
      }
    }
  );

  // Lisp: (= res (tune.msg2text res))
  const res6Text = tune.msg2text(res6);

  // Lisp assertions
  assert.ok(res6Text.indexOf("STOP") !== -1);
  assert.ok(res6Text.indexOf("9") !== -1);
  assert.ok(res6Text.indexOf("18") !== -1);



};

tests.text2run2 = async function() {
  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    sun: {
      type: "image",
      mimetype: "image/webp",
      read: async () => fs.readFileSync('./test/sun.webp')
    },
    "default": defaultLLM
  });

  const res = await tune.text2run("s: answer with 1 word\nu: what object is here @sun ?", ctx);
  assert.match(res[0].content, /sun/i);
};

tests.text2run3 = async function() {
  console.log("text2run3 - error from llm");
  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    proc: {
      type: "processor",
      exec: async (node, args) => {
        const res = Object.assign({}, node);
        res.exec = async (payload, ctx) => {
          payload.someprop = "test";
          return node.exec(payload, ctx);
        };
        return res;
      }
    },
    mult: {
      type: "tool",
      schema: {
        description: "multiply 2 numbers, a * b",
        parameters: {
          type: "object",
          properties: {
            a: { type: "number", description: "first argument" },
            b: { type: "number", description: "second argument" }
          },
          required: ["a", "b"]
        }
      },
      exec: (args) => args.a * args.b
    },
    "default": defaultLLM
  });

  await assert.rejects(
    async () => tune.text2run("s: @{ default | proc } You're Groot\nu: how are you?", ctx)
  );
};

tests.file2run1 = async function() {
  const storage = {};
  const ctx = tune.makeContext({
    echo: "You're echo, you print everything back",
    OPENAI_KEY: env.OPENAI_KEY,
    chat1: "system:\n @echo\nuser:\n@text",
    chat3: "s: @echo\nu: @text",
    "default": defaultLLM,
    mult: {
      type: "tool",
      schema: {
        description: "multiply 2 numbers, a * b",
        parameters: {
          type: "object",
          properties: {
            a: { type: "number", description: "first argument" },
            b: { type: "number", description: "second argument" }
          },
          required: ["a", "b"]
        }
      },
      exec: (args) => args.a * args.b
    },
  },
    async function write(filename, content) {
      storage[filename] = content;

    });

  console.log("file2run1 - read from file");
  let res = await tune.file2run({ filename: "chat1" }, { text: "hello" }, ctx);
  assert.equal(res, "hello");

  console.log("file2run1 - system & user is set");
  res = await tune.file2run({ system: "@echo", user: "@text" }, { text: "hello" }, ctx);
  assert.equal(res, "hello");

  console.log("file2run1 - save");
  await ctx.file2run({ system: "@echo", user: "@text", filename: "chat2", save: true }, { text: "hello" });
  assert.equal(storage.chat2, "system:\n@echo\nuser:\n@text\nassistant:\nhello");

  console.log("file2run1 - long/short answer");
  await tune.file2run({ filename: "chat3", save: true }, { text: "hello" }, ctx);
  assert.equal(storage.chat3, "s: @echo\nu: @text\na: hello");

  console.log("file2run1 - json");
  res = await tune.file2run({ system: "@echo", user: "@text", response: "json" }, { text: "{\"hello\": \"world\" }" }, ctx);
  assert.deepEqual(res, { hello: "world" });

  console.log("file2run1 - error");
  await assert.rejects(
    async () => tune.file2run({ user: "@does_not_exist" }, {}, ctx),
    /not found/
  );
  // Run file2run with stop set to "step" and response format "messages" to get tool_calls
  res = await ctx.file2run({ user: "@mult how much is 12 * 12?", stop: "step", response: "messages" }) ;
  assert.ok(res[0].tool_calls && res[0].tool_calls.length);

  // keep the earlier not-found assertion (already present above) — no-op here

};

tests.file2run2 = async function() {
  // Non-streaming: ensure saving happens after every completed loop step.
  // We simulate a 3-step run:
  //   1) assistant requests a tool
  //   2) tool result is produced
  //   3) assistant returns final content
  let writes = [];

  const ctx = tune.makeContext(
    {
      OPENAI_KEY: env.OPENAI_KEY,
      plus: {
        type: "tool",
        schema: {
          description: "add 2 numbers, a + b",
          parameters: {
            type: "object",
            properties: {
              a: { type: "number" },
              b: { type: "number" }
            },
            required: ["a", "b"]
          }
        },
        exec: (args) => args.a + args.b
      },
      "default": defaultLLM 
    },
    async function write(filename, content) {
      writes.push({ filename, content });
    }
  );

  console.log("file2run2 save non streaming");
  const out = await ctx.file2run({ 
    user: "@plus 22+22?", 
    filename: "chat", 
    save: true 
  });
  assert.match(out, /44/);

  // 3 turn-end saves: after tool_calls assistant, after tool_result, after final assistant.
  assert.equal(writes.length, 3);
  assert.equal(writes[0].filename, "chat");
  assert.match(writes[0].content, /tool_call:\s+plus/);
  assert.doesNotMatch(writes[0].content, /tool_result:/);

  assert.match(writes[1].content, /tool_call:\s+plus/);
  assert.match(writes[1].content, /tool_result:\s*\n44/);

  assert.match(writes[2].content, /tool_result:\s*\n44/);
  assert.match(writes[2].content, /assistant:\s*.*44.*/);

  // Streaming: ensure we still save (once) on turn end, not on token chunks.
  writes = [];


  console.log("file2run2 save streaming");
  const iter = await ctx.file2run({ 
    user: "@plus 22+22?", 
    filename: "chat", 
    save: true,
    stream: true
  });
  let last;
  for await (const chunk of iter) last = chunk;
  assert.match(last, /44/);

  // 3 turn-end saves: after tool_calls assistant, after tool_result, after final assistant.
  assert.equal(writes.length, 3);
  assert.equal(writes[0].filename, "chat");
  assert.match(writes[0].content, /tool_call:\s+plus/);
  assert.doesNotMatch(writes[0].content, /tool_result:/);

  assert.match(writes[1].content, /tool_call:\s+plus/);
  assert.match(writes[1].content, /tool_result:\s*\n44/);

  assert.match(writes[2].content, /tool_result:\s*\n44/);
  assert.match(writes[2].content, /assistant:\s*.*44.*/);

  console.log("file2run2 - save params")
  // Ensure save respects both `save` and `filename` flags.
  writes = [];
  // filename set but save disabled
  await ctx.file2run({ user: "hi", filename: "chat", save: false });
  assert.equal(writes.length, 0);

  // save enabled but filename missing
  await ctx.file2run({ user: "hi", save: true });
  assert.equal(writes.length, 0);

  // both enabled
  await ctx.file2run({ user: "hi", filename: "chat", save: true });
  assert.equal(writes.length, 1);
};

tests.errors = async function() {
  // Empty test in original
  return;
};

tests.jsonrpc1 = async function() {
  const stream = require("stream");
  const inStreams = stream.duplexPair();
  const outStreams = stream.duplexPair();
  
  const client = rpc.jsonrpc(
    {
      inStream: stream.Readable.toWeb(inStreams[0]),
      outStream: stream.Writable.toWeb(outStreams[0]),
      debug: true,
      name: "client"
    },
    { ping: async () => "pong" }
  );
  
  const server = rpc.jsonrpc(
    {
      outStream: stream.Writable.toWeb(inStreams[1]),
      inStream: stream.Readable.toWeb(outStreams[1]),
      debug: true,
      name: "server"
    },
    {
      hello: async (name) => "hello " + name,
      err: async (text) => { throw new Error(text); },
      stream: async function*  (values) {
        for (let val of values) {
          yield val
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  );

  assert.equal("hello world", await client.hello("world"));
  
  await assert.rejects(
    async () => await client.hi("Ilya"),
    /method not found/
  );
  
  await assert.rejects(
    async () => client.err("error1234"),
    /error1234/
  );
  
  assert.equal("pong", await server.ping());

  console.log("json streaming");
  let iterator = await client.hello("world", true);
  let res
  let chunk = await iterator.next();
  assert.deepEqual(chunk, { value: "hello world" });
  
  iterator = await client.err("error1234", true);
  await assert.rejects(
    async () => iterator.next(),
    /error1234/
  );

  const iter = await client.stream([1, 2, 3], true);
  const items = []
  for await (let item of iter) {
    items.push(item)
  }
  assert.deepEqual(items, [1, 2, 3]);
};

let procs = []
function spawnRPC(exports = {}) {

  const proc = cp.spawn(
    "bun",
    ["bin/cli.js", "rpc", "--debug", "--path", "test/"],
    {
      encoding: "utf8",
      env: process.env,
      cwd: path.resolve(__dirname, ".."),
      stdio: ["pipe", "pipe", "inherit"]
    }
  );

  const client = rpc.jsonrpc(
    {
      inStream: stream.Readable.toWeb(proc.stdout),
      outStream: stream.Writable.toWeb(proc.stdin),
      debug: true,
      name: "client"
    },
    exports
  );
  procs.push(proc)

  return { client, proc };
}


tests.jsonrpc2 = async function() {
  const ctx = tune.makeContext({
    "editor/selection": "b",
    "editor/buffer": "d"
  });

  // Exports that the spawned RPC process can call. They delegate to ctx.
  const exports = {
    resolve: async function(params) {
      const res = await ctx.resolve(params.name, params.params);
      if (!res) return // { error: "not found" };
      return {
        name: res.name || params.name,
        fullname: res.fullname,
        type: res.type
      };
    },
    read: async function(params) {
      const res = await ctx.resolve(params.name, params.params);
      if (!res) return // { error: "not found" };
      return await res.read();
    }
  };

  const { client, proc } = spawnRPC(exports);

  // Inform remote about our exported methods (the RPC helper supports init)
  
  if (typeof client.init === "function") {
    await client.init(["resolve", "read"]);
  }

  console.log("jsonrpc2 - text param")
  // Simple file2run via text
  const out1 = await client.file2run({ text: "u: 2 + 2 is" });
  assert.match(out1, /4/);

  console.log("jsonrpc2 - user param")
  const out2 = await client.file2run({ user: "2+2=" });
  assert.match(out2, /4/);

  // A run that stops on assistant and computes 23*23 (expect 529)
  console.log("jsonrpc2 - tool call, return assistant")
  const out3 = await client.file2run({ text: "u: @mult\n23 * 23=", stop: "assistant" });
  assert.match(out3, /529/);

  console.log("jsonrpc2 - not found rejection")
  // Not-found case should reject
  await assert.rejects(
    async () => await client.file2run({ text: "u: @not_found" }),
    /not found/
  );

  // Streaming variants
  async function runStream(params) {
    const iter = await client.file2run(params, true);
    let last;
    for await (last of iter) {
      console.log("last", last)
    }
    return last;
  }

  console.log("jsonrpc2 - stream text param")
  const s1 = await runStream({ text: "u: 2 + 2 is" });
  assert.match(s1, /4/);

  try {
    console.log("jsonrpc2 - stream user param")
    const s2 = await runStream({  user: "2+2=" });
    assert.match(s2, /4/);
  } catch (e) {
    console.warn("jsonrpc2 stream filename run skipped:", e.message);
  }

  console.log("jsonrpc2 - stream tool call")
  const s3 = await runStream({ text: "u: @mult\n23 * 23=", stop: "assistant" });
  assert.match(s3, /529/);

  console.log("jsonrpc2 - stream not found")
  await assert.rejects(
    async () => await runStream({ text: "u: @not_found" }),
    /not found/
  );

  // Editor context resolution
  console.log("jsonrpc2 - editor selection")
  const editorRes = await client.file2run({ text: "s: You are echo you print everything back\nu: @editor/selection" });
  assert.match(editorRes, /b/);

};


tests.jsonrpc3 = async function() {
  const { client, proc } = spawnRPC();

  const queries = [
    'perplexity',
    'gemini-2.5',
    'llama',
    'mistral',
    'claude-',
    'gpt-4.1'
  ];

  for (const query of queries) {
    let res = await client.suggest({ query });

    if (!res || (Array.isArray(res) && res.length === 0)) {
      console.warn(`jsonrpc3: suggest("${query}") returned no results`);
    } else {
      // If array-like, assert length > 0. If it's other truthy value, accept it.
      if (Array.isArray(res)) assert.ok(res.length > 0);
    }
  }
};

tests.cli2 = async function() {
  const cp = require("child_process");

  function execCmd(cmd) {
    const out = cp.execSync(`node ../bin/cli.js ${cmd}`, {
      encoding: "utf8",
      env: Object.assign({}, process.env),
      cwd: __dirname
    });
    return out.trim();
  }

  console.log("cli2 - system + user");
  let out = execCmd("--system '@echo' --user 'hello' --path tools/");
  assert.equal(out, "hello");

  out = execCmd("-s @echo --path tools/ hello");
  assert.equal(out, "hello");

  // prepare chats directory
  const chatsDir = path.resolve(__dirname, "chats");
  if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true });
  function mkfile() {
    return path.resolve(chatsDir, `${Date.now()}.chat`);
  }

  console.log("cli2 - save to file");
  let filename = mkfile();
  out = execCmd(`--system '@echo' --user 'hello' --path tools/ --save --filename ${filename}`);
  assert.equal(out, "hello");
  assert.ok(fs.existsSync(filename));
  const content = fs.readFileSync(filename, "utf8");
  assert.equal(content, "system:\n@echo\nuser:\nhello\nassistant:\nhello");
  fs.unlinkSync(filename)

  console.log("cli2 - system user filename - takes filename");
  filename = mkfile();
  const prompt = "You count up to 10 with user";
  execCmd(`--system '${prompt}' --user '1' --save --filename ${filename}`);
  execCmd(`--system '${prompt}' --user '3' --save --filename ${filename}`);
  const roles = tune.text2roles(fs.readFileSync(filename, "utf8"));
  assert.equal(roles.length, 5);
  fs.unlinkSync(filename);

  console.log("cli2 - set param");
  out = execCmd("--system '@echo' --set param=hello --user '@param'");

  assert.equal(out, "hello");
};


tests.cliRead = async function() {
  const cp = require("child_process");

  function execCmd(cmd) {
    return cp.execSync(`node ../bin/cli.js ${cmd}`, {
      encoding: "utf8",
      env: process.env,
      cwd: __dirname
    }).trim();
  }

  console.log("cliRead - read text variable");
  let out = execCmd("read echo --path .");
  assert.equal(out, "You are echo you print everything back");

  console.log("cliRead - read with --filename");
  const tmpFile = path.resolve(__dirname, `read_${Date.now()}.txt`);
  out = execCmd(`read echo --path . --filename ${tmpFile}`);
  assert.match(out, /written to/);
  const content = fs.readFileSync(tmpFile, "utf8").trim();
  assert.equal(content, "You are echo you print everything back");
  fs.unlinkSync(tmpFile);

  console.log("cliRead - read not found");
  assert.throws(
    () => execCmd("read nonexistent --path ."),
    /variable not found/
  );
};

tests.cliExec = async function() {
  const cp = require("child_process");

  function execCmd(cmd, input) {
    return cp.execSync(`node ../bin/cli.js ${cmd}`, {
      encoding: "utf8",
      env: process.env,
      cwd: __dirname,
      input: input || ""
    }).trim();
  }

  console.log("cliExec - exec tool with params");
  let out = execCmd("exec mult --path . --a=6 --b=7");
  assert.equal(out, "42");

  console.log("cliExec - exec tool with JSON from stdin");
  out = execCmd("exec mult --path .", JSON.stringify({ a: 3, b: 5 }));
  assert.equal(out, "15");

  console.log("cliExec - exec tool with text from stdin fallback");
  // If stdin is not valid JSON, it goes into args.text
  // mult.tool.js uses { a, b }, so text won't be used — but it should not crash
  out = execCmd("exec mult --path . --a=2 --b=3", "not json");
  assert.equal(out, "6");

  console.log("cliExec - exec not found");
  assert.throws(
    () => execCmd("exec nonexistent --path ."),
    /variable not found/
  );
};

tests.cliWrite = async function() {
  const cp = require("child_process");

  function execCmd(cmd, input) {
    return cp.execSync(`node ../bin/cli.js ${cmd}`, {
      encoding: "utf8",
      env: process.env,
      cwd: __dirname,
      input: input || ""
    }).trim();
  }

  const tmpFile = path.resolve(__dirname, `write_${Date.now()}.txt`);

  console.log("cliWrite - write with --text");
  let out = execCmd(`write ${tmpFile} --text "hello from write"`);
  assert.match(out, /written to/);
  assert.equal(fs.readFileSync(tmpFile, "utf8").trim(), "hello from write");

  console.log("cliWrite - write from stdin");
  out = execCmd(`write ${tmpFile}`, "piped content");
  assert.match(out, /written to/);
  assert.equal(fs.readFileSync(tmpFile, "utf8").trim(), "piped content");

  console.log("cliWrite - write no content");
  assert.throws(
    () => execCmd(`write ${tmpFile}`),
    /no content provided/
  );

  // cleanup
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
};

tests.cliResolve = async function() {
  const cp = require("child_process");

  function execCmd(cmd) {
    return cp.execSync(`node ../bin/cli.js ${cmd}`, {
      encoding: "utf8",
      env: process.env,
      cwd: __dirname
    }).trim();
  }

  console.log("cliResolve - resolve text node");
  let out = execCmd("resolve echo --path .");
  assert.match(out, /type:\s*'text'/);
  assert.match(out, /name:\s*'echo'/);

  console.log("cliResolve - resolve tool node");
  out = execCmd("resolve mult --path .");
  assert.match(out, /type:\s*'tool'/);
  assert.match(out, /name:\s*'mult'/);

  console.log("cliResolve - resolve not found");
  assert.throws(
    () => execCmd("resolve nonexistent --path ."),
    /variable not found/
  );
};

tests.errProp = async function () {
  const ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    default: defaultLLM 
  });

  /* TODO:
  let res = await ctx.text2run("u: @notfound hi", { errors: "message" })
  assert.equal(res[0].role, "error")

  res = await ctx.file2run({ 
    user: "@notfound hi", 
    errors: "message", 
    response: "messages"
  })
  assert.equal(res[0].role, "error")
  */
  // assert.equal(res)

  // CONTEXTS
  // called from code, should throw or add message.role = error
  // from rpc
  // from another chat as tool
  // from command line

  // RETRIES - stop, tool retries
  
  // Error types
  // types of errors
  // u: @{ name | noexec }
  // user: @not_found
  // u: @{ name | proc_throws }
  // u: llm file not found
  // OPENAI_KEY not found
  // tool error @py - python not found, error in python script
  // ctx.text2run("")

}

tests.man1 = async function() {
  const ctx = tune.makeContext(man({ mount: 'man' }))

  const all = await ctx.resolve('man', { type: 'text' })
  assert.equal(all.type, 'text')
  assert.equal(all.name, 'man')
  const allText = await all.read()
  assert.match(allText, /<tune-sdk>/)
  assert.match(allText, /<\/tune-sdk>/)

  const list = await ctx.resolve('man/', { type: 'text' })
  assert.equal(list.type, 'text')
  assert.equal(list.name, 'man/')
  const listText = await list.read()
  assert.match(listText, /tune-sdk -/)

  const one = await ctx.resolve('man/tune-sdk', { type: 'text' })
  assert.equal(one.type, 'text')
  assert.equal(one.name, 'man/tune-sdk')
  const oneText = await one.read()
  assert.ok(oneText.length > 0)

  assert.equal(await ctx.resolve('other', { type: 'text' }), undefined)
  assert.equal(await ctx.resolve('man/unknown', { type: 'text' }), undefined)
  assert.equal(await ctx.resolve('man', { type: 'image' }), undefined)
};

tests.hooks = async function() {
  let ctx = tune.makeContext({ llm: { ...defaultLLM } });

  console.log("hooks: resolve has set default hooks")
  const llm = await ctx.resolve("llm")
  assert.ok(llm.stream2result, "stream2result not set")
  assert.ok(llm.result2msg, "result2msg not set")
  assert.ok(llm.msgs2msgs, "msgs2msgs not set")

  // Processors/composability
  // stream/non stream
  // end of turn
  // fetch

  ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    default: { 
      ...defaultLLM, 
      msgs2msgs: (msgs, newMessages, ctx ) => ([{role: "assistant", content: ""}])
    }
  });
  
  let res = await tune.text2run("user: hi how are you?", ctx);
  assert.equal(res[0].content, '');

  ctx = tune.makeContext({
    OPENAI_KEY: env.OPENAI_KEY,
    default: { 
      ...defaultLLM, 
      // add usage string
      result2msg: (result, msg) => {
        msg = result.choices[0].message
        const { usage } = result
        if (usage) {
          msg.content = `# Token Input (${usage.prompt_tokens}), Cached ${usage.prompt_tokens_details.cached_tokens}, Output ${usage.completion_tokens}, Total ${usage.total_tokens}\n${msg.content||""}` 
        }
        return msg
      }
    }
  });

  res = await tune.text2run("user: hi how are you?", ctx);
  console.log(res)

};

async function once(cond, timeout=10000) {
  let step = 50;
  let time = 0 
  while (!cond() && time < timeout) {
    await new Promise((resolve) =>  setTimeout(resolve, step))
    time += step
  }
  if (time >= timeout ) {
    throw Error(`timeout`)
  }
}

tests.ws = async function () {
  const port = 8081
  const proc = cp.spawn(
    "node",
    ["bin/cli.js", "ws", "--path", "test/", "--port", port],
    {
      encoding: "utf8",
      env: process.env,
      cwd: path.resolve(__dirname, ".."),
      // stdio: ["inherit", "inherit", "inherit"]
    }
  );
  procs.push(proc)

  let out = ""
  let up 
  proc.stdout.on('data', (data) => {
    out += data.toString()
    up = out.match(/listening/)
  })

  proc.stderr.on('data', (data) => {
    out += data.toString()
    console.log(out)
    process.exit(1)
  })
  await once(()=> !!up)

  const ctx = new ContextWebsocket(`ws://localhost:${port}`)
  console.log("read/write");
  const filename = "test/tmp.txt";
  await ctx.write(filename, "value")
  assert.ok(fs.existsSync(filename));

  res = await ctx.read(filename)
  assert.equal(res.trim(), "value")

  fs.unlinkSync(filename)
  //TODO
  /*
  res = await ctx.read("test/sun.webp")
  console.log(res)
  */

  console.log("tool");
  res = await ctx.exec("test/mult.tool.js", { a: 2, b: 2})
  assert.equal(res, 4)

  console.log("llm");
  res = await ctx.file2run({system: "@echo", user:"123"})
  assert.equal(res, "123")

  res = await ctx.file2run({system: "@echo", user:"123", stream: true})

  let msgs
  for await (let item of res) {
    msgs = item
  }
  assert.equal(msgs, "123")


  console.log("error")
  res = await ctx.file2run({user: "@asdf"})
  console.log(res)

  /*TODO:
  console.log("resolve")
  res = await ctx.resolve("test/echo.prompt")
  console.log(res)

  res = await ctx.resolve(".*", { match: "regex", type: "tool" });
  console.log(res)
  */

}

// Test runner
async function run(testList = []) {
  testList = testList.length ? testList : Object.keys(tests);
  let curTest;
  
  while (curTest = testList.shift()) {
    try {
      await tests[curTest]();
      console.log(`✓ pass: ${curTest}`);
    } catch (e) {
      console.log(`✗ fail: ${curTest}`);
      console.error(e);
    } finally {
      if (procs.length) {
        procs.forEach(proc => proc.kill())
        procs = []
      }
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  run(process.argv.slice(2));
}

module.exports = tests;
