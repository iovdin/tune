# Tune - chat with llm in a text file 
[![Reddit](https://img.shields.io/badge/Reddit-%23FF4500.svg?style=for-the-badge&logo=Reddit&logoColor=white)](https://www.reddit.com/r/tuneai/) 
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/hu32FNYPYD)

Tune is a handy [extension for Visual Studio Code and](https://marketplace.visualstudio.com/items?itemName=iovdin.tune) and [plugin for Neovim](https://github.com/iovdin/tune.nvim) and [plugin for Sublime Text](https://github.com/iovdin/tune-sublime) that lets you chat with large language models (LLMs) in a text file. 
With tune [javascript sdk](https://www.npmjs.com/package/tune-sdk) you can make apps and agents. 

## Demo
[![asciicast](https://asciinema.org/a/757894.png)](https://asciinema.org/a/757894)


## Setup
install tune-sdk
```bash
npm install -g tune-sdk

# create ~/.tune folder and install batteries
tune init
```

edit `~/.tune/.env` file and add `OPENAI_KEY` and other keys


## Template Language

```chat
user:
@myprompt     include file
@image        include image
@path/to/file include file at path
@gpt-4.1      connect model
@shell        connect tool
@@prompt      include file recursively

@{ name with whitespaces } - include file with whitespaces
@{ image | resize 512 }    - modify with processors
@{ largefile | tail 100 }  - modify with processors
@{| sh tree }              - insert generated content with processors

```
[read more](https://iovdin.github.io/tune/template-language)

## Extend with Middlewares
Extend Tune with middlewares:

* [tune-fs](https://github.com/iovdin/tune-fs) - connect tools & files from local filesystem
* [tune-models](https://github.com/iovdin/tune-models) - connect llm models from Anthropic/OpenAI/Gemini/Openrouter/Mistral/Groq
* [tune-basic-toolset](https://github.com/iovdin/tune-basic-toolset) - basic tools like read file, write file, shell etc.
* [tune-s3](https://github.com/iovdin/tune-s3) - read/write files from s3
* [tune-mcp](https://github.com/iovdin/tune-mcp) - connect tools from mcp servers
* [maik](https://github.com/iovdin/maik) - fetch all you emails, and index them into sqlite database


For example:
```sh
cd ~/.tune 
npm install tune-models
```

Edit `default.ctx.js` and add middlewares
```javascript
const models = require('tune-models')

module.exports = [
    ...
    models({
        default: "gpt-5-mini"
    })
    ...
]
```

Edit `.env` file and add provider's keys

```.env
OPENAI_KEY="<openai_key>"
ANTHROPIC_KEY="<anthropic_key>"
```

Use it in chat
```chat
system: 
@gemini-2.5-pro @openai_imgen

user: 
draw a stickman with talking bubble "Hello world"

assistant: 
tool_call: openai_imgen {"filename":"stickman_hello_world.png"}
a simple stickman drawing with a talking bubble saying 'Hello world'

tool_result: 
image generated
```


## Command Line

```bash
# install tune globally
npm install -g tune-sdk

tune "hi how are you?"

# append user message to newchat.chat run and save
tune --user "hi how are you?" --filename newchat.chat  --save

# start new chat with system prompt and initial user message 
# print result to console
tune --system "You are Groot" --user "Hi how are you?"

# set context variable
tune --set test="hello" --user "@test" --system "You are echo you print everythting back"  
# prints hello

```

### Static web server + context over WebSocket

Make simple web apps that share the same tools, files, and models available in Tune Chat. Tune Chat and the web app share the same context:

```javascript
// Read files
await ctx.read("path/to/file")

// Write files
await ctx.write("path/to/file", content)

// Execute tools
let result = await ctx.exec("tool", { param: "value" })
// Note that `result` is always a string. If you expect JSON:
result = JSON.parse(result)

// Also render errors to the user, since you won’t be able to see and debug them otherwise.

// Call LLM
const result = await ctx.file2run({ user: "hi" })
```

Create an app, e.g. `index.html`:

```html
...
<!-- Load the context into `window.ctx` -->
<script src="/contextws.js"></script>
...
```

Run the static web server from the folder:

```bash
$ tune ws

listening on http://localhost:8080
```

## Javascript SDK
`npm install tune-sdk`

Tune core is middleware-based. A context resolves `@name` references into nodes like `text`, `tool`, `llm`, and `processor`.

```javascript
const tune = require("tune-sdk")

async function main() {
  const ctx = tune.makeContext()

  ctx.use(async function middleware(name) {
    if (name === "file.txt") {
      return {
        type: "text",
        name: "file.txt",
        read: async () => fs.readFileSync("file.txt", "utf8")
      }
    }

    if (name === "readfile") {
      return {
        type: "tool",
        name: "readfile",
        schema: {
          type: "object",
          properties: {
            filename: { type: "string" }
          }
        },
        exec: async ({ filename }) => fs.readFileSync(filename, "utf8")
      }
    }

    if (name === "gpt-5") {
      return {
        type: "llm",
        name: "gpt-5",
        exec: async (payload) => ({
          url: "https://api.openai.com/v1/chat/completions",
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-5",
            ...payload
          })
        })
      }
    }

    if (name === "tail") {
      return {
        type: "processor",
        name: "tail",
        exec: async (node, args) => {
          if (!node) return
          if (node.type !== "text") throw Error("tail can only modify text nodes")
          return {
            ...node,
            read: async () => {
              const content = await node.read()
              const n = parseInt(args.trim(), 10) || 20
              return content.split("\n").slice(-n).join("\n")
            }
          }
        }
      }
    }
  })

  const content = await ctx.file2run({
    system: "@gpt-5 @readfile",
    user: "can you read file.txt?",
    stream: false,
    response: "content"
  })

  console.log(content)
}

main()
```

[read more](https://iovdin.github.io/tune/api) about javascript sdk

## Help / Manual

You can access tune manuals and available middlewares manuals from 

```chat
system:
@man include all manuals for all connected packages
@man/ - list all the manuals, like list directory
@man/tune-sdk - get manual for tune core package 
@man/tune-basic-toolset - get manual for tune-basic-tool set package

read any of it as a file
tool_call: rf { "filename": "man/tune-basic-toolset"}
tool_result:
@man/tune-basic-toolset
```

To connect man middleware in `default.ctx.js`:

```javascript
const man = require('tune-sdk/man')

module.exports = [
    ...
    man(),
    ...
]
```

To expose `README.md` of your npm package as `man/<package-name>`, in your package/src/index.js add:
```javascript
const man = require("tune-sdk/man");

// this method will read package.json and README.md
man.add(__dirname)
````

