---
title: Processors
parent: Template Language
layout: home
permalink: /template-language/processors
nav_order: 6
---
## Extend with Processors
Processor is a way to modify variable using pipe `|` syntax:
For example:
```chat
c: resize or convert an image before it is being sent to llm. 
u: what is on the picture @{ image | resize 512 }

c: set initial value of a file if it does not exists yet
u: knowledge about you
@{ memory | init empty }

c: set a model parameterer
u: @{ openrouter | model deepseek/r1 }

c: set model output to json_schema
u: @{ 4o | json_schema path_to/schema.json }

c: show file with line numbers
u: @{ src/server.js | linenum }
```
These all can be implemented with processors

### Implement `init` processor
Here is a way to implement `init` processor that is called on 
`@{ memory | init empty }`

```javascript
async function init(node, args, context) {
    // file "memory" has been found, return as-is
    if (node) {
        return node;
    }
    // file not found, lets return a node that contains 'empty'
    return {
        type: "text",
        read: async() =>(args || "") 
    }
}
```
`node` is an structure that Tune parses `@` expansions.  
[read] more about nodes in js api


### TextEditor
Put the code into `init.proc.js`.
```javascript
module.exports = async function init(node, args, context) {
    // code here...
}
```
### Use in an app
```javascript
const context = makeContext({
    init: {
        type: "processor",
        exec: async (node, args, context) => {/* ... */}
    }
})
```

### Implement `model` processor
Lets implement another processor. 
`@{ openrouter | model deepseek/r1 }` example:
```javascript
async model(node, args, context) =>  {
    // model not found
    if (!node) {
        return
    }
    // clone the node, to keep all additional properties of the original node
    const newNode = Object.assign({}, node);
    // overwrite just the exec function
    newNode.exec = async (payload, ctx) => {
        payload.model = args.trim();
        return node.exec(payload, ctx);
    }
    return newNode;
}
```

