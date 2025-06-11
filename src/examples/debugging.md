---
title: Debugging
parent: Examples
layout: home
permalink: /examples/debug
nav_order: 6 
---
## Debug 
There are few ways to debug tune execution 

### Check actual LLM payload
We might want to know how does actually LLM api call looks like

```chat
system:
@{ gpt-4.1 | log payload.json }
user: 
first message
assistant:
second message
user:
third message
```

So lets create a `log.proc.js` processor that saves api payload to a file
```javascript
const fs = require("fs")
module.exports = async (node, filename, ctx)  => ({
    ...node,
    exec: async function(payload, ctx) {
        const res = await node.exec(payload, ctx)
        const content = JSON.stringify(JSON.parse(res.body), null, "  ")
        filename = filename ? filename.trim() : "log.json";
        fs.writeFileSync(filename, content);
        return res
    }
})

```

`payload.json` contents:
```json
{
  "model": "gpt-4.1",
  "messages": [
    {
      "role": "system",
      "content": ""
    },
    {
      "role": "user",
      "content": "first message"
    },
    {
      "role": "assistant",
      "content": "second message"
    },
    {
      "role": "user",
      "content": "third message"
    }
  ],
  "stream": true
}
```
