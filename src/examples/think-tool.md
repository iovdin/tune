---
title: '"think" tool'
parent: Examples
layout: home
permalink: /examples/think-tool
nav_order: 1.2
---
## Another chat as a tool
Lets make a "think" tool from [anthropic blog](https://www.anthropic.com/engineering/claude-think-tool).
It preforms on par or better than "reasoning" models. And it gives cheap models ability to think.

`think.tool.chat`
```chat
system: @o3-mini
user:
@text
```

schema for think tool `think.schema.json`:
```json
{
  "description": "Use the tool to think about something. It will not obtain new information or change the database, but just append the thought to the log. Use it when complex reasoning or some cache memory is needed.",
  "parameters": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "A thought to think about."
      }
    },
    "required": ["text"]
  }
}
```

Lets now use the tool
```chat
system: @gpt-4o-mini @think
user: 
how much is 234 * 324?
tool_call: think
To calculate 234 * 324, I will perform the multiplication.
tool_result: 
Let's work through the multiplication step by step:

1. Write the numbers in column form:
    234
 × 324
________

2. Multiply 234 by 4 (the ones digit of 324):
  234 × 4 = 936  
 Write 936 below.

3. Multiply 234 by 2 (the tens digit, representing 20):
  234 × 2 = 468  
 Since this 2 is actually in the tens place, append a zero: 468 becomes 4680.
 Write 4680, aligned one place to the left.

4. Multiply 234 by 3 (the hundreds digit, representing 300):
  234 × 3 = 702  
 Since this 3 is in the hundreds place, append two zeros: 702 becomes 70200.
 Write 70200 in the next row, aligned two places to the left.

5. Add the partial products:
      936
   + 4680
  +70200
  ——————
   75816

So, 234 * 324 = 75,816.
```
