# Tune for VSCode

[Tune](https://marketplace.visualstudio.com/items?itemName=iovdin.tune) is a handy extension for Visual Studio Code that lets you chat with large language models (LLMs) right in your code editor. Need quick answers, help brainstorming, or running scripts? Tune’s got you covered! You can even use different LLMs and create handy tools in Python, JavaScript, or PHP—all without leaving your editor. Get ready to boost your productivity!


## 🚀 Features
###  💬 .chat file

To start chatting create a .chat file. Use `<Shift>+<Enter>` to trigger chat response 

  <img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/basic.gif width=800 height=450>

### 🔗 Variable expansion

You can use `{filename}` to inject filename contents to the chat.
file can be any text file or image.

  <img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/variables.gif width=800 height=450>


## 🛠️ Setup

1. Install nodejs.
2. Set OPENAI_KEY in settings. By default Tune uses gpt4o-mini. But you can change it

<img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/set_openai_key.gif width=800 height=450>

## ⚙️  Support for Multiple LLMs

Configure different LLMs by creating a `.config.js` file that defines the HTTP payload.

  Example: Setting up Claude with [openrouter.ai](https://openrouter.ai)

  ```javascript
  ({
      url: "https://openrouter.ai/api/v1/chat/completions",
      method: "POST",
      headers: { 
        "content-type": "application/json",
        authorization: `Bearer ${OPEN_ROUTER_KEY}`,
      },
      body: JSON.stringify({ 
        ...payload,
        model: "anthropic/claude-3.5-sonnet"
      })
  })
  ```

  - Add your `OPEN_ROUTER_KEY` to the `.env` file.
  - Use the config in your `.chat` file:

    ```chat
    u: {claude}
    What is the meaning of life?
    ```

  - Naming the config `default.config.js` makes it the default LLM used by Tune.

  **Note**: Tune supports OpenAI and Ollama for streaming. For Anthropic models, use services like OpenRouter.ai.

  <img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/config.gif width=800 height=450>

### 🛠️ Tools 
Tools are functions or scripts that LLMs can call to perform tasks beyond their native capabilities, such as querying a database or calling an external API.

Easily create tools using JavaScript, Python, or PHP. Name your tool files as `toolname.tool.mjs/js/cjs/py/php/chat`.

Here is a shell tool example as ESM module 

**`sh.tool.mjs`**. 

```javascript
import { execSync } from 'node:child_process';

export default async function sh({ text }) {
  return execSync(text, { encoding: "utf8" });
}
```

To use the tool, just expand the file 
```chat
u: {sh} 
what is contents fo the current directory?
tc: sh
ls -la
tr: total 944
-rw-r--r--   1 iovdin  staff    248  3 Oct 22:12 4o.config.js
-rw-r--r--   1 iovdin  staff    253 17 Sep 16:10 4om.config.js
-rw-r--r--   1 iovdin  staff   2128  8 Oct 17:18 README.md
c: 
 tc: stands for tool call
 tr: tool result
```

Here are the shell tool in other languages

**`sh.tool.cjs`**
```javascript
const { execSync } = require('child_process');

exports.default = async function sh({ text }) {
  return execSync(text, { encoding: "utf8" });
};
```

**`sh.tool.py`**
```python
import subprocess

def main(params):
    return subprocess.check_output(params['text'], shell=True, text=True)
```

**`sh.tool.php`**
```php
<?php
function main($params) {
    return shell_exec($params['text']);
}
?>
```

<img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/tool.gif width=800 height=450>

It is possible to make tool out of another chat.
Lets create a tool that gives file a name given text content

**`filename.tool.chat`**
```chat
s: You're given text content, please come up with a filename for the content.
it should use camel case
u: {text}
```

How to use it?
```chat
s: {filename}  
tc: filename
console.log("hello world")
tr: HelloWorld.js
```

Checkout more tools at [Tune GitHub](https://github.com/iovdin/tune)

## Help System Prompt
You can ask for help using
```chat
s: {esc:tune_help}
u: how to make a tool? 
```

### 📫 Contact

For any inquiries or support, feel free to [open an issue](https://github.com/iovdin/tune/issues) on GitHub. Or drop a message to [Tune Discord Channel](https://discord.com/channels/1293110380813484063/1293110381400559689)



