const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');
const mime = require('mime-types');

// skips loopback, docker (172.x, 192.168.x docker ranges), and common vpn (tun/tap) interfaces
function getPublicIPv4() {
  const ifaces = os.networkInterfaces();
  const skipNames = /^(docker|br-|veth|tun|tap|vmnet|vbox)/i;
  const skipRanges = /^(172\.(1[6-9]|2\d|3[01])\.|10\.)/; // docker bridge ranges

  for (const [name, addrs] of Object.entries(ifaces)) {
    if (skipNames.test(name)) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal && !skipRanges.test(addr.address)) {
        return addr.address;
      }
    }
  }
  return 'localhost';
}

function makeServer({ port, static, root, ctx }, middleware) {
  root = path.join(root || process.cwd());

  function sendFile(filePath, res){ 
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }
      res.writeHead(200, {
        'Content-Type': mime.lookup(filePath) || 'application/octet-stream',
      });
      res.end(data);
    });
  }
  const server = http.createServer((req, res) => {
    console.log(`[${req.method.toUpperCase()}] ${req.url}`)
    if (req.method.toUpperCase() !== "GET") { 
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end("ok");
    }
    if (req.url === "/contextws.js") {
      return sendFile(path.join(__dirname,  "contextws.js"), res)
    }
    if (!static) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end("ok");
    }

    // If middleware is provided and handles the request, stop here.
    if (middleware) {
      var handled = middleware(req, res, root, sendFile);
      if (handled) return;
    }

    let filePath = req.url === '/' ? '/index.html' : req.url;
    // TODO: check if resolved path is not out of root 
    filePath = path.join(root, filePath);
    sendFile(filePath, res)
  });

  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', async (msg) => {
      let lctx = ctx.clone()
      let { id, method, args, ...rest } = JSON.parse(msg.toString());
      let result = { id }
      console.log("[context]", method, ...args)
      if (method === "read") {
        const [ name, binary ] = args
        let content = await lctx.read(name, binary)
        if (binary) {
          content = content.toString("base64");
        }
        result = { id, result: content, binary, done: true }
      } else if (method === "write") {
        let [ name, content ] = args;
        const { binary } = rest
        if (binary) {
          content = Buffer.from(content, "base64")
        }
        await lctx.write(name, content)
        result.done = true
      } else if (method === "exec") {
        const [name, params] = args; 
        const node  = await lctx.resolve(name)
        if (!node) {
          result.error = { message: `${name} not found` }
        } else if (!node.exec) {
          result.error = { message: `${name} not executable` }
        } else {
          const content = await ctx.exec(name, params)
          result.result = content
          result.done = true
        }
      } else if (method === "resolve") {
        const [name, params] = args; 
        const content = await lctx.resolve(name, params)
        result.result = content
        result.done = true
      } else if (method === "file2run") {
        const [ payload, params ]  = args

        const r = await lctx.file2run({ ...payload, errors: "message" }, params);
        if (!payload?.stream) {
          result.result = r
          result.done = true
        } else {
          (async () => {
            try {
              let chunk = {};
              let lastRes
              while(!chunk.done) {
                chunk = await r.next();
                result.result = (chunk.value || "");
                ws.send(JSON.stringify(result));
              }
              result.done = true
              ws.send(JSON.stringify(result));
            } catch (e) {
              delete result.result
              result.error = {message: e.message, stack: e.stack}
              ws.send(JSON.stringify(result));
            }
          })()
        }
      } else if (method === "log") {
        console.log("[browser]:", ...args)
        result.done = true
      } else {
        result.error = { message: `method not found ${method}`}
      }
      ws.send(JSON.stringify(result));
    });
  });

  server.listen(port, () => {
    if (Number.isNaN(parseInt(port))) {
      console.log(`listening ${port}`);
    } else {
      const host = getPublicIPv4();
      console.log(`listening http://${host}:${port}`);
    }
  });
}

module.exports = makeServer
