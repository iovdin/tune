module.exports = async (node, args, ctx)  => (node || {type: "text", read: async () => (args || "") }) 
