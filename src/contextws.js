// ContextWebsocket: explicit request/response wrapper over WebSocket.

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

class StreamController {
  constructor(onClose) {
    this.queue = [];
    this.waiter = null;
    this.closed = false;
    this.err = null;
    this.onClose = onClose;
  }

  push(value, done = false) {
    if (this.closed) return;
    const items = [];
    if (typeof value !== 'undefined') items.push({ value });
    if (done) items.push({ done });

    if (this.waiter && items.length) {
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

function ContextWebsocket(url, { debug } = {}) {
  assert(typeof WebSocket !== 'undefined', 'WebSocket is not available');
  assert(typeof url !== 'undefined', 'url is not set');

  socket = new WebSocket(url);
  console.log(socket)

  this.socket = socket;
  this.callbacks = Object.create(null);
  this.iterators = Object.create(null);
  this.pending = [];
  this.debug = typeof debug === 'function' ? debug : () => {};
  this.ready = new Promise((resolve, reject) => {
    if (socket.readyState === WebSocket.OPEN) return resolve();
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });


  socket.addEventListener('message', (event) => this._onMessage(event));
  socket.addEventListener('close', () => this._onClose());
  socket.addEventListener('error', () => this._onClose());
}

ContextWebsocket.prototype._onClose = function () {
  const err = new Error('websocket closed');
  for (const id of Object.keys(this.callbacks)) {
    this.callbacks[id].reject(err);
    delete this.callbacks[id];
  }
  for (const id of Object.keys(this.iterators)) {
    this.iterators[id].fail(err);
    delete this.iterators[id];
  }
};

ContextWebsocket.prototype._send = async function (payload) {
  const data = JSON.stringify(payload);
  this.debug('==>', data);
  await this.ready;
  this.socket.send(data);
};

ContextWebsocket.prototype._call = async function (method, params, stream) {
  const id = Math.random().toString(36).slice(2);
  await this._send({ id, method, args: params, stream: !!stream });

  if (!stream) {
    return await new Promise((resolve, reject) => {
      this.callbacks[id] = { resolve, reject };
    });
  }

  const ctrl = new StreamController(() => {
    delete this.iterators[id];
  });
  this.iterators[id] = ctrl;
  return ctrl;
};

ContextWebsocket.prototype._onMessage = function (event) {
  let msg;
  try {
    msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
  } catch {
    return;
  }

  this.debug('<==', msg);
  if (!msg || !msg.id) return;

  const cb = this.callbacks[msg.id];
  const iter = this.iterators[msg.id];

  if (msg.error) {
    const err = new Error(msg.error.message || 'rpc error');
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

  if (cb && (Object.prototype.hasOwnProperty.call(msg, 'result') || msg.done)) {
    delete this.callbacks[msg.id];
    cb.resolve(msg.result);
    return;
  }

  if (iter) {
    if (msg.done && !Object.prototype.hasOwnProperty.call(msg, 'result')) {
      iter.close();
    } else {
      iter.push(msg.result, !!msg.done);
    }
  }
};

ContextWebsocket.prototype.read = function (name, binary) {
  return this._call('read', [name, binary], false);
};

ContextWebsocket.prototype.write = function (name, content) {
  return this._call('write', [name, content], false);
};

ContextWebsocket.prototype.resolve = function (name, params) {
  return this._call('resolve', [name, params], false);
};

ContextWebsocket.prototype.exec = function (name, params) {
  return this._call('exec', [name, params], false);
};

ContextWebsocket.prototype.file2run = function (payload, params) {
  return this._call('file2run', [payload, params], payload?.stream);
};


if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextWebsocket;
} else {
  window.ContextWebsocket = ContextWebsocket;
  window.ctx = new ContextWebsocket(window.location.origin.replace(/^http/, 'ws'));
}
