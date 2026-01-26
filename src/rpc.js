// Refactored JSON-RPC over newline-delimited JSON using Web Streams.
//
// Supports:
// - request/response calls: await rpc.method(params)
// - streamed responses: for await (const chunk of rpc.method(params, true)) { ... }
//
// Wire format (compatible with existing dist/rpc.js):
// - Each message is a single JSON object followed by "\n".
// - Requests: { jsonrpc:"2.0", id, method, params, stream }
// - Responses: { jsonrpc:"2.0", id, result, done? }
// - Errors: { jsonrpc:"2.0", id, error:{message, stack} }
//
// NOTE: For streamed responses we send chunks with done:false (or omitted),
// and then a final message {id, done:true} with result omitted (per your comment).

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// todo what if it is a string (utf8) encoded stream
function concatU8A(...u8arrays) {
  u8arrays = u8arrays.filter(item => item)
  const totalLen = u8arrays.reduce((acc, arr) => acc + arr.length, 0);
  const res = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of u8arrays) {
    res.set(arr, offset);
    offset += arr.length;
  }
  return res;
}

class StreamController {
  constructor(onClose) {
    this.queue = [];
    this.waiter = null; // {resolve, reject}
    this.closed = false;
    this.err = null;
    this.onClose = onClose;
  }

  push(value, done = false) {
    if (this.closed) return;
    let items = []
    if (value) {
      items.push({ value })
    }
    if (done) {
      items.push({ done })
    }
    if (this.waiter) {
      const { resolve } = this.waiter;
      this.waiter = null;
      resolve(items.shift());
    } 
    this.queue.push(...items);
    if (done) this.close();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    if (this.waiter) {
      const { resolve } = this.waiter;
      this.waiter = null;
      resolve({ value: undefined, done: true });
    }
    if (this.onClose) this.onClose();
  }

  fail(err) {
    if (this.closed) return;
    this.err = err;
    this.closed = true;
    if (this.waiter) {
      const { reject } = this.waiter;
      this.waiter = null;
      reject(err);
    }
    if (this.onClose) this.onClose();
  }

  async next() {
    if (this.err) throw this.err;
    if (this.queue.length) return this.queue.shift();
    if (this.closed) return { value: undefined, done: true };

    return await new Promise((resolve, reject) => {
      this.waiter = { resolve, reject };
    });
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

function jsonrpc(params, exports) {
  const client = new JSONRPC(params, exports);
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return
        }
        return (p, stream) => client._call(prop, p, stream);
      },
      set(_obj, prop, value) {
        client[prop] = value;
        return true;
      },
    },
  );
}

function JSONRPC(params, exports) {
  assert(params && params.inStream, "inStream has to be defined and be a ReadableStream");
  assert(params && params.outStream, "outStream has to be defined and be a WritableStream");

  // this.msgId = 0;
  this.name = params.name;
  this.exports = exports || params.exports || {};
  this.callbacks = Object.create(null); // id -> {resolve,reject}
  this.iterators = Object.create(null); // id -> StreamController
  this.buf = null;

  // debug
  if (!params.debug) {
    this.debug = () => {};
  } else if (typeof params.debug === "boolean") {
    this.debug = (...args) => console.error(...args);
  } else if (typeof params.debug === "function") {
    this.debug = params.debug;
  } else {
    this.debug = () => {};
  }

  this.reader = params.inStream.getReader();
  this.writer = params.outStream.getWriter();

  this._pump();
  return this;
}

JSONRPC.prototype._write = async function (payload) {
  const encoder = new TextEncoder();
  const line = JSON.stringify(payload);
  this.debug(this.name, "==>", line);
  const data = encoder.encode(line + "\n");
  await this.writer.write(data);
};

JSONRPC.prototype._error = function (msgId, message, stack) {
  return this._write({
    jsonrpc: "2.0",
    id: msgId,
    error: { message, stack },
  });
};

