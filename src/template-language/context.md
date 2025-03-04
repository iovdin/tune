---
title: Context
parent: Template Language
layout: home
permalink: /template-langauge/context
nav_order: 7
---
## Context
Context is responsible to resolve and find those names referenced by `@`.
In TextEditor context resolves names by looking into files and directories.
For a web app context might check local dictionary or database to resolve the names.
This allows you to iterate and test the a complex prompt locally in you text editor. And then use it in the web app, The only thing that changes - context, but not the prompt.  

Context is built by adding middlewares
```javascript
const dict = { key: "value" }
context.use(async (name, context, type, next) => {
    if (dict[name]) {
        return {
            type: "text",
            read: async () => dict[name]
        }
    }
    next()
})
```

Tune then uses the context to find those names:
```javascript
const node = await context.resolve("key");
const result = await node.read();
console.log(result) // "value"
```

### Processor that modifies context
To change context in TextEditor you have to use a processor.
Say we want to `@` syntax to fetch files from the web like:
```chat
user:  @{| expand-http }
Summarize the content:
@https://domain.com/file.txt
```
There is no `node` here to modify. Because we modify the context.

We add a middleware to the context that intercepts all the variables 
that starts with `https://` and return a text node that fetches the url on read

```javascript
async function expandWeb(node, args, context) {
    context.use(async (name, context, args, next) => {
        if (name.indexOf("https://") == -1) {
            return next();
        }
        const url = name.trim()

        return {
            type: "text",
            name,
            read: async () => {
                const res = await fetch(url);
                return res.text()
            }
        }
    })
    return node
}
```
