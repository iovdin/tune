import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
const client = new Client({
  name: "Tune",
  version: "1.0.0"
})
*/

async function makeEnv(ctx) {
  const TUNE_PATH = await ctx.read('TUNE_PATH');
  if (!TUNE_PATH) {
    throw Error('TUNE_PATH not set')

  }

  return ctx.stack
    .filter(item => item.dirname)
    .map(item => item.dirname)
    .reverse()
    .concat(TUNE_PATH.split(path.delimiter))
    .reduce((env, dir, index, arr) => {
      if (arr.indexOf(dir)  < index) {
        return env
      }

      const envFile = path.join(dir, ".env")

      if (!fs.existsSync(envFile)) {
        return env
      }
      fs.readFileSync(envFile, 'utf8')
        .split('\n')
      .forEach(line => {
          const m = line.match(/^\s*(\w+)\s*=\s*["']?(.*?)\s*["']?$/)
          if (!m) return
          env[m[1]] = m[2]
        })
      return env

    }, process.env)
}

async function getMcpClient(args, env) {
  const client = {}
  const [command, ...rest] = args.trim().split(/\s+/);
  const process = spawn(command, rest, { env })
  let chunks = []
  const nodes = []
  const callbacks = {}
  function onError(err ) {
    console.log("onError", err)
    if (client.onError) {
      client.onError(err)
    }
    Object.keys(callbacks).forEach(mid=> {
      callbacks[mid].reject(err)
    })
  }
  process.stdout.on('data', (data) => {
    try {
      chunks.push(data)
      let buf = Buffer.concat(chunks)
      let index
      while ((index = buf.indexOf('\n')) !== -1) {
        const line = buf.toString("utf8", 0, index);
        buf = buf.subarray(index + 1);
        const msg = JSON.parse(line)
        if (msg.id && callbacks[msg.id]) {
          const { resolve, reject} = callbacks[msg.id]
          if (msg.result) { 
            resolve(msg.result) 
          }
          if (msg.error) { 
            reject(msg.error)
          }
          delete callbacks[msg.id]
        }
      }
      chunks = [buf]
    } catch (e) {
      onError(e)
      process.kill()
    }
  });

  let msgId = 1
  client.request = async (params) =>  
    new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        ...params,
        jsonrpc: "2.0",
        id: msgId,
      })
      process.stdin.write(`${payload}\n`)
      callbacks[msgId] = {resolve, reject} 
      msgId++
    })

  const errChunks = []
  process.stderr.on('data', (data) => {
    errChunks.push(data)
    console.log(data.toString('utf8'))
  });
  process.on('error', onError);
  process.on('close', (code) => {
    client.err = Buffer.concat(errChunks).toString('utf8')
    client.data = Buffer.concat(chunks).toString('utf8')
    if (code !== 0) {
      return onError(new Error(client.err))
    }
  });
  let res = await client.request({
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      clientInfo: { name: "Tune", version: "1.0.0"}
    }
  })
  client.server = res

  client.close = () => process.kill()
  return client
}

export default async function mcp(node, args, ctx) {
  const env = await makeEnv(ctx)
  const client = await getMcpClient(args, env)
  if (! client.server.capabilities.tools) {
    throw Error(`${args} does not support tools`)
  }
  //client.onError()

  let res = await client.request({ method: "tools/list"})
  //const name = args.trim().toLowerCase().replace(/\W+/g, "_")
  //fs.writeFileSync(path.join(__dirname, `${name}-mcp.json` ), JSON.stringify(res.tools, null, "  "))
  return res.tools.map(item => ({
    type: "tool",
    name: item.name,
    schema: { 
      name: item.name,
      description: item.description,
      parameters: item.inputSchema
    },
    exec: async (args) => { 
      let res = await client.request({method: "tools/call", params: {
        name: item.name, 
        arguments: args 
      }}) 
      res = res.toolResult || res
      const content = res.content
        .map(item => {
          if (item.type == "text") {
            return item.text.replaceAll("@", "\\@")
          }
          // not supported yet
          return ""
        })
      .join("\n")

      if (res.isError) {
        throw Error(`error calling ${item.name}\n${content}`)
      }
      return content
    }
  }))
}
