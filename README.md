# Tune for VSCode

![Tune](https://raw.githubusercontent.com/iovdin/tune/main/assets/banner.png)

[Tune](https://marketplace.visualstudio.com/items?itemName=iovdin.tune) is a powerful extension for Visual Studio Code that integrates chat capabilities with large language models (LLMs) directly into your text editor. Whether you need quick answers, brainstorming assistance, or code suggestions, Tune allows you to interact with LLMs without leaving your development environment.

## 🚀 Features

### 💬 Chat Integration

- **.chat Files**: Start chatting by creating a `.chat` file. Use `<Shift>+<Enter>` to trigger a chat response.
  
  ![Basic Chat](https://raw.githubusercontent.com/iovdin/tune/main/gifs/basic.gif)

### 🔗 Variable Expansion

- **Dynamic Content**: Utilize `{filename}` to inject the contents of any text file or image into the chat.
  
  ![Variable Expansion](https://raw.githubusercontent.com/iovdin/tune/main/gifs/variables.gif)

### ⚙️ Support for Multiple LLMs

- **Custom LLMs**: Configure different LLMs by creating a `.config.js` file that defines the HTTP payload.

  Example: Setting up Claude with [OpenRouter.ai](https://openrouter.ai)

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

### 🛠️ Tools Integration

- **Extend LLM Capabilities**: Tools are functions or scripts that LLMs can call to perform tasks beyond their native capabilities, such as querying a database or calling an external API.

- **Creating Tools**: Easily create tools using JavaScript, Python, or PHP. Name your tool files as `toolname.tool.mjs/js/cjs/py/php/chat`.

  **Example: Shell Tool in ESM Module (`sh.tool.mjs`)**

  ```javascript
  import { execSync } from 'node:child_process';
  
  export default async function sh({ text }) {
    return execSync(text, { encoding: "utf8" });
  }
  ```

  **Usage in Chat:**

  ```chat
  u: {sh} 
  What are the contents of the current directory?
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

  **Tools in Other Languages:**

  - **CommonJS (`sh.tool.cjs`)**
  
    ```javascript
    const { execSync } = require('child_process');
    
    exports.default = async function sh({ text }) {
      return execSync(text, { encoding: "utf8" });
    };
    ```

  - **Python (`sh.tool.py`)**
  
    ```python
    import subprocess
    
    def main(params):
        return subprocess.check_output(params['text'], shell=True, text=True)
    ```

  - **PHP (`sh.tool.php`)**
  
    ```php
    <?php
    function main($params) {
        return shell_exec($params['text']);
    }
    ?>
    ```

  ![Tools Integration](https://raw.githubusercontent.com/iovdin/tune/main/gifs/tool.gif)

  **Advanced Tool Example: Filename Generator**

  - **Tool Definition (`filename.tool.chat`)**
  
    ```
    s: You're given text content, please come up with a filename for the content.
    It should use camel case.
    u: {text}
    ```

  - **Usage:**
  
    ```chat
    s: {filename}  
    tc: filename
    console.log("hello world")
    tr: HelloWorld.js
    ```

  Explore more tools in the [Tune GitHub Repository](https://github.com/iovdin/tune).

### 🆘 Help System Prompt

- **Get Assistance**: Use the help system prompt to get guidance on using Tune.
  
  ```chat
  s: {esc:tune_help}
  u: How do I create a new tool?
  ```

## 🛠️ Setup & Installation

1. **Install Node.js**

   Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

2. **Install Tune Extension**

   Install the [Tune extension](https://marketplace.visualstudio.com/items?itemName=iovdin.tune) from the VSCode Marketplace.

3. **Configure API Keys**

   - Open VSCode settings.
   - Set the `OPENAI_KEY`. By default, Tune uses `gpt4o-mini`, but you can change it to another model if desired.

   ![Set OpenAI Key](https://raw.githubusercontent.com/iovdin/tune/main/gifs/set_openai_key.gif)

## 📂 Usage

### Creating a Chat File

1. Create a file with the `.chat` extension.
2. Start chatting by typing your message.
3. Press `<Shift>+<Enter>` to get a response from the LLM.

### Using Variable Expansion

Inject file contents or images into your chat seamlessly using `{filename}` syntax.

### Configuring Multiple LLMs

Customize and switch between different LLMs by setting up `.config.js` files tailored to your preferred service providers.

### Developing Tools

Extend Tune's functionality by creating custom tools in JavaScript, Python, or PHP to perform specific tasks within your chats.

## 📚 Examples

- **Basic Chat Interaction**

  ![Basic Chat](https://raw.githubusercontent.com/iovdin/tune/main/gifs/basic.gif)

- **Variable Expansion**

  ![Variable Expansion](https://raw.githubusercontent.com/iovdin/tune/main/gifs/variables.gif)

- **Tools Integration**

  ![Tools Integration](https://raw.githubusercontent.com/iovdin/tune/main/gifs/tool.gif)


## 📫 Contact

For any inquiries or support, feel free to [open an issue](https://github.com/iovdin/tune/issues) on GitHub. Or drop in to [Discord Channel](https://discord.com/channels/1293110380813484063/1293110381400559689)

---

**Enjoy using Tune for VSCode!** 🚀


