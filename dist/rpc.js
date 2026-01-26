function AsyncIter() {
  return this;
}
AsyncIter;
AsyncIter.prototype[Symbol.asyncIterator] = (function() {
  return this;
});
AsyncIter.prototype.next = (async function() {
  var self, result;
  var self;
  self = this;
  if ((self.lastReturn && self.lastReturn.done)) return self.lastReturn;
  await _once((function() {
    return (!!self.err || !!self.result);
  }), (function() {
    return undefined;
  }));
  var result;
  result = self.result;
  self.result = undefined;
  self.lastReturn = result;
  if ((result && result.value && result.done)) result = {
    value: result.value
  };
  if (self.err) throw self.err;
  return result;
});

function jsonrpc(params, exports) {
  var client;
  var client;
  client = new JSONRPC(params, exports);
  return new Proxy({}, {
    get: (function(target, prop, receiver) {
      return (function(params, stream) {
        return client._call(prop, params, stream);
      });
    }),
    set: (function(obj, prop, value) {
      return (client[prop] = value);
    })
  });
}
jsonrpc;

function concatU8A() {
  var totalLen, res, offset, arr, _i, _i0, _ref, _len;
  var u8arrays = 1 <= arguments.length ? [].slice.call(arguments, 0, _i = arguments.length - 0) : (_i = 0, []);
  var totalLen;
  var res;
  var offset;
  totalLen = u8arrays.reduce((function(acc, arr) {
    return (acc + arr.length);
  }), 0);
  res = new Uint8Array(totalLen);
  offset = 0;
  _ref = u8arrays;
  for (_i0 = 0, _len = _ref.length; _i0 < _len; ++_i0) {
    arr = _ref[_i0];
    res.set(arr, offset);
    offset = offset + arr.length;
  }
  return res;
}
concatU8A;

function assert(cond, msg) {
  var _ref;
  if (!cond) {
    _ref = undefined;
    throw Error, msg;
  } else {
    _ref = undefined;
  }
  return _ref;
}
assert;

