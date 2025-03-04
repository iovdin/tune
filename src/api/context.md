---
title: makeContext
parent: API
layout: home
permalink: /api/context
nav_order: 1
---
## makeContext 
[Read](/template-langauge/context) about Context

```javascript
const context = makeContext(
    { key: "value" },
    async function middlware(name, context, type, next){

    },
    anotherContext
);

context.use(async function (name, context, type, next) {
    if (name.indexOf("https://") === -1) {
        return next()
    }
    
    return {
        type: 'text',
        // fetch the url 
        read: async () => {/*..*/}
    }
})

const node = await context.resolve("key");
const result = await node.read();
console.log(result) // "value"
```

