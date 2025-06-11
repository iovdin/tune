---
title: Todo lists / LLM loops
parent: Examples
layout: home
permalink: /examples/todo
nav_order: 7 
---

## Todo lists / LLM loops
LLMs does not have if/else and loops control flow. 
But often you need to perform the same operation on a list of items. Like scrape a bunch of links, or users to search about. 

### Parallel tool calls
You can use parallel tool calls if operation is just a tool call
```chat
system: 
@jina_r @gpt-4.1

user: 
please scrape the list of 
```
