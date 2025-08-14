# Tune - AI chat in text file

Tune is a handy [extension](https://marketplace.visualstudio.com/items?itemName=iovdin.tune) for Visual Studio Code and [plugin](https://github.com/iovdin/tune.nvim) for Neovim that lets you chat with large language models (LLMs) in a text file. 
With tune [javascript sdk](https://www.npmjs.com/package/tune-sdk) you can make apps and agents. 

## Demo
<video src="https://github.com/user-attachments/assets/23f8ab30-58db-4159-8761-f212a7960e0c">
</video>

## Template Language

```chat
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


## Batteries Included
**Anthropic/OpenAI/Gemini/Openrouter/Mistral/Groq** models providers are supported and **30+ tools** come with text editor.
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
[read more](tools/README.md)

## CLI

```bash
# append user message to newchat.chat run and save
npx tune-sdk --user "hi how are you?" --filename newchat.chat  --save

# start new chat with system prompt and initial user message 
# print result to console
npx tune-sdk --system "You are Groot" --user "Hi how are you?"

#set context variable
npx tune-sdk --set-test "hello" --user "@test" --system "You are echo you print everythting back"  
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

### 📫 Contact

For any inquiries or support, feel free to [open an issue](https://github.com/iovdin/tune/issues) on GitHub. Or drop a message to [Tune Discord Channel](https://discord.com/channels/1293110380813484063/1293110381400559689)

