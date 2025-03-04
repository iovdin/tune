import fs from 'fs';
import {  msg2text } from './tune.mjs';

export default async function turn(node, args, context) {
  // node is a llm which exec function we're going to change
  // roles contains prompts of every role
  const [user, system] = await Promise.all(args.trim().split(/\s+/).map(item=> context.read(item)))

  const newNode = Object.assign({}, node);
  newNode.exec = async ({ messages, tools }, context) => {
    const msgCount = messages.filter(item => item.role === "assistant" && !item.tool_calls).length
    if (msgCount % 2 == 0) { 
      // user
      // for user or replay prompt all the messages should stay in role assistant
      // b

    } else { // assistant

    }
    let nextRole = "user"
    // here all user and assistant messages comes as assisstant
    // lets 
    messages = messages.map(item => {
      if (item.role !== "assistant") {
        return item
      }
      if (nextRole === "user") {
        item.role = "user"
        nextRole = "assistant"
      } else {
        nextRole = "user"
      }
      return item
    })
    if (nextRole === "assistant") {
      messages[0].content = system 
    } else {
      messages[0].content = replay
    }
    fs.writeFileSync("log.json", JSON.stringify(messages, null, "  "))


    //const index = messages.filter(msg => msg.role === "assistant").length % roles.length
    // messages.splice(1, 0, { role: "system", content: roles[index]})

    return node.exec({ messages, tools }, context)
  }
  return newNode;
}
