import path from 'path';

export default async function json_format(node, args, ctx) {
  if (!node) {
    return 
  }
  let response_format = { "type": "json_object" }
  if (args.trim()) {

    let schema = await ctx.resolve(args.trim());
    if (!schema) throw Error(`schema file not found ${args.trim()}`)
    schema = await schema.read();
    response_format = { 
      "type": "json_schema", 
      "json_schema": JSON.parse(schema),
    }
  }
  return {
    ...node,
    exec: async (payload, ctx) => node.exec({ ...payload, response_format }, ctx)
  }
}
