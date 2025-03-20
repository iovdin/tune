---
title: Home
layout: home
permalink: /
nav_order: 1
---
# Tune - your everyday LLM toolkit

Tune is a toolkit that helps developers and users work with Large Language Models (LLMs). Whether you want to chat with AI, build applications, or create AI agents, Tune provides a simple yet powerful way to work with LLMs.
<video autoplay loop muted playsinline width="100%">
<source src="https://github.com/user-attachments/assets/80c5e511-a681-44bb-839f-8fbdc2ac65ef"/>
</video>

- TOC
{:toc}

## .chat file format 

The core of Tune is to have chat as a human-readable text file.
* read, modify and chat right in your text editor. 
* store chat and prompts in version control. 
* manage chats like regular files - copy, move, organize in folders, share, or download them


Example:
```chat
system: 
You are a helpful writing assistant who specializes in clear, concise explanations.
user: 
Can you help me understand what photosynthesis is?
assistant: 
Photosynthesis is how plants make their own food. They take sunlight, water, and carbon dioxide from the air, and turn it into sugar and oxygen. Think of it like a tiny solar-powered factory inside each leaf.
```

Shorthand chat version:
```chat
s: You are Groot
u: Hi, how are you?
a: I am Groot
```

Example with tools
```chat
system: @get_weather
You are a weather assistant who helps people plan their activities.
user: 
What's the weather like in Rome today?
tool_call: get_weather {"location": "Rome", "country": "IT"}
tool_result: {
    "temperature": 24,
    "conditions": "sunny"
}
assistant: 
Perfect weather in Rome today! It's sunny and 24°C (75°F) - great for sightseeing or outdoor cafés. Don't forget sunscreen!
```

Using `@` you can
* insert content of another text file
* pick language model like gpt-4o or sonnet or deepseek
* connect a tool to be called
* add an image for models that supports vision

Read more about [Template Language]({{ site.baseurl }}/template-language). Learn about [Tools]({{ site.baseurl }}/template-language/tools) or check [Weather Tool]({{ site.baseurl }}/examples/weather) implementation


## Getting started
The easiest way to get started is to install [VSCode](https://marketplace.visualstudio.com/items?itemName=iovdin.tune) or [Neovim](https://github.com/iovdin/tune.nvim) extension. put `OPENAI_KEY` to an `.env` file and chat:

<img src="{{ site.baseurl }}/assets/gifs/basic.gif" width=800 height=450>


Using <Shift+Enter> the extension make LLM to give a response to current chat or to call a tool and print result.  


## Hello World App
Let make a simple app with tune.

Install `npm install tune-sdk`

```javascript
import { text2run, makeContext, msg2text } from 'tune-sdk';

async function main() {
    // Tune resolves template variables via context 
    const ctx = makeContext({ 
        system: "You're Groot",
        "default": {
            type: "llm",
            exec: defaultLLM 
        }
    })
    const text = "s: @system\nu: Hi, how are you?";
    const messages = await text2run(text, ctx)
    console.log(msg2text(messages)) 
    // a: I am Groot
}

const defaultLLM = async (payload, ctx) => ({
    url: "https://api.openai.com/v1/chat/completions",
    method: "POST",
    headers: { 
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_KEY}` 
    },
    body: JSON.stringify({ 
        ...payload,
        model: "gpt-4o-mini"
    })
})
main()

```
