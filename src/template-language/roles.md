---
title: Chat Roles
parent: Template Language
layout: home
permalink: /template-language/roles
nav_order: 5
---

## expanding and roles
`@` will expand for `system` `user` `tool_result` and `comment` roles.
Tune will ignore `@` in `assistant` and `tool_call` roles.
Everything that comes from llm (`assistant` and `tool_call`) - ignores `@`
```chat
s: @system - expands
u: @user - expands
a: @assistant - does not expand
tc: @tool_call - does not expand
tr: @tool_result - expands
c: @comment - expands
```
