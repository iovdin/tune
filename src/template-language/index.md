---
title: Template Language
layout: home
permalink: /template-language
nav_order: 2
---
## Template Language

Tune has the same syntax `@` to:
* insert content of another text file (`text` type)
* add an image for models that supports vision (`image` type)
* specify language model ([`llm`]({{ site.baseurl }}/template-langugage/connect-llm) type)
* add a tool to be called ([`tool`]({{ site.baseurl }}/template-langage/tools) type)

Here's an example combining these features:
```chat
system: @gpt4o 
@systemPrompt.txt
user: @image
what os on the image?
assistant: 
this is Rome
user: @getWeather
what is the weather here?
tool_call: getWeather {"location": "Rome"}
tool_result: {
  weather: [
    { id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }
  ],
  ... 
}
```

You can use `@` anywhere at any point of the chat (`assistant` and `tool_call` is and [exception](/special-chars)).
You might want to switch to a smarter model or use a tool later in the conversation
