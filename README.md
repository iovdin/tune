# Tune - The last AI tool you’ll need to learn 
[![Reddit](https://img.shields.io/badge/Reddit-%23FF4500.svg?style=for-the-badge&logo=Reddit&logoColor=white)](https://www.reddit.com/r/tuneai/) 
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/hu32FNYPYD)

Tune is a handy [extension for Visual Studio Code and](https://marketplace.visualstudio.com/items?itemName=iovdin.tune) and [plugin for Neovim](https://github.com/iovdin/tune.nvim) and [plugin for Sublime Text](https://github.com/iovdin/tune-sublime) that lets you chat with large language models (LLMs) in a text file. 
With tune [javascript sdk](https://www.npmjs.com/package/tune-sdk) you can make apps and agents. 

## Demo
<video src="https://github.com/user-attachments/assets/23f8ab30-58db-4159-8761-f212a7960e0c">
</video>


## Setup
install tune-sdk
```bash
npm install -g tune-sdk

tune-sdk init
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


## Diagram

```mermaid
flowchart TD 

  subgraph Entry[" "]
    Editor["VSCode/Neovim/Sublime Text"]
    CLI["CLI"]
    App["App"]
  end

  subgraph Core[" "]
    MD1["~/.tune/default.ctx.js"]
    MD2["require('tune-fs')
require('tune-models')
"]
    CTX["tune.makeContext(...middlewares)"]
    F2R["ctx.file2run(params)"]
  end

  
  MD1 --> |cli middlewares| CTX
  MD2 --> |app middlewares| CTX
  Editor -->| $ tune-sdk rpc | Core
  CLI --> | $ tune-sdk --user hello | Core
  App --> Core
  
  
  
  F2R -->|ctx.resolve #40; system.txt #124; shell #124; gpt-5  #41; | CTX
  CTX -->| #123; type: text #124; tool #124; llm #125; | F2R

  F2R --> |fetch| LLM["https://provider.com/v1/chat/completions"]
  F2R --> |call| Tool
```

## Extend with Middlewares
Extend Tune with middlewares:

* [tune-fs](https://www.npmjs.com/package/tune-fs) - connect tools & files from local filesystem
* [tune-models](https://www.npmjs.com/package/tune-models) - connect llm models from Anthropic/OpenAI/Gemini/Openrouter/Mistral/Groq
* [tune-basic-toolset](https://www.npmjs.com/package/tune-basic-toolset) - basic tools like read file, write file, shell etc.
* [tune-s3](https://www.npmjs.com/package/tune-s3) - read/write files from s3
* [tune-mcp](https://www.npmjs.com/package/tune-mcp) - connect tools from mcp servers

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


## CLI

```bash
# install tune globally
npm install -g tune-sdk

# append user message to newchat.chat run and save
tune-sdk --user "hi how are you?" --filename newchat.chat  --save

# start new chat with system prompt and initial user message 
# print result to console
tune-sdk --system "You are Groot" --user "Hi how are you?"

#set context variable
tune-sdk --set-test "hello" --user "@test" --system "You are echo you print everythting back"  
```


## Javascript SDK
`npm install tune-sdk`

```javascript
const tune = require("tune-sdk");
const sonnet = require("./sonnet.llm.js");

require('dotenv').config();

async function main() {
  const ctx = tune.makeContext({
    echo: "You are echo, you print everything back",
    OPENROUTER_KEY: process.env.OPENROUTER_KEY,
    "default": {
      type: "llm",
      exec: sonnet
    }
  })

  const text = "s: @echo\nu: hello world";
  const messages = await tune.text2run(text, ctx)
  console.log(tune.msg2text(messages))
  // a: hello world
}
main()
```
[read more](https://iovdin.github.io/tune/api) about javascript sdk
