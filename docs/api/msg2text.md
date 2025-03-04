---
title: msg2text
parent: API
layout: home
permalink: /api/msg2text
nav_order: 3
---
## msg2text
msg2text it converts messages array return from openai api to chat file format.
```javascript
const messages = [
    {
        role: "assistant",
        content: "hello" 
    },
    {    
        role: "assistant",
        tool_calls: [
            { 
                id: "call-1",
                type: "function",
                "function" : {
                    name: "name",
                    arguments: "{\"args\": 1, \"text\": \"special parameter\"}"
                }
            }
        ],
    },
    {
        role: "tool",
        id: "call-1",
        content: "tool result"
    }

]

msg2text(messages)
// a: hello
// tc: name { "arg": 1 }
// special parameter
// tr: tool result
```
