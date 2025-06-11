---
title: Manage llm context size
parent: Examples
layout: home
permalink: /examples/context-size
nav_order: 5 
---
## LLM context size
Message number in chat can be big. It become costly, LLM forgetting what was the goal.  
So lets make a `tail` processor that cuts the context size to the last few messages.

```chat
system:
@{ gpt-4.1 | tail 2 }
user: 
first message
assistant:
second message
user:
third message
```

`tail.proc.js`
```javascript
module.exports = async function tail(node, args) {
  const n = parseInt(args, 10);
  const count = (isNaN(n) || n <= 0) ? 20 : n;
  return {
    ...node,
    exec: async (payload, ctx) => {
      const startIndex = Math.max(0, payload.messages.length - count)
      const messages = payload.messages.filter(
        (message, index) => (message.role === "system") || (index >= startIndex))
    
      return node.exec({
        ...payload,
        messages
      }, ctx)
    }
  }
};
```

Here the LLM will see only last 2 messages from the chat:
```json
{
  "model": "gpt-4.1",
  "messages": [
    {
      "role": "system",
      "content": ""
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
