export default async function turn(node, args, context) {
  // node is a llm which exec function we're going to change
  // roles contains prompts of every role
  const roles = await Promise.all(args.trim().split(/\s+/).map(role => context.read(role)))

  const newNode = Object.assign({}, node);
  newNode.exec = async ({ messages, tools }, context) => {
    const index = messages.filter(msg => msg.role === "assistant").length % roles.length
    //inject the roles
    messages.splice(1, 0, { role: "system", content: roles[index]})

    return node.exec({ messages, tools }, context)
  }
  return newNode;
}
