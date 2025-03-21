---
title: Context
parent: Template Language
layout: home
permalink: /template-language/context
nav_order: 7
---
## Context
Context is responsible to resolve and find those names referenced by `@`.
In TextEditor context resolves names by looking into files and directories.
For a web app context might check local dictionary or database to resolve the names.
This allows you to iterate and test the a complex prompt locally in you text editor. And then use it in the web app, The only thing that changes - context, but not the prompt.  

Context is built by adding middlewares.

`web.ctx.js`
```javascript
// We add a middleware to the context that intercepts all the variables 
// that starts with `https://` and return a text node that fetches the url on read
module.exports = async function web(node, args, context, next) {
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
}
```

Then connect it
```chat
user: @web
Summarize the content:
@https://domain.com/file.txt
```

If you rename `web.ctx.js` to `default.ctx.js` it will be loaded automatically. No need to connect it


Tune then uses the context to find the varaibles:
```javascript
const tune = require('tune-sdk');
const context = tune.makeContext(require('./web.ctx.js'))
const node = await context.resolve("https://domain.com/file.txt");
const result = await node.read();
console.log(result) // "contents of the website"
```
