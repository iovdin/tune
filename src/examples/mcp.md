---
title: Connect MCP 
parent: Examples
layout: home
permalink: /examples/mcp
nav_order: 2.3
---
## Connect MCP 
[Model Context Protocol](https://docs.anthropic.com/en/docs/agents-and-tools/mcp) (MCP) is a protocol from Anthropic 
>MCP is an open protocol that standardizes how applications provide context to LLMs. Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect your devices to various peripherals and accessories, MCP provides a standardized way to connect AI models to different data sources and tools.


Lets make a `mcp.proc.mjs` [processor]({{ site.baseurl }}/template-language/processors), so that we can use tools from a MCP server in tune.

Like this:
```chat
system: 
@{| mcp npx -y @modelcontextprotocol/server-filesystem ./ }
user: 
what is in my current directory?
tool_call: list_allowed_directories
tool_result: 
Allowed directories:
/Users/iovdin/projects/tune
tool_call: list_directory {"path":"/Users/iovdin/projects/tune"}
tool_result: 
[FILE] .DS_Store
[DIR] .git
[DIR] .github
[FILE] .gitignore
...
```

`mcp.proc.mjs`
```javascript
export default async function mcp(node, command, ctx) {
    // node is null
    // command is "npx -y @modelcontextprotocol/server-filesystem ./"
    const client = await getMcpClient(command, process.env)
    if (!client.server.capabilities.tools) {
        throw Error(`${command} does not support tools`)
    }
    const res = await client.request({ method: "tools/list"})
    // return array 'tool' nodes 
    return res.tools.map(item => ({
        type: "tool",
        name: item.name,
        schema: {
            name: item.name,
            description: item.description,
            parameters: item.inputSchema
        },
        // actual tool call
        exec: async (args) => { 
            const res = await client.request({
                method: "tools/call", 
                params: {
                    name: item.name, 
                    arguments: args 
                }}) 
            if (res.isError) {
                throw Error(`error calling ${item.name}`)
            }
            return res.content
                .map(item => {
                    if (item.type == "text") {
                        return item.text
                    }
                    // not supported yet
                    return ""
                })
                .join("\n")
        }
    }))
}
```

Actuall implmementation is included with VSCode extension and Neovim plugin
