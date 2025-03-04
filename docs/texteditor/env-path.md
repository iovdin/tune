---
title: TUNE_PATH and .env
parent: Text Editor
layout: home
permalink: /text-editor/tune-path-and-dot-env
nav_order: 3
---
## TUNE_PATH
If you have a set of tools, llms, prompts, api keys that you use a lot across your projects.
Put them into a separate folder and include it into TUNE_PATH in your `.bashrc`
```bash
export TUNE_PATH=/path/to/my/tools
```

TUNE_PATH is a list of directories where the names/variables are looked in, it includes current directory, directory of the current file, tune installation directory and other paths you might add


## .env files
IDE extension will try to load .env in every directory in TUNE_PATH.
You can access these varaibles using context:
```javascript
module.exports = async function(payload, ctx) {
    const api_key = await ctx.read("OPENAI_KEY");
    return {
        // create fetch payload
    } 
}
```
