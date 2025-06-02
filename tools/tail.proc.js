module.exports = async function tail(node, args, context) {
  if (!node || (node.type !== 'text' && node.type !== 'llm')) {
    return node;
  }

  const n = parseInt(args, 10);
  const count = (isNaN(n) || n <= 0) ? 20 : n;


  if (node.type === 'text') {
    return {
      ...node,
      read: async () => {
        const text = await node.read();
        return text.split(/\r?\n/).slice(-count -1).join('\n');
      }
    }
  }

  // llm 
  return {
    ...node,
    exec: async (payload, ctx) => {
      const messages = payload.messages.filter(
        (message, index, messages) => 
          (message.role === "system") || (index >= messages.length - count ))
    
      return node.exec({
        ...payload,
        messages
      }, ctx)
    }
  }
};
