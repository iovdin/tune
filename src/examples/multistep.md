---
title: Multi agent conversation
parent: Examples
layout: home
permalink: /examples/multi-agent
nav_order: 3
---
## Mutli Agent Conversation
Lets make a 2 agents playing "20 Questions" game conversation. Agent *thinker* answer yes/no questions. Agent *player* asks those questions to guess the word.

### Thinker prompt
`thinker.txt`
```
You are 'thinker'.
You can answer only yes/no to questions made by 'player'.
The player is trying to guess word: "apple"
```

### Player prompt
`player.txt`
```
You are 'player'.
You ask yes/no question to 'thinker'
Your goal is to guess the word 'thinker' has in mind
```

### Conversation
The chat will go on by making turns with a `turn` tool.
turn tool writes `@@thinker` or `@@player` into `agent.txt`.

```chat
s: @turn @4o
You're playing 20 questions game.
You switch turns between 'thinker' and 'player' agent. 
Current agent stored in agent.txt file
'player' always plays first

@@agent|init
a: Is it a living thing?
tc: turn {"role":"thinker","filename":"agent.txt"}
tr: now it is turn of thinker to reply
a: No.
tc: turn {"role":"player","filename":"agent.txt"}
tr: now it is turn of player to reply
a: Is it something that can be used indoors?
tc: turn {"role":"thinker","filename":"agent.txt"}
tr: now it is turn of thinker to reply
a: Yes.
tc: turn {"role":"player","filename":"agent.txt"}
tr: now it is turn of player to reply
a: Is it an electronic device?
```
`@@agent` includes content of `agent.txt` which is e.g. `@@thinker` and then includes `thinker.txt`. So the system prompt is now of a thinker prompt.
[read more]({{ site.baseurl }}/template-language/at-symbol) about using `@@` and `@` for inclusion.


### turn.tool.mjs
```javascript
import fs from "fs"; 

export default async function turn({ role, filename }) {
  if (filename) {
    fs.writeFileSync(filename, `@@${role}`);
  }
  return `now it is turn of ${role} to reply`
```


## Another Implementation
Lets make it less verbose version, get rid of `turn` tool call to swtich roles. We'll do it with [llm]({{ site.baseurl }}/template-language/connect-llm) [processor]({{ site.baseurl }}/template-language/processors).

```chat
s: @{ 4o-mini | turn-proc player thinker }
You're playing 20 questions game.
Start the answer with "(<your role>)"
a: (Player) Is it a living thing?
a: (Thinker) No.
a: (Player) Is it an object?
a: (Thinker) Yes.
a: (Player) Is it something commonly found in households?
a: (Thinker) Yes.
a: (Player) Is it used for a specific function or purpose?
a: (Thinker) Yes.
a: (Player) Is it an appliance?
a: (Thinker) No.
a: (Player) Is it a piece of furniture?
a: (Thinker) No.
a: (Player) Is it a tool?
a: (Thinker) No.
```

`turn-proc.proc.mjs`
```javascript
export default async function turn(node, args, context) {
  // node is a llm which exec function we're going to change
  // roles contains prompts of every role
  const roles = await Promise.all(args.trim().split(/\s+/).map(role => context.read(role)))

  const newNode = Object.assign({}, node);
  newNode.exec = async ({ messages, tools }, context) => {
    const index = messages.filter(msg => msg.role === "assistant").length % roles.length
    // inject the role as a system prompt
    messages.splice(1, 0, { role: "system", content: roles[index]})

    return node.exec({ messages, tools }, context)
  }
  return newNode;
}
```