JSONRPC.prototype._result = function (msgId, result, done) {
  const payload = {
    jsonrpc: "2.0",
    id: msgId,
  };
  if (typeof result !== "undefined") payload.result = result;
  if (done) payload.done = true;
  return this._write(payload);
};

JSONRPC.prototype._call = async function (method, params, stream) {
  // const msgId = ++this.msgId;
  const msgId = Math.random().toString(36).slice(2)

  this._write({
    jsonrpc: "2.0",
    id: msgId,
    method,
    params,
    stream,
  });

  if (!stream) {
    return await new Promise((resolve, reject) => {
      this.callbacks[msgId] = { resolve, reject };
    });
  }

  const ctrl = new StreamController(() => {
    delete this.iterators[msgId];
  });
  this.iterators[msgId] = ctrl;
  return ctrl;
};

JSONRPC.prototype._handleResponse = function (msg) {
  const cb = this.callbacks[msg.id];
  const iter = this.iterators[msg.id];

  // error
  if (msg && msg.error) {
    const err = new Error(msg.error.message);
    err.stack = msg.error.stack;

    if (cb) {
      delete this.callbacks[msg.id];
      cb.reject(err);
      return;
    }
    if (iter) {
      iter.fail(err);
      return;
    }
    return;
  }

  // result (including streamed)
  if (Object.prototype.hasOwnProperty.call(msg, "result") || msg.done) {
    if (cb) {
      delete this.callbacks[msg.id];
      cb.resolve(msg.result);
      return;
    }
    if (iter) {
      // streamed protocol: chunks come as {result}, final is {done:true} with result omitted
      if (msg.done && !Object.prototype.hasOwnProperty.call(msg, "result")) {
        iter.close();
      } else {
        iter.push(msg.result, !!msg.done);
      }
      return;
    }
  }
};

JSONRPC.prototype._handleRequest = async function (msg) {
  const fn = this.exports && this.exports[msg.method];
  if (!fn) {
    await this._error(msg.id, `method not found: ${msg.method}`);
    return;
  }

  try {
    const r = await fn(msg.params, msg.stream);

    if (r && typeof r[Symbol.asyncIterator] === "function") {
      try {
        for await (const item of r) {
          await this._result(msg.id, item, false);
        }
        // final done (result omitted)
        await this._result(msg.id, undefined, true);
      } catch (e) {
        await this._error(msg.id, e.message, e.stack);
      }
      return;
    }

    await this._result(msg.id, r, true);
  } catch (e) {
    await this._error(msg.id, e.message, e.stack);
  }
};

JSONRPC.prototype._pump = async function () {
  while (true) {
    const { value, done } = await this.reader.read();
    if (done) return;

    this.buf = concatU8A(this.buf, value);

    let newlineIdx;
    while ((newlineIdx = this.buf.indexOf(10)) !== -1) {
      const lineBytes = this.buf.slice(0, newlineIdx);
      this.buf = this.buf.slice(newlineIdx + 1);

      const line = new TextDecoder().decode(lineBytes);
      if (!line) continue;

      this.debug(this.name, "<==", line);

      let msg;
      try {
        msg = JSON.parse(line);
      } catch (e) {
        this.debug(this.name, "cant parse json:", line);
        continue;
      }

      if (!msg || !msg.id) continue;

      if (msg.id) {
        // this.debug(this.name, "new message id", Math.max(this.msgId, msg.id))
        // this.msgId = Math.max(this.msgId, msg.id)
      }
      // response to our outbound call
      // this.debug(this.name, "msg", msg)
      if (this.callbacks[msg.id] || this.iterators[msg.id]) {
        this._handleResponse(msg);
        continue;
      }

      // inbound request
      if (msg.method) {
        // fire and forget per line; order is preserved because we await inside
        this._handleRequest(msg);
      }
    }
  }
};

exports.jsonrpc = jsonrpc;