function JSONRPC(params, exports) {
  var debugWriter, self, _ref;
  var debugWriter;
  debugWriter;
  this.msgId = 1;
  if (!params.debug) {
    _ref = (function() {});
  } else if (typeof params.debug === "boolean") {
    _ref = (function() {
      var _i;
      var args = 1 <= arguments.length ? [].slice.call(arguments, 0, _i = arguments.length - 0) : (_i = 0, []);
      return console.error.apply(console, [].concat(args));
    });
  } else if (typeof params.debug === "function") {
    _ref = params.debug;
  } else {
    _ref = undefined;
  }
  this.debug = _ref;
  this.name = params.name;
  this.exports = exports || params.exports || {}
  this.callbacks = {};
  this.iterators = {};
  this.reader = params.inStream.getReader();
  this.writer = params.outStream.getWriter();
  self = this;
  assert(params.inStream, "inStream has to be defined and be a ReadableStream");
  assert(params.outStream, "outStream has to be defined and be a WritableStream");
  async function pump() {
    var res, value, done, newlineIdx, line, msg, cb, iter, err, _ref0, _err;
    var res;
    var value;
    var done;
    res = await self.reader.read();
    value = res.value;
    done = res.done;
    if (done) return;
    var newlineIdx;
    newlineIdx = 0;
    self.buf = (self.buf ? concatU8A(self.buf, value) : value);
    while (-1 !== (newlineIdx = self.buf.indexOf(10))) {
      var line;
      line = new TextDecoder().decode(self.buf.subarray(0, newlineIdx));
      self.buf = self.buf.subarray(newlineIdx + 1);
      self.debug(self.name, "<==", line);
      var msg;
      try {
        _ref0 = JSON.parse(line);
      } catch (_err) {
        self.debug(self.name, " cant parse json: ", line);
        _ref0 = {}
      }
      msg = _ref0;
      if (!msg.id) continue;
      var cb;
      var iter;
      cb = self.callbacks[msg.id];
      iter = self.iterators[msg.id];
      if (((cb || iter) && (((typeof msg !== 'undefined') && (typeof msg.result !== 'undefined')) || msg.error))) {
        if ((cb && ((typeof msg !== 'undefined') && (typeof msg.result !== 'undefined')))) {
          cb.resolve(msg.result);
        } else if (iter && ((typeof msg !== 'undefined') && (typeof msg.result !== 'undefined'))) {
          iter.result = {
            value: msg.result
          };
          if (msg.done) {
            iter.result.done = true;
            delete self.iterators[msg.id];
          }
        } else if (cb && msg.error) {
          var err;
          err = new Error(msg.error.message);
          err.stack = msg.error.stack;
          cb.reject(err);
        } else if (iter && msg.error) {
          iter.err = new Error(msg.error.message);
          iter.err.stack = msg.error.stack;
        }
        if (cb) delete self.callbacks[msg.id];
      } else if (msg.method) {
        if (!self.exports[msg.method]) {
          self._error(msg.id, "method not found: " + msg.method);
          continue;
        }(function(m, r, chunk) {
          var _ref1;
          try {
            _ref1 = self.exports[m.method](msg.params, msg.stream)
              .then((async function(r) {
                var _res, _ref1, _ref2;
                if (((typeof r !== 'undefined') && !!r[Symbol.asyncIterator])) {
                  _res = [];
                  while (!chunk.done) {
                    chunk = await r.next();
                    if (chunk.err) throw chunk.err;
                    if (typeof(_ref1 = (!!chunk.value ? self._result(m.id, chunk.value, chunk.done) : undefined)) !== 'undefined') _res.push(_ref1);
                  }
                  _ref2 = _res;
                } else {
                  _ref2 = self._result(m.id, r, true);
                }
                return _ref2;
              }))
              .catch((function(e) {
                return self._error(m.id, e.message, e.stack);
              }));
          } catch (e) {
            _ref1 = self._error(m.id, e.message, e.stack);
          }
          return _ref1;
        })(msg, undefined, {});
      }
    }
    return pump();
  }
  pump;
  pump();
  return this;
}
JSONRPC;
JSONRPC.prototype._write = (async function(payload) {
  var encoder, data;
  var encoder;
  var data;
  encoder = new TextEncoder();
  data = encoder.encode(JSON.stringify(payload) + "\n");
  this.debug(this.name, "==>", JSON.stringify(payload));
  return await this.writer.write(data);
});
JSONRPC.prototype._error = (function(msgId, message, stack) {
  return this._write({
    jsonrpc: "2.0",
    id: msgId,
    error: {
      message: message,
      stack: stack
    }
  });
});
JSONRPC.prototype._result = (function(msgId, result, done) {
  return (function(self, payload) {
    if (done) payload.done = true;
    return self._write(payload);
  })(this, {
    jsonrpc: "2.0",
    id: msgId,
    result: ((typeof result !== 'undefined') ? result : null)
  });
});
JSONRPC.prototype._call = (async function(method, params, stream) {
  var self, msgId;
  var self;
  var msgId;
  self = this;
  msgId = self.msgId;
  self.msgId++;
  self._write({
    jsonrpc: "2.0",
    id: msgId,
    method: method,
    params: params,
    stream: stream
  });
  if (!stream) return new Promise((function(resolve, reject) {
    return (self.callbacks[msgId] = {
      resolve: resolve,
      reject: reject
    });
  }));
  return (self.iterators[msgId] = new AsyncIter());
});

function _once(cond, body) {
  return new Promise((function(resolve, reject) {
    function handler() {
      var _ref;
      try {
        _ref = cond() ? resolve(body()) : setTimeout(handler, 10);
      } catch (err) {
        _ref = reject(err);
      }
      return _ref;
    }
    setTimeout(handler, 10);
    return "";
  }));
}
_once;
exports.jsonrpc = jsonrpc;