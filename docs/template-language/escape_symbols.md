---
title: Escape and Special chars
parent: Template Language
layout: home
permalink: /template-language/special-chars
nav_order: 4
---

## Escape and special chars
To include a file that contains whitespaces  use `{}`
```chat
user: 
@file name
@{file name}
```

Escape `\@` to stop inclusion
```chat
user:
email\@gmail.com
```
