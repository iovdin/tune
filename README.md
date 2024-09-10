# Tune for VSCode

Tune is a handy extension for Visual Studio Code that lets you chat with large language models (LLMs) right from your text editor. If you’ve ever wanted to get quick answers or brainstorm ideas without switching apps, Tune is here to help!


# Setup
 1. Install nodejs.
 2. Set OPENAI_KEY in settings. By default Tune uses gpt4o-mini. But you can change it

  <img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/set_openai_key.gif width=800 height=450>

# Features
## .chat file
To start chatting create a .chat file. Use `<Shift>+<Enter>` to trigger chat response 

  <img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/basic.gif width=800 height=450>

## variable expansion
you can use {filename} to inject filename contents to the chat
  <img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/variables.gif width=800 height=450>

## Other LLMS 
1. To use different LLM create a .config.js file that represents http payload.
  <img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/config.gif width=800 height=450>

e.g. lets create a claude config that uses openrouter.ai

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

2. put OPEN_ROUTER_KEY to .env file

3. use the file as variable
```chat
u: {claude}
What is the meaning of life?
```

You can name it `default.config.js` then it will be used automatically


## Help System Prompt
You can ask for help using
```chat
s: {esc:tune_help}
u: how to make a tool? 
```

## Tools 
  <img src=https://raw.githubusercontent.com/iovdin/tune/main/gifs/tool.gif width=800 height=450>
