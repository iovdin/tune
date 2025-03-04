---
title: text2run
parent: API
layout: home
permalink: /api/text2run
nav_order: 2
---
## text2run
```javascript
let chatContent = 's: @system\nu: hi how are you?';
const context = makeContext({ system: "You are Groot"});
const messages = await text2run(chatContent, context, { stop: "assistant" });
const result = msg2text(messages); // a: I am Groot
chatContent += `\n${result}`;
```

### Streaming
```javascript
const iterator = text2run(chatContent, context, { stop: "assistant", stream: true });
for await (const messages of iterator){
    msg2text(messages)
    // Note that messages contain concatenated version 
    // a: I 
    // a: I am 
    // a: I am Groot
};
```
### Stop 
`text2run` after getting response from LLM might run again to e.g. call a tool on clien side and then again get LLM response with having tool call result.
You might build multi step agent then should stop running when some conditions met e.g. "FINISH" word.

`stop` option is used to tell text2run when to stop 

`step` - text2run will run 1 time and stop 
`assistant` - text2run will execute until all tool calls are run and there is an assistant text answer 
`(messages) => {}` - text2run will execute until the function return `true`
