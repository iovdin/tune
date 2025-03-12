---
title: Connecting LLMs
parent: Template Language
layout: home
permalink: /template-language/connect-llm
nav_order: 2 
---

## Connect LLM
To use an LLM like `gpt-4o` or `claude-sonnet` you have to specify a function that takes messages and tools, and returns full parameters. Tune uses javascript [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) with returned parameters (as-is) to call LLM api.
The endpoint should support Open AI format response 


`4o-mini.llm.js`
```javascript
module.exports = async (payload , context) => {
    const key = await context.read("OPENAI_KEY");
    // const key = process.env.OPENAI_KEY;
    return ({
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
        headers: { 
            "content-type": "application/json",
            authorization: `Bearer ${key}` 
        },
        body: JSON.stringify({ 
            ...payload,
            model: "gpt-4o-mini",
        })
    })
}
```

Model is a good place to choose model parameters, get tail of messages etc.

### Using multiple LLMs 
You might want to start chatting using cheap model and then switch to a smart one if smth goes wrong. The latest model connected is used for the chat.

```chat
u: @4o-mini 
c: conversation which 4o-mini struggle to give the right answer
u: @o3-mini 
Can you think a bit more about the problem?

```

Now you can use the model in you chat by `4o-mini` name
```chat
user: @4o-mini 
Who are you? 
assistant:
I'm ChatGPT, an AI assistant here to help with any questions or tasks you have!
```

### Connect to app
Add the following structure to the context
```javascript
const llm = require("./4o-mini.llm.js")
const context = makeContext({
    "4o-mini": { 
        type: "llm",
        exec: llm
    }
})
    
```

[read more about context]
