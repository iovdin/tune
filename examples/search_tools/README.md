Connecting all the tools available to a chat causes LLM confusion and context size increase. So lets create a tool that searches and connects right tool for a given task:

**search_tools.tool.chat**
```chat
system:
@gpt-5
Given user task
You provide a list of tools that are best help for the user

<tool-list>
"wf" - write file 
"rf" - read file
"sh" - execute a shell command
"patch" - patch file
"openai_imgem" - generate image with openai
</tool-list>

example answer:
\@tool_name1 "tool_name1" - because it helps to do X
\@tool_name2 "tool_name2" - because it helps with Y
...
user:

@text

```

Use it:
```chat
user:
@claude-sonnet-4-5-20250929
@search_tools 

what is contents of current directory?

assistant:
I'll help you find tools to check the contents of the current directory.

tool_call: search_tools
list contents of current directory files folders

tool_result:
\@sh "sh" - because it can run shell commands like `ls -la` to list files/folders on Unix-like systems

```
Tune can connect **@sh** tool but by default all tool results are escaped `\@sh`
The trick here is to turn off automatic escaping by setting **$escape_output: false** in schema.json file
**search_tools.schema.json**
```json
{
  "description": "There is a tool list available, find ones and connect that are appropriate for the task",
  "parameters": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "User task description"
      }
    },
    "required": ["text"]
  },
  "$escape_output": false
}
```

Now it works:
```chat
tool_result:
@sh "sh" - because it can run shell commands like `ls -la` to list files/folders s
assistant:

I'll use the shell command to list the contents of the current directory:

tool_call: sh
ls -la

tool_result:
total 32
drwxr-xr-x  6 iovdin  staff   192 Nov  6 10:56 .
drwxr-xr-x  9 iovdin  staff   288 Nov  6 10:54 ..
-rw-r--r--\@ 1 iovdin  staff  1541 Nov  6 11:08 README.md
-rw-r--r--  1 iovdin  staff   332 Nov  6 10:55 search_tools.schema.json
-rw-r--r--  1 iovdin  staff   307 Nov  6 10:55 search_tools.tool.chat
-rw-r--r--  1 iovdin  staff   318 Nov  6 10:55 tool_list.proc.js

```

We do not want to write full list of tools manually into the prompt. Lets make a `processor` that queries context for all the tools. Editor autocomplete uses the same call.

**tool_list.proc.js**
```javascript

module.exports = async function toolList(node, args, ctx) {
  // this context call will return all the tools available for the context
  const tools = await ctx.resolve(".*", {
    type: "tool", 
    output: "all",
    match: "regex"
  })

  // return text node that will expand into tool names + description from schema
  // we do not want put the full schema here, so saving context size
  return {
    type: "text",
    read: async () => 
      tools.map(tool => `## tool: '${tool.name}'\n${tool.schema?.description}\n` ).join("\n")

  }
}

```

Back to our **search_tools.tool.chat**
```chat
system:
...

<tool-list>
@|tool_list
</tool-list>

...
```

And we're done!
