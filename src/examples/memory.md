---
title: Memory 
parent: Examples
layout: home
permalink: /examples/memory
nav_order: 2.1
---
## Memory
Put smth into memory while chatting is a common need.
Examples of memory is artifacts in Claude or canvas in ChatGPT.

Memory is a file we can read the file using `@` and write to the file using a `writefile` tool.
```chat
s: @writefile @sonnet
You help to make markdown static website for a user.
Ask about missing information first.

Save the page to `website.md` file.
Actual content of `website.md` file:
@website|init

u: i want to make a page about me.
a: I'd be happy to help you create a personal webpage about yourself. To create an effective "about me" page, I'll need some information from you:

1. What's your name or what you'd like to be called on the page?
2. Would you like to include any professional information (job, education, skills)?
3. Any personal interests or hobbies you want to mention?
4. Do you have a photo you want to include?
5. Any specific color scheme or style preferences?
6. Would you like to include contact information or social media links?

Once you provide these details, I can create a custom HTML page for your website.
u: John, I work as software engineer  
a: Thank you for that information, John! Based on what you've shared, I'll create a basic "About Me" page for you as a software engineer.

Let me create a markdown file for your website:
tc: writefile {"filename":"website.md"}
# John - Software Engineer

## About Me
Hello! I'm John, a software engineer passionate about creating efficient and innovative solutions through code.

## Professional Background
I work as a software engineer where I leverage my technical skills to develop high-quality software applications.

## Skills
As a software engineer, I specialize in:
- Software development
- Problem-solving
- Technical implementation

---

© 2023 John | Software Engineer
tr: written
u: I also love cooking
a: I'll update your website to include your interest in cooking. Let me add that information to your page:
tc: writefile {"filename":"website.md"}
# John - Software Engineer

## About Me
Hello! I'm John, a software engineer passionate about creating efficient and innovative solutions through code.

## Professional Background
I work as a software engineer where I leverage my technical skills to develop high-quality software applications.

## Skills
As a software engineer, I specialize in:
- Software development
- Problem-solving
- Technical implementation

## Interests & Hobbies
When I'm not coding, I enjoy:
- Cooking - experimenting with new recipes and cuisines
- [You can add more hobbies/interests here]

---

© 2023 John | Software Engineer
```

here is the `writefile.tool.mjs`:
```javascript
import { promises as fs } from 'fs';

export default async function writeFile({ filename, text }, ctx) {
  await fs.writeFile(filename, text, 'utf8');
  return `written`;
}
```

schema file `writefile.schema.json`:
```json
 {
  "description": "write text content to a file",
  "parameters": {
    "type": "object",
    "properties": {
      "filename": {
        "type": "string",
        "description": "The name of the file to write"
      },
      "text": {
        "type": "string",
        "description": "The content to write to the file"
      }
    },
    "required": ["filename", "text"]
  }
}
```
