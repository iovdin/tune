## Tools & Processors & Contexts
This is a personal directory of [tools](https://iovdin.github.io/tune/template-language/tools) [processors](https://iovdin.github.io/tune/template-language/tools) and [contexts](https://iovdin.github.io/tune/template-language/context) and prompts.

They're supposed to be forked/cloned, and changed.
Set `TUNE_PATH` to the directory to make them available in tune editor extensions

##### Table of Contents  
- [Prompts](#prompts)  
- [LLMs](#llms)
- [Tools](#tools)
  - [rf](#rf) read file
  - [wf](#wf) write file
  - [patch](#patch) patch file
  - [append](#append) append to file
  - [sh](#sh) execute shell command
  - [jina_r](#jina_r) read webpage content
  - [brave](#brave) web search  
  - [openai_tts](#openai_tts) text to speech from openai
  - [gemini_tts](#gemini_tts) text to speech from gemini with single/multi-speaker support
  - [openai_imgen](#openai_imgen) generate and edit images with openai gpt-image model
  - [gemini_ocr](#gemini_ocr) ask question about file content (PDF/audio/image)
  - [turn](#turn) turn based agent
  - [list](#list) keep list of tasks todo (loops for llm)
  - [py](#py) run python code
  - [js](#js) run javascript code
  - [message](#message) talk to another chat/agent
- [Processors](#processors)
  - [shp](#shp) include shell command output
  - [init](#init) set initial value
  - [mcp](#mcp) connect mcp tools
  - [json_format](#json_format) make llm respond with json
  - [log](#log) save llm payload
  - [mock](#mock) set variables inline
  - [linenum](#linenum) prepend line numbers
  - [text](#text) convert any node to text node
  - [resolve](#resolve) resolve a variable
  - [prop](#prop) set additional properties of llm
  - [head](#head) take first N lines of a file
  - [tail](#tail) take last N lines of a file or llm payload
  - [slice](#slice) take lines from <start> to <finish> of a file


## Prompts
* `short.txt` - for short answers
* `echo.txt` - to debug variable expansions and context
* `dev.txt` - developer copilot prompt with claude 3.7
* `gemini-dev.txt` - developer copilot use gemini-2.5-pro with
* `clipboard.txt` - @@clipboard - insert content of clipboard (mac osx)

## LLMs
Contexts: `openai.ctx.js`, `anthropic.ctx.js` `openrouter.ctx.js`, `mistral.ctx.js`, `groq.ctx.js`, `gemini.ctx.js`.
Put together in `default.ctx.js`.

Download model list from the provider (saved in .cache directory), and then can be used by name in the `.chat` files.
```chat
system:
@gpt-4o - uses openai.ctx.js
@anthropic/claude-3.7-sonnet - uses openrouter.ctx.js
@mistral-small-latest - get model using mistral.ctx.js
@qwen-qwq-32b - uses groq.ctx.js
@gemini-2.0-flash will use gemini.ctx.js
@claude-3-7-sonnet-20250219 will use antrophic.ctx.js
```
To connect a model there has to be OPENAI_KEY or OPENROUTER_KEY or MISTRAL_KEY or GROQ_KEY or GEMINI_KEY in the environment or in `.env` file


`default.llm.js` - which model is called by default (i.e. without connecting @llm)

## Tools
[Tools](https://iovdin.github.io/tune/template-language/tools) is a function that llm can run on your local machine or server

### `rf`
Read file
```chat
user: @rf
can you read README.md?
tool_call: rf {"filename":"README.md"}
tool_result: 
@README.md
```
It takes optional `linenum` parameter so that file is included with line numbers - useful for patching

### `wf`
Write to a file
```chat
user: @wf 
make a hello world javascript
tool_call: wf {"filename":"helloWorld.js"}
console.log('Hello, World!');
tool_result:
written
```

### `patch`
```chat
user: @patch
translate "hello world" in helloWorld.js  to dutch
tool_call: patch {"filename":"helloWorld.js"}
<<<<<<< ORIGINAL
console.log('Hello, World!');
=======
console.log('Hallo, Wereld!');
>>>>>>> UPDATED
tool_result:
patched
```


### `append`
```chat
user: @append
Add a todo that i want to buy a car and go to the moon
tool_call: append {"filename":"todo.md"}
- buy a car 
- fly to the moon
tool_result:
appended
```

### `sh`
Execute shell command
```chat
user: @sh
find with ripgrep where echo is used
tool_call: sh
rg 'echo' ./
tool_result: 
./README.md:    echo: "You are echo, you print everything back",
./README.md:  const text = "s: \@echo\nu: hello world";
./tools/echo.txt:you are echo, you print everything back
./tools/README.md:* `echo.txt` - to debug variable expansions and context
```

### `jina_r`
Fetch webpage content with [jina reader](https://jina.ai/reader) api.
It works without a key to some limit. Put `JINA_KEY` into `.env` for higher rate limits

```chat
user: @jina_r
take https://iovdin.github.io/tune/ page content
and put it into `home` directory
then make short summary

tool_call: jina_r {"url":"https://iovdin.github.io/tune/","filename":"home/tune_page_content.md"}

tool_result: 
@home/tune_page_content.md

assistant:
The content from the "Tune" page has been successfully retrieved and saved into the `home/tune_page_content.md` file. Below is a short summary of the page:

---

**Summary of Tune - Your Everyday LLM Toolkit:**

Tune is a versatile toolkit designed for developers and users to effectively interact with Large Language Models (LLMs). It allows users to chat with AI, build applications, and create AI agents in a simple manner. 
<cut for brevity>
```

### `brave` 
Use [brave web search api](https://brave.com/search/api/). It requires `BRAVE_KEY` in your `.env`

```chat
system: 
@brave
today is @{| shp date }

user: 
what are the latest trumps tariffs?

tool_call: brave
latest Trump tariffs 2025

tool_result: 
Trump tariffs fallout: China retaliates, Vietnam talks, U.S. markets melt down
https://www.cnbc.com/2025/04/04/trump-tariff-live-updates-retaliation-trade-war.html
U.S. President Donald <strong>Trump</strong> pumps ... April 3, <strong>2025</strong>. Miami Herald | Tribune News Service | Getty Images · <strong>Trump</strong> touted a better-than-expected March jobs report as proof of the strength of his agenda. &quot;GREAT JOB NUMBERS, FAR BETTER THAN EXPECTED. IT&#x27;S ALREADY WORKING. HANG TOUGH, WE CAN&#x27;T LOSE!!!&quot; he wrote on Truth Social. The <strong>latest</strong> nonfarm payrolls report from the Bureau of Labor Statistics covers the month ending mid-March — before <strong>Trump</strong>&#x27;<strong>s</strong> <strong>latest</strong> <strong>tariff</strong> ...

Trump Tariffs: The Economic Impact of the Trump Trade War
https://taxfoundation.org/research/all/federal/trump-tariffs-trade-war/
As of April 4, China, Canada, and ... April 4 will reduce US GDP by another 0.1 percent. In 2025, the Trump tariffs will <strong>increase federal tax revenues by $258.4 billion, or 0.85 percent of GDP</strong>, making the tariffs the largest tax hike since 1982....

Trump tariffs: Visualising new US trade restrictions | World Economic Forum
https://www.weforum.org/stories/2025/02/trump-tariffs-visualising-new-us-trade-restrictions/
For a better visual understanding ... On 2 April, the Trump administration unveiled a new tariff regime that applies a <strong>baseline additional tariff of 10% on US imports from all countries</strong>....
<cut for brevity>
```

### `openai_tts`
use openai [speech generation api](https://platform.openai.com/docs/guides/text-to-speech)

```chat
user: @openai_tts
Read out in the style of Arnold Schwarzenegger:  
Hasta la vista, baby!

tool_call: openai_tts {"voice":"fable","filename":"hasta_la_vista_baby.mp3","instructions":"Voice: Deep, powerful, and energetic, with a strong Austrian accent that is unmistakable.  Punctuation: Pronounced with emphatic pauses for dramatic effect.  Delivery: Confident and assertive, with a clear and impactful enunciation.  Phrasing: Bold and straightforward, using a commanding tone that captures attention.  Tone: Iconic and motivating, embodying a legendary action hero."}
Hasta la vista, baby!

tool_result: 
speech generated
```

### `gemini_tts`
Use Gemini's [text-to-speech API](https://ai.google.dev/gemini-api/docs/speech-generation) with support for both single-speaker and multi-speaker audio generation.

**Single-speaker example:**
```chat
user: @gemini_tts
Say in a cheerful voice: "Welcome to our podcast!"

tool_call: gemini_tts {"voice":"Puck","filename":"welcome.wav"}
Say cheerfully: Welcome to our podcast!
tool_result: 
Speech generated successfully and saved to welcome.wav
```

**Multi-speaker dialogue example:**
```chat
user: @gemini_tts
Create a conversation between Alice and Bob discussing AI

tool_call: gemini_tts {"speakers":[{"name":"Alice","voice":"Aoede"},{"name":"Bob","voice":"Charon"}],"filename":"ai_discussion.wav"}
TTS the following conversation between Alice and Bob: Alice: What do you think about artificial intelligence? Bob: I think it's fascinating! It's changing how we work and live. Alice: I agree, but we need to be careful about the implications.
tool_result: 
Speech generated successfully and saved to ai_discussion.wav
```

**Styled speech example:**
```chat
user: @gemini_tts
Make it sound spooky and mysterious

tool_call: gemini_tts {"voice":"Enceladus","filename":"spooky.wav"}
Say in a spooky whisper: Something wicked this way comes...
tool_result: 
Speech generated successfully and saved to spooky.wav
```

### `openai_imgen`
use openai [image generation api](https://platform.openai.com/docs/guides/image-generation)

```chat
user: @openai_imgen
draw a stickman with talking bubble "Hello world"

assistant: 
tool_call: openai_imgen {"filename":"stickman_hello_world.png"}
a simple stickman drawing with a talking bubble saying 'Hello world'

tool_result: 
image generated

```


### `gemini_ocr`
Use gemini model to query all supported files (pdf/images/audio) [gemini api docs](https://ai.google.dev/gemini-api/docs/)

```chat
user: @gemini_ocr
can you transcribe hasta_la_vista_baby.mp3? 

tool_call: gemini_ocr {"filename":"hasta_la_vista_baby.mp3"}
Transcribe audio

tool_result: 
Hasta la vista, baby.
```

### `turn`
A way to switch roles when building multistep agents [read more](https://iovdin.github.io/tune/examples/multi-agent) 
```chat
system: @turn @gpt-4o
You're playing 20 questions game.
You switch turns between 'thinker' and 'player' agent. 
Current agent stored in agent.txt file
'player' always plays first

@@agent|init
assistant: 
Is it a living thing?

tool_call: turn {"role":"thinker","filename":"agent.txt"}
tool_result: now it is turn of thinker to reply

assistant: 
No.

tool_call: turn {"role":"player","filename":"agent.txt"}
tool_result: now it is turn of player to reply

assistant: 
Is it something that can be used indoors?

tool_call: turn {"role":"thinker","filename":"agent.txt"}
tool_result: now it is turn of thinker to reply

assistant: 
Yes.

...
```

### `list`
Keep list of tasks to do

```chat
system: @list
You manage todo list in file todo.txt

user: 
Today i need to refactor xyz
and then release abc

assistant:

tool_call: list {"filename":"todo.txt"}
todo - refactor xyz
todo - release abc

tool_result:
list updated

user: 
ok, i've finished refactoring xyz

assistant:

tool_call: list {"filename":"todo.txt"}
done - refactor xyz

tool_result:
list updated
```


### `py`
execute python code
```chat
user: @py
1234 + 4311

tool_call: py
1234 + 4311

tool_result:
5545
```

### `js`
execut javascript code
```chat
user: @js
1234 + 4311

tool_call: js {"inputType":"commonjs"}
1234 + 4311

tool_result:
5545

```

### `message`
Talk to another chat/agent via tool call. 
Orchestrate or evaulate other agents/chats.
```chat
system: 
@message
Your goal is to talk to Groot at `groot.prompt` system prompt
and try to make him say anything but 'I am Groot' 

tool_call: message {"filename":"groot.chat","system":"groot.prompt"}
Hello Groot! How are you feeling today?

tool_result: 
I am Groot!

tool_call: message {"filename":"groot.chat","system":"groot.prompt"}
What do you think about trees?

tool_result: 
I am Groot!

tool_call: message {"filename":"groot.chat","system":"groot.prompt"}
Can you tell me a joke?

tool_result: 
Sure! Why did the tree go to the dentist?  

Because it had a root canal!
```

The content of `groot.chat` is then:
```chat
system: @@groot.prompt
user:
Hello Groot! How are you feeling today?

assistant:
I am Groot!

user:
What do you think about trees?

assistant:
I am Groot!

user:
Can you tell me a joke?

assistant:
Sure! Why did the tree go to the dentist?  

Because it had a root canal!
```


## Processors
[Processors](https://iovdin.github.io/tune/template-language/processors) is a way to modify variable or insert new ones into chat.

### `shp`
Insert shell command output
```chat
system:
include project file list to system prompt
@{| shp git ls-files }

include buffer content on osx
@{| shp pbpaste }

include current date
@{| shp date }

pipe filename content to shell command
@{ a.log | shp tail }

@{ a.log | shp grep pattern }
```

### `init` 
Set default value for non set variables

```chat
system:
@memory|init 
if memory does not exist the chat will fail
```

### `mcp` 
Connect Model Context Protocol tools
```chat
system: 
@{| mcp npx -y @modelcontextprotocol/server-filesystem ./ }
user: 
what is in my current directory?
tool_call: list_allowed_directories
tool_result: 
Allowed directories:
/Users/username/projects/tune
```
### `json_format`
Set llm response format to json [read more](https://platform.openai.com/docs/guides/structured-outputs?api-mode=chat).

Without arguments it sets
```json
"response_format": {
  "type": "json_object"
}
```

```chat
system: 
@{ gpt-4o | json_format }
please reply in json format:
{ "message": "Your reply"}

user: 
hi how are you?

assistant:
{ "message": "I'm just a virtual assistant, so I don't have feelings, but I'm here and ready to help you! How can I assist you today?" }

```

with argument it sets 
```json
"response_format": { 
    "type": "json_schema", 
    "json_schema": { "schema": <contents of the file argument> }
} 
```

```chat
system: 
@{ gpt-4o | json_format path/to/schema.json }
```

### `log` 
Save LLM payload to a json file, used for debugging
```chat
system: @{ gpt-4o | log path/to/log.json }
```

### `mock` 
Set variables inline in chat. 
```
system: @{| mock hello=world }
@echo
user: 
@hello
assistant:
world
```

### `linenum`
Prepend line numbers to a file content. 
Useful when patching file.
```chat
system:
@echo
user: 
@{ helloWorld | linenum }
assistant:
1 | console.log('Hello, World!');
```

### `text`
Treat special files (`.ctx.js`, `.llm.js`, `.tool.js`)  like text
```chat
system: 
@echo

user: 
content 
@rf.tool.mjs

assistant: 
content

user: 
content
@{ rf.tool.mjs | text}

assistant: 
content
import { promises as fs } from 'fs';
import { relative, dirname } from 'path' 
....
```

### `resolve`
Given filename resolve it and include

```chat
@{ filename | resolve }
```

see `examples/queryimage` example

### `prop`
set additional propertis for llm

```chat
system: 
@{ o3-mini | prop reasoning_effort=low temperature=2.0 }
or
@{ gpt-4o-search-preview | prop web_search_options={\} }
```

### `head`
Take first *N* lines of text from a file or variable. Default is 20 lines.

```chat
user: 
@{ filename.txt | head 10 }    # first 10 lines
```

### `tail`
Take last *N* lines of text from a file or variable. Default is 20 lines.

```chat
user: 
@{ filename.txt | tail 15 }    # last 15 lines
```

You can limit llm request context with tail like
```chat
system: 
@{ gpt-4.1 | tail 2 }  # take last 2 messages from the chat + system message

user: 
1

assistant: 
2

user: 
3

assistant: 
4
```


### `slice`
Extract a range of lines from a file or variable.

```chat
user: 
@{ filename.txt | slice 5 15 }      # lines 5 to 15 inclusive
@{ filename.txt | slice 10 }        # from line 10 to end
@{ filename.txt | slice -10 -1 }    # last 10 lines
@{ filename.txt | slice -20 }       # last 20 lines
@{ filename.txt | slice 1 20 }      # first 20 lines (like head 20)
```
