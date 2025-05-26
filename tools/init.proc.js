module.exports = async function init(node, args, ctx) {
  if (node) {
    return node;
  }
  const content = (args || "").trim();
  
  // include file
  if (content.indexOf("@") === 0) {
    return {
      type: "text", 
      read: async () => this.read(content.replace(/^@{1,2}/, "")) 
    }
  }
  
  return {
    type: "text", 
    read: async () => content 
  }
} 
