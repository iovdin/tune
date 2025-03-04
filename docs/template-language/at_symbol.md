---
title: "Use of @@ and @"
parent: Template Language
layout: home
permalink: /template-language/at-symbol
nav_order: 1 
---
## Use `@@` and `@` 
`@` - injects content of a file.
`@@` - injects it recursively.

```
memory.txt:
you're 33yo.
```

```
prompt.txt:
Here is what i know about you: 
@memory
```

```chat
s: You're echo, you print everything back
u: @prompt
a: 
Here is what i know about you: 
@memory
u: @@prompt
a: 
Here is what i know about you: 
you're 33 o
```
