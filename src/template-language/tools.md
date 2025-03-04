---
title: Using Tools
parent: Template Language
layout: home
permalink: /template-language/tools
nav_order: 3 
---
## Using Tool
Tools is a very powerfull concept. It makes LLM agentic. Without tools LLM is just a chat.
It might be hard to grasp at start. But it is definetly worth investing your time understanding it.

Lets look at a chat with a `calendar` tool
```chat
user: @calendar 
What's my schedule for today?
assistant: 
Let me check your calendar for today.
tool_call: calendar {"date": "2024-02-25"}
tool_result: {
  "events": [
    {"time": "09:00", "title": "Team Meeting"},
    {"time": "13:00", "title": "Lunch with John"},
    {"time": "15:30", "title": "Project Review"}
  ]
}
assistant: 
Here's your schedule for today:
- 9:00 AM: Team Meeting
- 1:00 PM: Lunch with John
- 3:30 PM: Project Review
```

`tool_call` and `tool_result` is gray because in a normal chat app users won't see it, they'll see the final `assistant` reply.

But lets make them visible to understand who is doing what.
```chat
user: @calendar 
What's my schedule for today?
assistant: 
Let me check your calendar for today.
tool_call: calendar {"date": "2024-02-25"}
tool_result: {
  "events": [
    {"time": "09:00", "title": "Team Meeting"},
    {"time": "13:00", "title": "Lunch with John"},
    {"time": "15:30", "title": "Project Review"}
  ]
}
assistant: 
Here's your schedule for today:
- 9:00 AM: Team Meeting
- 1:00 PM: Lunch with John
- 3:30 PM: Project Review
```
{: #tool-highlight}

Now we see that `tool_call` is made by LLM/assistant. 
But who is writing content for `tool_result`? This is Tune running some calendar code/program and inserting the result of it back as a `tool_result`. In Text editor, Tune will run the code on your computer/laptop, in an app tune will run the tool on the server.


### Schema
Schema is a way to tell LLM what tools are available, and how to call it, so it can emit `tool_call`.  
```json
{ 
    "description": "get calendar events for date",
    "parameters": { 
        "type": "object",
        "properties": { 
            "date": { 
                "type": "string",
                "description": "date for events" 
            },
        },
        "required": [ "date" ] 
    } 
}
```

[read more](https://platform.openai.com/docs/guides/function-calling?example=send-email&lang=node.js#defining-functions) about tool calling at openai 

### Code
There must a code that Tune will execute when LLM issues `tool_call`. Result of the code will be inserted into `tool_result`

```javascript
async function calendar({ date }, context) {
    // query the calendar code
    // should be here
}
```


### Create a tool in TextEditor

Put schema into `calendar.schema.json` file and code into
`calendar.tool.mjs` like: 
```javascript
export default async function calendar({ date }, context) {
    // code here
    return result 
}
```
You can first create the code and then Tune on the first run of the tool will try to generate `calendar.schema.json` file for you

### Create tool for an app
```javascript
const context = makeContext({
    calendar: {
        type: "tool",
        schema: schemaObject, 
        exec: async calendar({ data }, context) => {/* ... */}
    }
})
```
[read more] about context.
Check out tool examples
