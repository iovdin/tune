---
title: LLMs, Tools and Processors
parent: Text Editor
layout: home
permalink: /text-editor/extend
nav_order: 4
---
## LLMs, Tools and Processors

Put [LLM configuration](/template-language/connect-llm) into a `.llm.js`.

[Tools](/template-language/tools) reside in a `.tool.js`, `.schema.json` files.

[Processors](/template-language/processors) should be put into `.proc.js`.

### Javascript/Python/PHP

It is possible to create `llm`, `tool`, `proc` using javascript python and php.
Lets make a tool weather.

### weather.tool.mjs
```javascript
export default async weather({location}, context) {
  // ... code
}
```

### weather.tool.js/cjs
```javascript
module.exports = async function weather({location}, context) {
  // ... code
}
```

### weather.tool.py
```python
def main(params):
    params['location']
    # ... code
```

### weather.tool.php
```php
<?php
function main($params) {
    // ... code
}
?>
```
Python and PHP does not have acess to context.



