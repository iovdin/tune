var vars = function() {
  var _i;
  var names = 1 <= arguments.length ? [].slice.call(arguments, 0, _i = arguments.length - 0) : (_i = 0, []);
  return [].concat(["do"]).concat(names.map((function(name) {
    return ["=", name];
  })));
};
var querystring, URL, $roles, vm, path, makeSchema, makeFilename, fs, assert, util;
querystring = require("querystring");
URL = require("url");
async function http(options) {
  return (async function(transport, method, headers, url, query, p, resolve, reject, req) {
    transport = ((((typeof options === 'undefined') || (typeof options.url === 'undefined')) || (-1 === options.url.indexOf("https://"))) ? require("http") : require("https"));
    method = options.method || "get".toUpperCase();
    headers = options.headers || {}
    url = (options.url ? URL.parse(options.url) : undefined);
    query = (options.query ? querystring.stringify(options.query) : undefined);
    p = undefined;
    resolve = undefined;
    reject = undefined;
    req = undefined;
    p = new Promise((function(r1, r2) {
      resolve = r1;
      return (reject = r2);
    }));
    if (options.body) headers["Content-Length"] = Buffer.byteLength(options.body);
    req = transport.request((function(it) {
      if (options.timeout) it.timeout = options.timeout;
      return it;
    })({
      hostname: (url ? url.hostname : undefined),
      port: url.port,
      path: (url ? url.path : "") + (query ? ("?" + query) : ""),
      headers: headers,
      method: method
    }), (async function(res) {
      var chunks, ctype, msgs, _ref;
      if ((res.statusCode === 301)) return resolve(http(extend(options, {
        url: res.headers.location
      })));
      chunks = Buffer.from([]);
      ctype = res.headers["content-type"];
      msgs = [];
      if (ctype.includes("text/event-stream")) {
        resolve((function(it) {
          it[Symbol.asyncIterator] = it;
          return it;
        })({
          next: (async function() {
            var msg;
            if (!msgs.length) await _once((function() {
              return msgs.length;
            }), (function() {
              return undefined;
            }));
            msg = msgs.shift();
            return (msg ? {
              value: msg,
              done: false
            } : {
              value: undefined,
              done: true
            });
          })
        }));
        _ref = res.on("data", (function(data) {
          return (function(it) {
            it = it.toString("utf-8");
            it = it.replaceAll(/^(data:(.*)\r?\n)/gm, (function(m, p1, p2) {
              msgs.push(((p2.trim() === "[DONE]") ? null : dJSON.parse(p2)));
              return "";
            }));
            it = (chunks = Buffer.from(it, "utf8"));
            return it;
          })(Buffer.concat(Array(chunks, data), chunks.length + data.length));
        }));
      } else if (ctype === "application/x-ndjson") {
        resolve((function(it) {
          it[Symbol.asyncIterator] = it;
          return it;
        })({
          next: (async function() {
            if (!msgs.length) await _once((function() {
              return msgs.length;
            }), (function() {
              return undefined;
            }));
            return msgs.shift();
          })
        }));
        _ref = res.on("data", (function(data) {
          return (function(it) {
            it = it.toString("utf-8");
            it = it.replaceAll(/^({.*}\r?\n)/gm, (function(m, p1) {
              msgs.push(dJSON.parse(p1));
              return "";
            }));
            it = (chunks = Buffer.from(it, "utf8"));
            return it;
          })(Buffer.concat(Array(chunks, data), chunks.length + data.length));
        }));
      } else {
        res.on("data", (function(data) {
          return (chunks = Buffer.concat(Array(chunks, data), chunks.length + data.length));
        }));
        _ref = res.on("end", (function() {
          chunks = chunks.toString("utf8");
          if ((ctype && (-1 !== ctype.indexOf("json")))) {
            try {
              chunks = JSON.parse(chunks);
            } catch (e) {
              return reject(e);
            }
          }
          return (((res.statusCode >= 200) && (res.statusCode < 300)) ? resolve(chunks) : reject(((((typeof chunks !== "undefined") && (chunks !== null) && !Number.isNaN(chunks) && (typeof chunks.error !== "undefined") && (chunks.error !== null) && !Number.isNaN(chunks.error) && (typeof chunks.error.message !== "undefined") && (chunks.error.message !== null) && !Number.isNaN(chunks.error.message)) ? chunks.error.message : undefined) ? new Error(tpl("{type}: {message}", chunks.error)) : chunks)));
        }));
      }
      return _ref;
    }));
    req.on("error", (function(err) {
      return reject(err);
    }));
    req.end(options.body || "");
    return p;
  }).call(this);
}
http;

function _afor(next, body) {
  return new Promise((function(resolve, reject) {
    return (function(results, iter) {
      function handle() {
        var args;
        args = iter();
        return ((typeof args === "undefined") ? resolve(results) : body.apply(body, [].concat(args))
          .then((function(result) {
            results.push(result);
            return handle();
          }), (function(err) {
            return reject(err);
          })));
      }
      return handle();
    })([], next());
  }));
}
_afor;

function extend() {
  var _i;
  var objects = 1 <= arguments.length ? [].slice.call(arguments, 0, _i = arguments.length - 0) : (_i = 0, []);
  return (function(result) {
    var object, key, value, _i0, _ref, _len, _ref0, _len0;
    _ref = objects;
    for (_i0 = 0, _len = _ref.length; _i0 < _len; ++_i0) {
      object = _ref[_i0];
      _ref0 = object;
      for (key in _ref0) {
        value = _ref0[key];
        if ((typeof value !== 'undefined')) result[key] = JSON.parse(JSON.stringify(value));
      }
    }
    return result;
  })({});
}
extend;

function TuneError(message, filename, row, col, stack, originalError) {
  var lastItem;
  var stack;
  stack = stack || [];
  var lastItem;
  lastItem = stack["slice"](-1)[0];
  if ((!filename || ((((typeof lastItem !== "undefined") && (lastItem !== null) && !Number.isNaN(lastItem) && (typeof lastItem.filename !== "undefined") && (lastItem.filename !== null) && !Number.isNaN(lastItem.filename)) ? lastItem.filename : undefined) !== filename))) stack.push({
    filename: filename || "",
    row: row,
    col: col
  });
  this.name = "TuneError";
  this.message = message;
  this.row = row;
  this.col = col;
  this.stack = stack;
  this.error = originalError;
  return this;
}
TuneError;
TuneError.prototype = Object.create(Error.prototype);
TuneError.prototype.constructor = TuneError;
TuneError.wrap = (function(err, filename, row, col) {
  return ((err.name === "TuneError") ? new TuneError(err.message, filename, row, col, err.stack, err.error) : new TuneError("Internal Error", filename, row, col, undefined, err));
});
TuneError.prototype.toString = (function() {
  return (this.message + "\n" + this.stack
    .map((function() {
      return ("    at " + arguments[0].filename + (((typeof arguments !== 'undefined') && (typeof arguments[0] !== 'undefined') && (typeof arguments[0].row !== 'undefined')) ? (":" + arguments[0].row) : "") + (((typeof arguments !== 'undefined') && (typeof arguments[0] !== 'undefined') && (typeof arguments[0].col !== 'undefined')) ? (":" + arguments[0].col) : ""));
    }))
    .join("\n") + (this.error ? (this.error.stack ? ("\n" + this.error.stack) : this.error.message) : ""));
});
var dJSON = (() => {
  var de = Object.create;
  var N = Object.defineProperty;
  var ye = Object.getOwnPropertyDescriptor;
  var xe = Object.getOwnPropertyNames;
  var Ee = Object.getPrototypeOf,
    ge = Object.prototype.hasOwnProperty;
  var c = (e, r) => () => (r || e((r = {
      exports: {}
    }).exports, r), r.exports),
    be = (e, r) => {
      for (var u in r) N(e, u, {
        get: r[u],
        enumerable: !0
      })
    },
    j = (e, r, u, t) => {
      if (r && typeof r == "object" || typeof r == "function")
        for (let i of xe(r)) !ge.call(e, i) && i !== u && N(e, i, {
          get: () => r[i],
          enumerable: !(t = ye(r, i)) || t.enumerable
        });
      return e
    },
    U = (e, r, u) => (j(e, r, "default"), u && j(u, r, "default")),
    H = (e, r, u) => (u = e != null ? de(Ee(e)) : {}, j(r || !e || !e.__esModule ? N(u, "default", {
      value: e,
      enumerable: !0
    }) : u, e)),
    Fe = e => j(N({}, "__esModule", {
      value: !0
    }), e);
  var P = c((We, D) => {
    typeof D == "object" && typeof D.exports == "object" && (D.exports = Y);
    Y.defunct = function(e) {
      throw new Error("Unexpected character at index " + (this.index - 1) + ": " + e)
    };

    function Y(e) {
      typeof e != "function" && (e = Y.defunct);
      var r = [],
        u = [],
        t = 0;
      this.state = 0, this.index = 0, this.input = "", this.addRule = function(n, v, x) {
        var y = n.global;
        if (!y) {
          var E = "g";
          n.multiline && (E += "m"), n.ignoreCase && (E += "i"), n = new RegExp(n.source, E)
        }
        return Object.prototype.toString.call(x) !== "[object Array]" && (x = [0]), u.push({
          pattern: n,
          global: y,
          action: v,
          start: x
        }), this
      }, this.setInput = function(n) {
        return t = 0, this.state = 0, this.index = 0, r.length = 0, this.input = n, this
      }, this.lex = function() {
        if (r.length) return r.shift();
        for (this.reject = !0; this.index <= this.input.length;) {
          for (var n = i.call(this).splice(t), v = this.index; n.length && this.reject;) {
            var x = n.shift(),
              y = x.result,
              E = x.length;
            this.index += E, this.reject = !1, t++;
            var f = x.action.apply(this, y);
            if (this.reject) this.index = y.index;
            else if (typeof f < "u") switch (Object.prototype.toString.call(f)) {
              case "[object Array]":
                r = f.slice(1), f = f[0];
              default:
                return E && (t = 0), f
            }
          }
          var F = this.input;
          if (v < F.length)
            if (this.reject) {
              t = 0;
              var f = e.call(this, F.charAt(this.index++));
              if (typeof f < "u") return Object.prototype.toString.call(f) === "[object Array]" ? (r = f.slice(1), f[0]) : f
            } else this.index !== v && (t = 0), this.reject = !0;
          else if (n.length) this.reject = !0;
          else break
        }
      };

      function i() {
        for (var n = [], v = 0, x = this.state, y = this.index, E = this.input, f = 0, F = u.length; f < F; f++) {
          var h = u[f],
            T = h.start,
            p = T.length;
          if (!p || T.indexOf(x) >= 0 || x % 2 && p === 1 && !T[0]) {
            var o = h.pattern;
            o.lastIndex = y;
            var s = o.exec(E);
            if (s && s.index === y) {
              var d = n.push({
                result: s,
                action: h.action,
                length: s[0].length
              });
              for (h.global && (v = d); --d > v;) {
                var a = d - 1;
                if (n[d].length > n[a].length) {
                  var _ = n[d];
                  n[d] = n[a], n[a] = _
                }
              }
            }
          }
        }
        return n
      }
    }
  });
  var k = c(() => {
    String.fromCodePoint || function() {
      var e = function() {
          try {
            var i = {},
              n = Object.defineProperty,
              v = n(i, i, i) && n
          } catch {}
          return v
        }(),
        r = String.fromCharCode,
        u = Math.floor,
        t = function(i) {
          var n = 16384,
            v = [],
            x, y, E = -1,
            f = arguments.length;
          if (!f) return "";
          for (var F = ""; ++E < f;) {
            var h = Number(arguments[E]);
            if (!isFinite(h) || h < 0 || h > 1114111 || u(h) != h) throw RangeError("Invalid code point: " + h);
            h <= 65535 ? v.push(h) : (h -= 65536, x = (h >> 10) + 55296, y = h % 1024 + 56320, v.push(x, y)), (E + 1 == f || v.length > n) && (F += r.apply(null, v), v.length = 0)
          }
          return F
        };
      e ? e(String, "fromCodePoint", {
        value: t,
        configurable: !0,
        writable: !0
      }) : String.fromCodePoint = t
    }()
  });
  var re = c((V, ee) => {
    "use strict";
    Object.defineProperty(V, "__esModule", {
      value: !0
    });
    V.default = void 0;
    k();
    var Le = /\\(u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|(['"tbrnfv0\\]))|\\U([0-9A-Fa-f]{8})/g,
      Re = {
        0: "\0",
        b: "\b",
        f: "\f",
        n: `
`,
        r: "\r",
        t: "	",
        v: "\v",
        "'": "'",
        '"': '"',
        "\\": "\\"
      },
      K = function(r) {
        return String.fromCodePoint(parseInt(r, 16))
      },
      we = function(r) {
        return String.fromCodePoint(parseInt(r, 8))
      },
      _e = function(r) {
        return r.replace(Le, function(u, t, i, n, v, x, y, E) {
          return i !== void 0 ? K(i) : n !== void 0 ? K(n) : v !== void 0 ? K(v) : x !== void 0 ? we(x) : E !== void 0 ? K(E) : Re[y]
        })
      };
    V.default = _e;
    ee.exports = V.default
  });
  var ue = c(J => {
    (function(e) {
      var r = String.fromCharCode;

      function u(p) {
        for (var o = [], s = 0, d = p.length, a, _; s < d;) a = p.charCodeAt(s++), a >= 55296 && a <= 56319 && s < d ? (_ = p.charCodeAt(s++), (_ & 64512) == 56320 ? o.push(((a & 1023) << 10) + (_ & 1023) + 65536) : (o.push(a), s--)) : o.push(a);
        return o
      }

      function t(p) {
        for (var o = p.length, s = -1, d, a = ""; ++s < o;) d = p[s], d > 65535 && (d -= 65536, a += r(d >>> 10 & 1023 | 55296), d = 56320 | d & 1023), a += r(d);
        return a
      }

      function i(p) {
        if (p >= 55296 && p <= 57343) throw Error("Lone surrogate U+" + p.toString(16).toUpperCase() + " is not a scalar value")
      }

      function n(p, o) {
        return r(p >> o & 63 | 128)
      }

      function v(p) {
        if (!(p & 4294967168)) return r(p);
        var o = "";
        return p & 4294965248 ? p & 4294901760 ? p & 4292870144 || (o = r(p >> 18 & 7 | 240), o += n(p, 12), o += n(p, 6)) : (i(p), o = r(p >> 12 & 15 | 224), o += n(p, 6)) : o = r(p >> 6 & 31 | 192), o += r(p & 63 | 128), o
      }

      function x(p) {
        for (var o = u(p), s = o.length, d = -1, a, _ = ""; ++d < s;) a = o[d], _ += v(a);
        return _
      }

      function y() {
        if (h >= F) throw Error("Invalid byte index");
        var p = f[h] & 255;
        if (h++, (p & 192) == 128) return p & 63;
        throw Error("Invalid continuation byte")
      }

      function E() {
        var p, o, s, d, a;
        if (h > F) throw Error("Invalid byte index");
        if (h == F) return !1;
        if (p = f[h] & 255, h++, !(p & 128)) return p;
        if ((p & 224) == 192) {
          if (o = y(), a = (p & 31) << 6 | o, a >= 128) return a;
          throw Error("Invalid continuation byte")
        }
        if ((p & 240) == 224) {
          if (o = y(), s = y(), a = (p & 15) << 12 | o << 6 | s, a >= 2048) return i(a), a;
          throw Error("Invalid continuation byte")
        }
        if ((p & 248) == 240 && (o = y(), s = y(), d = y(), a = (p & 7) << 18 | o << 12 | s << 6 | d, a >= 65536 && a <= 1114111)) return a;
        throw Error("Invalid UTF-8 detected")
      }
      var f, F, h;

      function T(p) {
        f = u(p), F = f.length, h = 0;
        for (var o = [], s;
          (s = E()) !== !1;) o.push(s);
        return t(o)
      }
      e.version = "3.0.0", e.encode = x, e.decode = T
    })(typeof J > "u" ? J.utf8 = {} : J)
  });
  var pe = c((Pe, G) => {
    "use strict";
    var Ce = P(),
      Se = re(),
      He = ue(),
      te = 6,
      ce = 7,
      le = 11,
      Xe = 12,
      Oe = 13,
      me = 14,
      Ae = -1,
      Ie = -2,
      Te = -3,
      Ve = -4,
      Be = -5,
      je = [
        [/\s*:\s*/, Ae],
        [/\s*,\s*/, Ie],
        [/\s*{\s*/, Te],
        [/\s*}\s*/, Oe],
        [/\s*\[\s*/, Ve],
        [/\s*\]\s*/, Xe],
        [/\s*\.\s*/, Be]
      ];

    function ne(e) {
      return e = e.replace(/\\\//, "/"), Se(e)
    }

    function Ne(e) {
      let r = new Ce,
        u = 0,
        t = 0;
      return r.addRule(/"((?:\\.|[^"])*?)($|")/, (i, n) => (u += i.length, {
        type: le,
        value: ne(n),
        row: t,
        col: u,
        single: !1
      })), r.addRule(/'((?:\\.|[^'])*?)($|'|(",?[ \t]*\n))/, (i, n) => (u += i.length, {
        type: le,
        value: ne(n),
        row: t,
        col: u,
        single: !0
      })), r.addRule(/[\-0-9]*\.[0-9]*([eE][\+\-]?)?[0-9]*(?:\s*)/, i => (u += i.length, {
        type: te,
        value: parseFloat(i),
        row: t,
        col: u
      })), r.addRule(/\-?[0-9]+([eE][\+\-]?)[0-9]*(?:\s*)/, i => (u += i.length, {
        type: te,
        value: parseFloat(i),
        row: t,
        col: u
      })), r.addRule(/\-?[0-9]+(?:\s*)/, i => (u += i.length, {
        type: ce,
        value: parseInt(i),
        row: t,
        col: u
      })), je.forEach(i => {
        r.addRule(i[0], n => (u += n.length, {
          type: i[1],
          value: n,
          row: t,
          col: u
        }))
      }), r.addRule(/\s/, i => {
        i == `
` ? (u = 0, t++) : u += i.length
      }), r.addRule(/\S[ \t]*/, i => (u += i.length, {
        type: me,
        value: i,
        row: t,
        col: u
      })), r.setInput(e), r
    }
    G.exports.lexString = ie;

    function ie(e, r) {
      let u = Ne(e),
        t = "";
      for (; t = u.lex();) r(t)
    }
    G.exports.getAllTokens = Ue;

    function Ue(e) {
      let r = [];
      return ie(e, function(t) {
        r.push(t)
      }), r
    }
  });
  var he = c((ke, fe) => {
    "use strict";
    var De = pe(),
      W = 0,
      X = 1,
      C = 2,
      Z = 3,
      M = 4,
      q = 5,
      Ke = 6,
      oe = 7,
      b = 8,
      R = 9,
      S = 10,
      Je = 11,
      A = 12,
      I = 13,
      Me = 14,
      g = 15,
      m = -1,
      L = -2,
      $ = -3,
      O = -4;

    function ae(e) {
      e.peek == null && Object.defineProperty(e, "peek", {
        enumerable: !1,
        value: function() {
          return this[this.length - 1]
        }
      }), e.last == null && Object.defineProperty(e, "last", {
        enumerable: !1,
        value: function(r) {
          return this[this.length - (1 + r)]
        }
      })
    }

    function l(e, r) {
      return e && e.hasOwnProperty("type") && e.type == r
    }
    fe.exports.parse = qe;

    function qe(e, r) {
      let u = [],
        t = [];
      ae(u), ae(t);
      let i = function(n) {
        t.push(n)
      };
      De.lexString(e, i), t[0].type == O && t.last(0).type != A && t.push({
        type: A,
        value: "]",
        row: -1,
        col: -1
      }), t[0].type == $ && t.last(0).type != I && t.push({
        type: I,
        value: "}",
        row: -1,
        col: -1
      });
      for (let n = 0; n < t.length; n++)
        for ("" + t[n].type, u.push(t[n]); w(u););
      return u.length == 1 && u[0].type == X && (u = [{
        type: S,
        value: u[0].value
      }]), Q(u[0], r)
    }

    function w(e) {
      let r = e.pop();
      switch (r.type) {
        case b:
          if (r.value.trim() == "true") return e.push({
            type: Z,
            value: "true"
          }), !0;
          if (r.value.trim() == "false") return e.push({
            type: Z,
            value: "false"
          }), !0;
          if (r.value.trim() == "null") return e.push({
            type: g,
            value: null
          }), !0;
          break;
        case Me:
          return l(e.peek(), b) ? (e.peek().value += r.value, !0) : (e.push({
            type: b,
            value: r.value
          }), !0);
        case oe:
          return l(r, oe) && l(e.peek(), b) ? (e.peek().value += r.value, !0) : (r.type = g, e.push(r), !0);
        case Je:
          return r.type = g, r.value = r.value, e.push(r), !0;
        case Z:
          return r.type = g, r.value == "true" ? r.value = !0 : r.value = !1, e.push(r), !0;
        case Ke:
          return r.type = g, e.push(r), !0;
        case g:
          if (l(e.peek(), L)) return r.type = q, e.pop(), e.push(r), !0;
          if (l(e.peek(), m)) return r.type = M, e.pop(), e.push(r), !0;
          if (l(e.peek(), b) && l(e.last(1), g)) {
            let u = e.pop();
            return e.peek().value += '"' + u.value + '"', e.peek().value += r.value, !0
          }
          if (l(e.peek(), b) && l(e.last(1), C)) {
            let u = e.pop(),
              t = e.peek().value.pop();
            return t += '"' + u.value + '"', t += r.value, e.peek().value.push(t), !0
          }
          if (l(e.peek(), b) && l(e.last(1), X)) {
            let u = e.pop(),
              t = e.peek().value.pop(),
              i = r.single ? "'" : '"';
            return t.value += i + u.value + i, t.value += r.value, e.peek().value.push(t), !0
          }
          if (l(e.peek(), b)) {
            let u = e.pop().value;
            return r.value = u + r.value, e.push(r), !0
          }
          break;
        case R:
          if (l(r, R) && l(e.peek(), L)) return r.type = q, e.pop(), e.push(r), !0;
          if (l(e.peek(), m)) return r.type = M, e.pop(), e.push(r), !0;
          break;
        case S:
          if (l(e.peek(), L)) {
            let u = {
              type: q,
              value: r
            };
            return e.pop(), e.push(u), !0
          }
          if (l(e.peek(), m)) {
            let u = {
              type: M,
              value: r
            };
            return e.pop(), e.push(u), !0
          }
          if (l(e.peek(), b)) {
            let u = e.pop();
            return e.push({
              type: W,
              key: u.value.trim(),
              value: r
            }), !0
          }
          break;
        case q:
          return l(e.peek(), C) ? (e.peek().value.push(r.value), !0) : (e.push({
            type: C,
            value: [r.value]
          }), !0);
        case C:
          if (l(e.peek(), g)) return r.value.unshift(e.peek().value), e.pop(), e.push(r), !0;
          if (l(e.peek(), R)) return r.value.unshift(e.peek().value), e.pop(), e.push(r), !0;
          if (l(e.peek(), S)) return r.value.unshift(e.peek()), e.pop(), e.push(r), !0;
          if (l(e.peek(), b) && (e.last(1), L)) {
            let u = e.pop();
            for (e.push({
                type: g,
                value: u.value
              }), "" + u.value; w(e););
            return e.push(r), !0
          }
          if (l(e.peek(), C)) return e.peek().value.push(r.value[0]), !0;
          break;
        case M:
          if (l(e.peek(), b) || l(e.peek(), g) || l(e.peek(), C)) {
            let u = e.pop();
            return e.push({
              type: W,
              key: u.value,
              value: r.value
            }), !0
          }
          throw new Error("Got a :value that can't be handled at line " + r.row + ":" + r.col);
        case W:
          return l(e.last(0), L) && l(e.last(1), X) ? (e.last(1).value.push(r), e.pop(), !0) : (e.push({
            type: X,
            value: [r]
          }), !0);
        case X:
          if (l(e.peek(), X)) return r.value.forEach(function(u) {
            e.peek().value.push(u)
          }), !0;
          break;
        case A:
          if (l(e.peek(), C) && l(e.last(1), O)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: R,
              value: u.value
            }), !0
          }
          if (l(e.peek(), R) && l(e.last(1), O)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: R,
              value: [u.value]
            }), !0
          }
          if (l(e.peek(), O)) return e.pop(), e.push({
            type: R,
            value: []
          }), !0;
          if (l(e.peek(), g) && l(e.last(1), O)) {
            let u = e.pop().value;
            return e.pop(), e.push({
              type: R,
              value: [u]
            }), !0
          }
          if (l(e.peek(), S) && l(e.last(1), O)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: R,
              value: [u]
            }), !0
          }
          if (l(e.peek(), b) && l(e.last(1), L)) {
            let u = e.pop();
            for (e.push({
                type: g,
                value: u.value
              }), "" + u.value; w(e););
            return e.push({
              type: A
            }), !0
          }
          if (l(e.peek(), L) && (l(e.last(1), b) || l(e.last(1), S) || l(e.last(1), g))) {
            for (e.pop(), e.push({
                type: A,
                value: "]"
              }), "" + JSON.stringify(e); w(e););
            return !0
          }
          if (l(e.peek(), b) && l(e.last(1), O)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: R,
              value: [u.value]
            }), !0
          }
          if (l(e.peek(), L) && l(e.last(1), C)) {
            for (e.pop(), e.push({
                type: A
              }), "" + JSON.stringify(e); w(e););
            return !0
          }
          break;
        case I:
          if (l(e.peek(), X) && l(e.last(1), $)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: S,
              value: u.value
            }), !0
          }
          if (l(e.peek(), $)) return e.pop(), e.push({
            type: S,
            value: null
          }), !0;
          if (l(e.peek(), b) && l(e.last(1), m)) {
            let u = e.pop();
            for (e.push({
                type: g,
                value: u.value
              }), "" + u.value; w(e););
            return e.push({
              type: I
            }), !0
          }
          if (l(e.peek(), m)) {
            for (e.push({
                type: g,
                value: null
              }); w(e););
            return e.push({
              type: I
            }), !0
          }
          if (l(e.peek(), L)) return e.pop(), e.push({
            type: I
          }), !0;
          throw new Error("Found } that I can't handle at line " + r.row + ":" + r.col);
        case L:
          if (l(e.peek(), L)) return !0;
          if (l(e.peek(), b)) {
            let u = e.pop();
            for (e.push({
                type: g,
                value: u.value
              }); w(e););
            return e.push(r), !0
          }
          if (l(e.peek(), m)) {
            for (e.push({
                type: g,
                value: null
              }); w(e););
            return e.push(r), !0
          }
      }
      return e.push(r), !1
    }

    function Q(e, r) {
      if (["boolean", "number", "string"].indexOf(typeof e) != -1) return e;
      if (e === null) return null;
      if (Array.isArray(e)) {
        let t = [];
        for (; e.length > 0;) t.unshift(Q(e.pop()));
        return t
      }
      if (l(e, S)) {
        let t = {};
        return e.value === null ? {} : (e.value.forEach(function(i) {
          let n = i.key,
            v = Q(i.value);
          r && n in t ? t[n] = {
            value: t[n],
            next: v
          } : t[n] = v
        }), t)
      }
      return l(e, R) ? Q(e.value) : e.value
    }
  });
  var z = c((er, ve) => {
    "use strict";
    var Qe = he();
    ve.exports.parse = Ye;

    function Ye(e, r) {
      let u = !0,
        t = !1;
      r && ("fallback" in r && r[u] === !1 && (u = !1), t = "duplicateKeys" in r && r.duplicateKeys === !0);
      try {
        return Qe.parse(e, t)
      } catch (i) {
        if (u === !1) throw i;
        try {
          let n = JSON.parse(e);
          return console.warn("dirty-json got valid JSON that failed with the custom parser. We're returning the valid JSON, but please file a bug report here: https://github.com/RyanMarcus/dirty-json/issues  -- the JSON that caused the failure was: " + e), n
        } catch {
          throw i
        }
      }
    }
  });
  var B = {};
  be(B, {
    default: () => se.default
  });
  U(B, H(z()));
  var se = H(z());
  return Fe(B);
})();
/*! http://mths.be/fromcodepoint v0.2.1 by @mathias */
/*! https://mths.be/utf8js v3.0.0 by @mathias */
;

function pparse(filename) {
  var parsed, parsed1;
  var parsed;
  var parsed1;
  parsed = path.parse(filename);
  parsed1 = path.parse(parsed.name);
  if (parsed1.ext) {
    parsed.ext2 = parsed1.ext;
    parsed.name = parsed1.name;
  }
  return parsed;
}
pparse;

function makeContext(env, fs, filename, parent) {
  var cwd, paths;
  env = Object.assign({}, env);
  var cwd;
  var filename;
  var paths;
  cwd = (filename ? path.dirname(filename) : "");
  filename = (filename ? filename : "");
  paths = (function(it) {
    var p, lenv, key, value, _i, _ref, _len, _ref0, _len0;
    it = it.split(path.delimiter);
    it = it.filter((function() {
      return arguments[0];
    }));
    it = it.filter((function() {
      return (arguments[0] !== cwd);
    }));
    if (cwd) it.unshift(cwd);
    if (!it.length) it.unshift("/");
    it = it;
    it = it.reduce((function(memo, path) {
      memo.includes(path) ? memo : memo.push(path);
      return memo;
    }), []);
    it = it.reverse();
    _ref = it;
    for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
      p = _ref[_i];
      var lenv;
      lenv = path.resolve(p, ".env");
      if ((!lenv || !fs.existsSync(lenv))) continue;
      _ref0 = env2vars(fs.readFileSync(lenv, "utf8"));
      for (key in _ref0) {
        value = _ref0[key];
        if ((key === "TUNE_PATH")) {
          if (!it.includes(value)) it.push(value);
        } else {
          env[key] = value;
        }
      }
    }
    it = it.reverse();
    return it;
  })(env.TUNE_PATH || "");

  function resolve(name) {
    var p, fname, parsed, item, parsed1, _i, _ref, _len, _i0, _ref0, _len0;
    if (this.env.hasOwnProperty(name)) return name;
    _ref = paths;
    for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
      p = _ref[_i];
      var fname;
      var parsed;
      fname = path.resolve(p, name);
      parsed = pparse(fname);
      if (!fs.existsSync(parsed.dir)) continue;
      _ref0 = fs.readdirSync(parsed.dir);
      for (_i0 = 0, _len0 = _ref0.length; _i0 < _len0; ++_i0) {
        item = _ref0[_i0];
        var parsed1;
        parsed1 = pparse(item);
        if ((parsed1.name !== parsed.name)) continue;
        if (((item === parsed.base) || !parsed.ext || (parsed1.ext2 && (parsed.base === (parsed1.name + parsed1.ext2))))) return path.resolve(parsed.dir, item);
      }
    }
    if (parent) return parent.resolve(name);
    return null;
  }
  return (function(it) {
    it.top = (((typeof parent !== "undefined") && (parent !== null) && !Number.isNaN(parent) && (typeof parent.top !== "undefined") && (parent.top !== null) && !Number.isNaN(parent.top)) ? parent.top : (((typeof parent !== "undefined") && (parent !== null) && !Number.isNaN(parent)) ? parent : (((typeof it !== "undefined") && (it !== null) && !Number.isNaN(it)) ? it : undefined)));
    return it;
  })({
    env: env,
    fs: fs,
    filename: filename,
    cwd: cwd,
    paths: paths,
    parent: parent,
    resolve: resolve,
    read: (function(filename, enc) {
      return (this.env.hasOwnProperty(filename) ? this.env[filename] : this.fs.readFileSync(filename, enc));
    }),
    exists: (function(filename) {
      return (this.env.hasOwnProperty(filename) ? true : this.fs.existsSync(filename));
    }),
    write: (function(filename, content) {
      if (!fs.existsSync(path.dirname(filename))) fs.mkdirSync(path.dirname(filename), {
        recursive: true
      });
      return this.fs.writeFileSync(filename, content);
    }),
    clone: (function(filename, newProps) {
      return makeContext((function(it) {
        var key, value, _ref, _len;
        _ref = newProps;
        for (key in _ref) {
          value = _ref[key];
          it[key] = value;
        }
        it = it;
        return it;
      })(Object.assign({}, this.env)), this.fs, filename, this);
    })
  });
}
makeContext;

function getPos(offset, str) {
  return (function(it) {
    it = it.split("\n");
    it = Array(it.length - 1, it["slice"](-1)[0].length);
    return it;
  })(str.substr(0, offset));
}
getPos;

function env2vars(text) {
  return text
    .split(/^(\w+\s*=)/gm)
    .reduce((function(memo, item, index, arr) {
      (function(it) {
        return (it ? memo.push({
          name: it[1],
          content: arr[index + 1]
            .replace(/\n$/, "")
        }) : undefined);
      })(item.match(/^(\w+)\s*=/));
      return memo;
    }), [])
    .reduce((function(memo, item) {
      memo[item.name] = item
        .content.replace(new RegExp("^\\s*'(.*)'\\s*$"), "$1")
        .replace(new RegExp("^\\s*\"(.*)\"\\s*$"), "$1");
      return memo;
    }), {});
}
env2vars;
$roles = {
  short2long: {
    "s": "system",
    "u": "user",
    "a": "assistant",
    "tc": "tool_call",
    "v": "variable",
    "error": "error",
    "c": "comment",
    "tr": "tool"
  },
  long2short: {
    "system": "s",
    "user": "u",
    "assistant": "a",
    "tool_call": "tc",
    "variable": "v",
    "error": "error",
    "comment": "c",
    "tool": "tr"
  }
};

function text2roles(text, lineNum) {
  return (function(it) {
    it = it.split(/(^(?:s|u|a|tc|tr|c|e|v|error)\s*:)/gm);
    it = it.reduce((function(memo, item, index, arr) {
      memo.row = memo.row || 0;
      (function(it) {
        var res, _ref;
        if (it) {
          var res;
          res = {
            role: $roles.short2long[it[1]],
            content: arr[index + 1]
              .replace(/\n$/, ""),
            row: memo.row,
            col: 0
          };
          memo.push(res);
          _ref = (memo.row += res.content.split("\n").length);
        } else {
          _ref = undefined;
        }
        return _ref;
      })(item.match(/^(s|u|a|tc|tr|c|e|v|error)\s*:/));
      return memo;
    }), []);
    it = it.map((function() {
      return (lineNum ? arguments[0] : pick(arguments[0], "role", "content"));
    }));
    return it;
  })(text);
}
text2roles;

function roles2text(msgs) {
  return msgs
    .map((function(msg) {
      return (function(it) {
        return (it ? (it + ":" + msg.content) : undefined);
      })($roles.long2short[msg.role]);
    }))
    .join("\n");
}
roles2text;

function text2html(text, mimetype) {
  var _ref;
  if ((mimetype === "text/chat")) {
    _ref = text2roles(text)
      .map((function(item, index, arr) {
        var _ref;
        switch (item.role) {
          case "system":
            _ref = "bullet-s";
            break;
          case "variable":
            _ref = "bullet-s";
            break;
          case "assistant":
            _ref = "bullet-a";
            break;
          case "tool_call":
            _ref = "bullet-a";
            break;
          case "tool":
            _ref = "bullet-s";
            break;
          case "user":
            _ref = "bullet-u";
            break;
          case "error":
            _ref = "bullet-s";
            break;
          case "comment":
            _ref = "bullet-c";
            break;
          default:
            _ref = undefined;
        }
        return span({
          class: "mb-10px relative " + _ref
        }, span({
          title: item.role
        }, $roles.long2short[item.role], ":", vars2html(item.content), ((index !== (arr.length - 1)) ? "\n" : "")));
      }));
  } else if (0 === mimetype.indexOf("text/")) {
    _ref = vars2html(text);
  } else {
    _ref = undefined;
  }
  return _ref;
}
text2html;

function vars2html(str) {
  return str
    .split(/({\w+})/g)
    .map((function(item, index, arr) {
      return (function(it) {
        return (it ? twwc(b("{", it[1], "}"), "t-black dark:t-white") : document.createTextNode(String(item)));
      })(item.match(/^{(\w+)}$/));
    }));
}
vars2html;

function text2var(text) {
  return (function(it) {
    var _ref;
    if (it) {
      _ref = (function(res) {
        res[it[1]] = it[2];
        return res;
      })({});
    } else {
      _ref = undefined;
      throw new Error(("var syntax: " + text));
    }
    return _ref;
  })(text.match(/^\s*(\w+)\s*=?\s*([\s\S]*)$/m));
}
text2var;

function text2call(text) {
  var lines, m, txt, name, args, _ref;
  var lines;
  var m;
  var txt;
  lines = text.split(/\r?\n/g);
  m = lines[0].match(/^\s*(\w+)\s*({.*})?\s*$/);
  txt = lines
    .slice(1)
    .join("\n")
    .trim();
  if (!m) throw new Error(("can not parse tool call: " + lines[0]));
  var name;
  var args;
  name = m[1];
  try {
    _ref = dJSON.parse(m[2] || "{}");
  } catch (e) {
    throw new Error(("Can not parse arguments :" + m[2] + " " + (((typeof e !== "undefined") && (e !== null) && !Number.isNaN(e) && (typeof e.message !== "undefined") && (e.message !== null) && !Number.isNaN(e.message)) ? e.message : (((typeof e !== "undefined") && (e !== null) && !Number.isNaN(e)) ? e : undefined))));
  }
  args = _ref;
  if (txt) args.text = txt;
  return {
    name: name,
    arguments: JSON.stringify(args)
  }
}
text2call;

function text2expand(text, ctx, opts) {
  var re;
  if ((typeof opts === 'undefined')) opts = {};
  var re;
  re = /{(\w+:)?([~\.\-\w\s/]+)}/g;

  function skip(prefix, name) {
    return ("{" + (prefix ? (prefix + ":") : "") + name + "}");
  }
  skip;
  return (text = text.replace(re, (function(_, prefix, name, offset, str, groups) {
    var filename, row, col, parsed, _ref, _i;
    prefix = (prefix ? prefix.slice(0, -1) : undefined);
    if ((prefix && (prefix !== "base64" && prefix !== "json" && prefix !== "text" && prefix !== "esc"))) return skip(prefix, name);
    filename = ctx.resolve(name);
    if (!filename) {
      if (opts.skipNotFound) {
        return skip(prefix, name);
      } else {
        _ref = getPos(offset, str);
        row = _ref[0];
        col = _ref[1];
        throw new TuneError(("'" + name + "' not found"), ctx.filename, row, col);
      }
    }
    parsed = pparse(filename);
    if ((prefix === "base64")) return (function(it) {
      it = it.toString("base64");
      return it;
    })(ctx.read(filename));
    if ((prefix === "json")) return JSON.stringify(ctx.read(filename, "utf8"));
    if ((prefix === "esc")) return escape(ctx.read(filename, "utf8"));
    if ((prefix === "text")) return ctx.read(filename, "utf8");
    if (((parsed.ext === ".tool" || parsed.ext === ".jpg" || parsed.ext === ".png" || parsed.ext === ".webp") || (parsed.ext2 === ".tool" || parsed.ext2 === ".config") || ctx.exists(chext(filename, "tool")))) return skip(prefix, name);
    return ctx.read(filename, "utf8");
  })));
}
text2expand;

function chat2expand(text, ctx, opts) {
  if ((typeof opts === 'undefined')) opts = {};
  return (function(it) {
    it = text2roles(it);
    it = it.map((function(item) {
      if ((item.role === "system" || item.role === "user" || item.role === "tool")) item.content = text2expand(item.content, ctx, opts);
      return item;
    }));
    it = roles2text(it);
    return it;
  })(text);
}
chat2expand;

function chext(filename, ext) {
  return (function(parsed) {
    parsed.ext = ext;
    parsed.base = parsed.name + "." + ext;
    return path.format(parsed);
  })(pparse(filename));
}
chext;

function text2api(text, fs, opts) {
  if ((typeof opts === 'undefined')) opts = {};
  return (function(payload, toolId, tools, re) {
    function skip(prefix, name) {
      return ("{" + (prefix ? (prefix + ":") : "") + name + "}");
    }
    skip;
    payload.messages = (function(it) {
      it = it.replace(re, (function(_, prefix, name, offset, str) {
        var filename, parsed, schema, row, col, tool, _ref, _i;
        prefix = (prefix ? prefix.slice(0, -1) : undefined);
        filename = fs.resolve(name);
        if (!filename) return skip(prefix, name);
        parsed = pparse(filename);
        schema = chext(filename, "tool");
        _ref = getPos(offset, str);
        row = _ref[0];
        col = _ref[1];
        if ((prefix && (prefix !== "base64" && prefix !== "json" && prefix !== "rag" && prefix !== "esc"))) throw new TuneError((prefix + " not valid prefix"), fs.filename, row, col);
        if (fs.exists(schema)) {
          var tool;
          tool = fs.read(schema, "utf8");
          try {
            tool = dJSON.parse(fs.read(schema));
            tool.name = parsed.name;
            assert.ok(tool.description, "no description set");
            assert.ok(tool.parameters, "no parameters set");
            assert.ok(tool.parameters.type, "no parameters.type set");
            assert.ok(tool.parameters.properties, "no parameters.properties set");
          } catch (e) {
            throw TuneError.wrap(e, schema);
          }
          tools.push({
            type: "function",
            function: tool
          });
          return "";
        } else if (prefix === "tool") {
          throw new TuneError(("schema not found for " + name), fs.filename, row, col);
        }
        if ((parsed.ext2 === ".config")) {
          payload.config = filename;
          return "";
        }
        return skip(prefix, name);
      }));
      it = text2roles(it);
      it = it.filter((function(msg) {
        return (msg.role === "system" || msg.role === "user" || msg.role === "assistant" || msg.role === "tool" || msg.role === "tool_call");
      }));

      function transformRoles(memo, item, index, arr) {
        var tcItem, toolIndex, tc, images, split;
        if ((item.role === "system" || item.role === "user" || item.role === "tool")) item.content = unescape(item.content);

        function findToolCalls() {
          var item1, _i, _ref, _len;
          _ref = memo
            .slice()
            .reverse();
          for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
            item1 = _ref[_i];
            if (item1.tool_calls) return item1;
            if ((item1.role === "user" || item1.role === "assistant")) return;
          }
          return null;
        }
        findToolCalls;
        if ((item.role === "tool_call")) {
          tcItem = findToolCalls();
          if (!tcItem) {
            tcItem = {
              role: "assistant",
              content: null,
              tool_calls: Array()
            };
            memo.push(tcItem);
          }
          tcItem.tool_calls.push({
            id: String(toolId++),
            type: "function",
            "function": text2call(item.content)
          });
        } else if (item.role === "tool") {
          tcItem = findToolCalls();
          if (!tcItem) throw "No tool_calls found for item.role 'tool'";
          toolIndex = memo.slice(memo.indexOf(tcItem))
            .reverse()
            .reduce((function(memo, item) {
              return ((item.role === "tool") ? (memo + 1) : memo);
            }), 0);
          tc = tcItem.tool_calls[toolIndex];
          item.tool_call_id = tc.id;
          item.name = tc.function.name;
          memo.push(item);
        } else if (item.role === "user") {
          var images;
          var split;
          images = [];
          split = "<split-string-#sdf12kdf2>";

          function replaceImage(_, prefix, name) {
            var filename, parsed, _ref;
            var filename;
            filename = fs.resolve(name);
            if (!filename) return skip(prefix, name);
            var parsed;
            var prefix;
            parsed = path.parse(filename);
            prefix = (prefix ? prefix.slice(0, -1) : undefined);
            if (((prefix === "image") || (parsed.ext === ".jpg" || parsed.ext === ".png" || parsed.ext === ".webp"))) {
              images.push(filename);
              return _ref = split;
            } else {
              return _ref = skip(prefix, name);
            }
            return _ref;
          }
          item.content = item.content.replace(re, replaceImage);
          if (images.length) item.content = item.content
            .split(split)
            .reduce((function(m, item, index) {
              if (item.trim()) m.push({
                type: "text",
                text: item
              });
              (function(it) {
                return (it ? (function(ext, mimetype, base64) {
                  var _ref;
                  ext = path.parse(it).ext;
                  switch (ext) {
                    case ".jpg":
                      _ref = "image/jpeg";
                      break;
                    case ".png":
                      _ref = "image/png";
                      break;
                    case ".webp":
                      _ref = "image/webp";
                      break;
                    default:
                      _ref = undefined;
                  }
                  mimetype = _ref;
                  base64 = fs.read(it)
                    .toString("base64");
                  return m.push({
                    type: "image_url",
                    image_url: {
                      url: "data:" + mimetype + ";base64," + base64
                    }
                  });
                })() : undefined);
              })(images[index]);
              return m;
            }), []);
          memo.push(item);
        } else {
          memo.push(item);
        }
        return memo;
      }
      it = it.reduce(transformRoles, Array());
      return it;
    })(chat2expand(text, fs, opts));
    if (tools.length) payload.tools = tools;
    return payload;
  })({}, 0, [], /{(\w+:)?([~\.\-\w\s/]+)}/g);
}
text2api;

function payload2api(payload, ctx) {
  var configFile, config;
  var configFile;
  var config;
  configFile = payload.config;
  config = undefined;
  if (!configFile) configFile = ctx.resolve("default.config");
  if (!configFile) throw new TuneError("default.config.js file not found", ctx.filename);
  var config;
  config = ctx.read(configFile, "utf8");
  delete payload.config;
  ctx = ctx.clone(configFile, {
    payload: payload
  });
  try {
    config = vm.runInNewContext(config, Object.assign({}, ctx.env), {
      filename: configFile
    });
  } catch (e) {
    throw TuneError.wrap(e, ctx.filename);
  }
  return config;
}
payload2api;

function openai2claude(payload) {
  var msg, item, _i, _ref, _len, _i0, _res, _ref0, _len0, _ref1;
  _ref = payload.messages;
  for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
    msg = _ref[_i];
    if (Array.isArray(msg.content)) {
      _res = [];
      _ref0 = msg.content;
      for (_i0 = 0, _len0 = _ref0.length; _i0 < _len0; ++_i0) {
        item = _ref0[_i0];
        switch (item.type) {
          case "image_url":
            _ref1 = {
              type: "image",
              source: (function(it) {
                it.media_type = item.image_url.url.substring(5, item.image_url.url.indexOf(";base64,"));
                it.data = item.image_url.url.substring(8 + item.image_url.url.indexOf(";base64,"));
                return it;
              })({
                type: "base64"
              })
            }
            break;
          default:
            _ref1 = item;
        }
        if (typeof _ref1 !== 'undefined') _res.push(_ref1);
      }
      msg.content = _res;
    }
  }(function(it) {
    var _ref2;
    it = it.filter((function(item) {
      return (item.role === "system");
    }));
    it = it.map((function() {
      return arguments[0].content;
    }));
    if (it.length) {
      payload.system = it.join("\n");
      _ref2 = (payload.messages = payload.messages.filter((function(item) {
        return (item.role !== "system");
      })));
    } else {
      _ref2 = undefined;
    }
    it = _ref2;
    return it;
  })(payload.messages);
  payload.messages = (function(it) {
    var _i1, _res0, _ref2, _len1, _ref3;
    _res0 = [];
    _ref2 = it;
    for (_i1 = 0, _len1 = _ref2.length; _i1 < _len1; ++_i1) {
      msg = _ref2[_i1];
      if (msg.tool_calls) {
        msg.content = (function(it) {
          it = it.concat(msg.tool_calls.map((function(tc) {
            return {
              type: "tool_use",
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments)
            }
          })));
          return it;
        })((msg.content ? Array({
          type: "text",
          text: msg.content
        }) : []));
        delete msg.tool_calls;
        _ref3 = msg;
      } else if (msg.role === "tool") {
        _ref3 = {
          role: "user",
          content: Array({
            type: "tool_result",
            tool_use_id: msg.tool_call_id,
            content: msg.content
          })
        }
      } else {
        _ref3 = msg;
      }
      if (typeof _ref3 !== 'undefined') _res0.push(_ref3);
    }
    it = _res0;
    it = it.reduce((function(memo, msg, index) {
      var lastMsg;
      lastMsg = memo["slice"](-1)[0];
      if ((!lastMsg || (lastMsg.role !== msg.role))) return memo.concat(Array(msg));
      if (!Array.isArray(lastMsg.content)) lastMsg.content = Array({
        type: "text",
        text: lastMsg.content
      });
      if (!Array.isArray(msg.content)) msg.content = Array({
        type: "text",
        text: msg.content
      });
      lastMsg.content = lastMsg.content.concat(msg.content);
      return memo;
    }), []);
    return it;
  })(payload.messages);
  if (payload.tools) payload.tools = payload.tools.map((function(tool) {
    return (function(it) {
      it.input_schema = it.parameters;
      delete it.parameters;
      return it;
    })(tool.function);
  }));
  return payload;
}
openai2claude;
async function toolCall(text, tools, ctx, res, finish) {
  finish = false;
  res = await Promise.all(text2roles(text, true)
    .reduce((function(memo, item, index, arr) {
      if (finish) return memo;
      item = arr[arr.length - index - 1];
      (item.role === "tool_call") ? memo.push(item): finish = true;
      return memo;
    }), [])
    .map((async function(item) {
      var tc;
      var res;
      res;
      try {
        tc = text2call(item.content);
      } catch (e) {
        throw TuneError.wrap(e, ctx.filename, item.row, item.col);
      }
      if (!tools[tc.name]) throw new TuneError(("tool '" + tc.name + "' not found"), ctx.filename, item.row, item.col);
      res = await tools[tc.name](JSON.parse(tc.arguments), ctx);
      async function transformRes(res) {
        var i, fname, tofile, filest, parsed, _ref;
        var i;
        i = 0;
        var fname;
        fname;
        var tofile;
        tofile = false;
        if (Buffer.isBuffer(res)) {
          tofile = true;
        } else if ((typeof res === "string" || typeof res === "number" || typeof res === "boolean" || typeof res === "undefined") || (res instanceof String) || (res === null)) {
          res = String(res);
          tofile = res.length > 1000;
        } else if (Array.isArray(res)) {
          res
            .map(transformRes)
            .join("\n");
        } else {
          res = util.inspect(res);
        }
        if (tofile) {
          filest = ctx.resolve(".filest");
          fname = await (async function(it) {
            it = ((typeof makeFilename !== 'undefined') ? await makeFilename(extend(tc, {
              result: res
                .slice(0, 100)
                .toString("utf8"),
              result_hex: res
                .slice(0, 100)
                .toString("hex"),
              conventions: (filest ? ctx.read(filest, "utf8") : "no conventions"),
              contextFilename: ctx.top.filename
            }), ctx) : JSON.stringify({
              filename: "content"
            }));
            it = JSON.parse(it);
            it = it.filename.trim();
            return it;
          }).call(this);
          parsed = path.parse(fname);
          while (ctx.exists(fname)) {
            fname = path.join(parsed.dir, parsed.name + i + parsed.ext);
            i += 1;
          }
          ctx.write(path.resolve(ctx.top.cwd, fname), res);
          parsed = path.parse(fname);
          _ref = ("{" + path.join(parsed.dir, parsed.name) + "}");
        } else {
          _ref = res;
        }
        return _ref;
      }
      transformRes;
      return transformRes(res);
    })));
  return res.reverse()
    .map((function(item) {
      return ("tr: " + item);
    }))
    .join("\n");
}
toolCall;
vm = require("vm");

function makeTool(filename, ctx) {
  var parsed, tool, text, it, src, script, _ref;
  var parsed;
  var tool;
  parsed = pparse(filename);
  tool = undefined;
  ctx = ctx.clone(filename);
  try {
    if ((parsed.ext === ".chat")) {
      var text;
      text = chat2expand(ctx.read(filename, "utf8"), ctx, {
        skipNotFound: true
      });
      it = text2roles(text);
      it = it.filter((function() {
        return (arguments[0].role === "system" || arguments[0].role === "user" || arguments[0].role === "assistant");
      }));
      it = (((it.length === 0) || ("user" !== it["slice"](-1)[0].role)) ? (text += "\nu: {text}") : undefined);
      _ref = tool = (async function(args, ictx) {
        var res;
        var res;
        res = await text2run(text, ctx.clone(filename, args), true);
        res = text2roles(res);
        return res["slice"](-1)[0].content;
      });
    } else if (parsed.ext === ".mjs") {
      _ref = tool = (async function(args, ictx) {
        var module;
        var module;
        module = await import(filename + "?t=" + Date.now());
        return module.default.apply(ctx, [args, ctx]);
      });
    } else if (parsed.ext === ".js") {
      var src;
      var script;
      src = ctx.read(filename, "utf8");
      script = new vm.Script(src, {
        filename: filename
      });
      _ref = tool = (function(args, ictx) {
        var c, key, value, _ref0, _len;
        var c;
        c = {
          require: require,
          fetch: fetch
        };
        _ref0 = args;
        for (key in _ref0) {
          value = _ref0[key];
          c[key] = value;
        }
        return script.runInNewContext(c);
      });
    } else {
      _ref = undefined;
    }
    _ref;
  } catch (e) {
    throw TuneError.wrap(e, filename);
  }
  if (!tool) throw new TuneError(("cant make tool out of " + parsed.ext + " only .mjs .js and .chat extensios are supported" + filename));
  return (async function(args, ictx) {
    var _ref0;
    try {
      _ref0 = await tool(args, ictx);
    } catch (e) {
      throw TuneError.wrap(e, filename);
    }
    return _ref0;
  });
}
makeTool;
path = require("path");
try {
  makeSchema = makeTool(path.resolve(__dirname, "schema.tool.chat"), makeContext(process.env, require("fs"), __filename));
  makeFilename = makeTool(path.resolve(__dirname, "filename.tool.chat"), makeContext(process.env, require("fs"), __filename));
} catch (e) {
  console.log(e.toString());
}
async function text2run(text, ctx, multiTurn) {
  var re, tools, executeLoop, result, payload, configFile, config, logDir, logFile, parsed, res;
  if (!ctx) throw Error("no context specified");
  re = /{(\w+:)?([~\.\-\w\s/]+)}/g;
  tools = {};
  executeLoop = true;
  vars = [];
  result = "";
  (function(it) {
    it = text2roles(it);
    it = it.map((function(item) {
      if ((item.role === "system" || item.role === "user" || item.role === "tool")) item.content.replace(re, (function(_, prefix, name, offset, str) {
        var row, col, _ref, _i;
        _ref = getPos(offset, str);
        row = _ref[0];
        col = _ref[1];
        return vars.push(Array((prefix ? prefix.slice(0, -1) : undefined), name, row, col));
      }));
      return item;
    }));
    return it;
  })(text);
  await _afor((function(arr, idx) {
    arr = vars;
    idx = 0;
    return (function(res) {
      var _ref;
      if ((idx < arr.length)) {
        res = Array(arr[idx], idx);
        idx++;
        _ref = res;
      } else {
        _ref = undefined;
      }
      return _ref;
    });
  }), (async function(item, i) {
    var name, prefix, filename, parsed, schema, schemaExists, body, _ref, _ref0;
    try {
      var name;
      var prefix;
      var filename;
      name = item[1];
      prefix = item[0];
      filename = ctx.resolve(name);
      if (!filename) throw new TuneError(("'" + name + "' not found"), ctx.filename, item[2], item[3]);
      var parsed;
      var schema;
      var schemaExists;
      parsed = pparse(filename);
      schema = chext(filename, "tool");
      schemaExists = ctx.exists(schema);
      if ((schemaExists || (parsed.ext2 === ".tool"))) {
        filename = ["mjs", "js", "chat"]
          .map((function() {
            return chext(filename, "tool." + arguments[0]);
          }))
          .find((function() {
            return ctx.exists(arguments[0]);
          }));
        if (!filename) throw new TuneError(("tool " + name + ".js/mjs/chat not found"), ctx.filename, item[2], item[3]);
        if (!schemaExists) {
          if ((typeof makeSchema !== 'undefined')) {
            body = await makeSchema({
              text: ctx.read(filename, "utf8")
            }, ctx);
            ctx.write(schema, body);
          } else {
            throw new TuneError(("tool schema for " + name + " not found"), ctx.filename, item[2], item[3]);
          }
        }
        _ref = tools[pparse(filename).name] = makeTool(filename, ctx);
      } else {
        _ref = undefined;
      }
      _ref0 = _ref;
    } catch (e) {
      throw TuneError.wrap(e, ctx.filename, item[2], item[3]);
    }
    return _ref0;
  }));
  (function(it) {
    var _ref;
    if (it) {
      result += ("\n" + it);
      _ref = (!multiTurn ? (executeLoop = false) : undefined);
    } else {
      _ref = undefined;
    }
    return _ref;
  })(await toolCall(text, tools, ctx));
  while (executeLoop) {
    executeLoop = false;
    payload = text2api(text + result, ctx);
    configFile = ctx.resolve(payload.config || "default.config");
    config = payload2api(payload, ctx);
    logDir = ctx.resolve("TUNE_LOG");
    logFile = undefined;
    if ((logDir && ctx.filename)) {
      var parsed;
      parsed = path.parse(ctx.filename);
      logFile = path.resolve(ctx.read(logDir), parsed.base + "_payload_" + new Date()
        .getTime() + ".json");
      ctx.write(logFile, JSON.stringify(config, null, "  "));
    }
    try {
      res = await http(config);
      if ((((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.error !== "undefined") && (res.error !== null) && !Number.isNaN(res.error)) ? res.error : undefined)) throw new TuneError(tpl("{type: }{message}", res.error), configFile, undefined, undefined, (logFile ? [{
        filename: logFile
      }] : undefined));
      res = (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.choices !== "undefined") && (res.choices !== null) && !Number.isNaN(res.choices) && (typeof res.choices[0] !== "undefined") && (res.choices[0] !== null) && !Number.isNaN(res.choices[0]) && (typeof res.choices[0].message !== "undefined") && (res.choices[0].message !== null) && !Number.isNaN(res.choices[0].message)) ? res.choices[0].message : (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res)) ? res : undefined));
    } catch (e) {
      throw TuneError.wrap(e, ctx.filename);
    }
    res = msg2text(res);
    result += ("\n" + res);
    if (multiTurn)(function(it) {
      var _ref;
      if (it) {
        executeLoop = true;
        _ref = (result += ("\n" + it));
      } else {
        _ref = undefined;
      }
      return _ref;
    })(await toolCall(text + result, tools, ctx));
  }
  return result.trim();
}
text2run;

function text2stream(text, ctx, multiTurn) {
  return (function(re, tools, executeLoop, vars, result, msgs) {
    re = /{(\w+:)?([~\.\w\-\s/]+)}/g;
    tools = {};
    executeLoop = true;
    vars = [];
    result = [];
    msgs = [];
    return (function(it) {
      (async function() {
        var payload, configFile, config, logDir, logFile, parsed, res, chunk, msg, delta, ready, tc, _ref, _err, _ref0;
        try {
          it[Symbol.asyncIterator] = it;
          (function(it) {
            it = text2roles(it);
            it = it.map((function(item) {
              if ((item.role === "system" || item.role === "user" || item.role === "tool")) item.content.replace(re, (function(_, prefix, name, offset, str) {
                var row, col, _ref, _i;
                _ref = getPos(offset, str);
                row = _ref[0];
                col = _ref[1];
                return vars.push(Array((prefix ? prefix.slice(0, -1) : undefined), name, row, col));
              }));
              return item;
            }));
            return it;
          })(text);
          await _afor((function(arr, idx) {
            arr = vars;
            idx = 0;
            return (function(res) {
              var _ref;
              if ((idx < arr.length)) {
                res = Array(arr[idx], idx);
                idx++;
                _ref = res;
              } else {
                _ref = undefined;
              }
              return _ref;
            });
          }), (async function(item, i) {
            var name, prefix, filename, schema, parsed, schemaExists, body, _ref, _ref0;
            try {
              var name;
              var prefix;
              var filename;
              name = item[1];
              prefix = item[0];
              filename = ctx.resolve(name);
              if (!filename) throw new TuneError(("'" + name + "' not found"), ctx.filename, item[2], item[3]);
              var schema;
              var parsed;
              var schemaExists;
              schema = chext(filename, "tool");
              parsed = pparse(filename);
              schemaExists = ctx.exists(schema);
              if ((schemaExists || (parsed.ext2 === ".tool"))) {
                filename = ["mjs", "js", "chat", "http"]
                  .map((function() {
                    return chext(filename, "tool." + arguments[0]);
                  }))
                  .find((function() {
                    return ctx.exists(arguments[0]);
                  }));
                if (!filename) throw new TuneError(("tool " + name + ".tool.js/mjs/chat/http not found"), ctx.filename, item[2], item[3]);
                if (!schemaExists) {
                  if ((typeof makeSchema !== 'undefined')) {
                    body = await makeSchema({
                      text: ctx.read(filename, "utf8")
                    }, ctx);
                    ctx.write(schema, body);
                  } else {
                    throw new TuneError(("tool schema for " + name + " not found"), ctx.filename, item[2], item[3]);
                  }
                }
                _ref = tools[pparse(filename).name] = makeTool(filename, ctx);
              } else {
                _ref = undefined;
              }
              _ref0 = _ref;
            } catch (e) {
              throw TuneError.wrap(e, ctx.filename, item[2], item[3]);
            }
            return _ref0;
          }));
          (function(it) {
            var _ref;
            if (it) {
              result.push(it);
              msgs = [result];
              _ref = (!multiTurn ? (executeLoop = false) : undefined);
            } else {
              _ref = undefined;
            }
            return _ref;
          })(await toolCall(text, tools, ctx));
          while (executeLoop) {
            executeLoop = false;
            payload = text2api(text + result, ctx);
            configFile = ctx.resolve(payload.config || "default.config");
            payload.stream = true;
            config = payload2api(payload, ctx);
            logDir = ctx.resolve("TUNE_LOG");
            logFile = undefined;
            if ((logDir && ctx.filename)) {
              var parsed;
              parsed = path.parse(ctx.filename);
              logFile = path.resolve(ctx.read(logDir), parsed.base + "_payload_" + new Date()
                .getTime() + ".json");
              ctx.write(logFile, JSON.stringify(config, null, "  "));
            }
            try {
              res = await http(config);
              chunk = {
                done: false
              };
              msg = {
                role: "assistant",
                content: null
              };
              if ((((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.error !== "undefined") && (res.error !== null) && !Number.isNaN(res.error)) ? res.error : undefined)) {
                _ref = undefined;
                throw new TuneError(tpl("{type: }{message}", res.error), configFile, undefined, undefined, (logFile ? [{
                  filename: logFile
                }] : undefined));
              } else {
                _ref = undefined;
              }
              _ref;
            } catch (e) {
              throw TuneError.wrap(e, ctx.filename);
            }
            if (res[Symbol.asyncIterator]) {
              while (!chunk.done) {
                chunk = await res.next();
                delta = (((typeof chunk !== "undefined") && (chunk !== null) && !Number.isNaN(chunk) && (typeof chunk.value !== "undefined") && (chunk.value !== null) && !Number.isNaN(chunk.value) && (typeof chunk.value.choices !== "undefined") && (chunk.value.choices !== null) && !Number.isNaN(chunk.value.choices) && (typeof chunk.value.choices[0] !== "undefined") && (chunk.value.choices[0] !== null) && !Number.isNaN(chunk.value.choices[0]) && (typeof chunk.value.choices[0].delta !== "undefined") && (chunk.value.choices[0].delta !== null) && !Number.isNaN(chunk.value.choices[0].delta)) ? chunk.value.choices[0].delta : (((typeof chunk !== "undefined") && (chunk !== null) && !Number.isNaN(chunk) && (typeof chunk.message !== "undefined") && (chunk.message !== null) && !Number.isNaN(chunk.message)) ? chunk.message : (((typeof {} !== "undefined") && ({} !== null) && !Number.isNaN({})) ? {} : undefined)));
                ready = false;
                if (delta.content) {
                  msg.content = msg.content || "";
                  msg.content += delta.content;
                  ready = true;
                } else if (delta.tool_calls) {
                  msg.tool_calls = msg.tool_calls || [];
                  tc = delta.tool_calls[0];
                  msg.tool_calls[tc.index] = msg.tool_calls[tc.index] || tc;
                  msg.tool_calls[tc.index].function.arguments += tc.function.arguments;
                  ready = true;
                }
                if (ready) {
                  try {
                    msgs = Array(result.concat(Array(msg2text(msg))));
                  } catch (_err) {}
                }
              }
              result = result.concat(Array(msg2text(msg)));
            } else {
              res = (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.choices !== "undefined") && (res.choices !== null) && !Number.isNaN(res.choices) && (typeof res.choices[0] !== "undefined") && (res.choices[0] !== null) && !Number.isNaN(res.choices[0]) && (typeof res.choices[0].message !== "undefined") && (res.choices[0].message !== null) && !Number.isNaN(res.choices[0].message)) ? res.choices[0].message : (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res)) ? res : undefined));
              result.push(res);
              msgs = [result];
            }
            if (multiTurn)(function(it) {
              var _ref0;
              if (it) {
                executeLoop = true;
                result.push(it);
                _ref0 = (msgs = [result]);
              } else {
                _ref0 = undefined;
              }
              return _ref0;
            })(await toolCall(text + "\n" + result.join("\n"), tools, ctx));
          }
          _ref0 = msgs.push(null);
        } catch (e) {
          _ref0 = (msgs = Array(TuneError.wrap(e, ctx.filename)));
        }
        return _ref0;
      })();
      return it;
    })({
      next: (async function() {
        var msg, _ref, _ref0;
        if (!msgs.length) await _once((function() {
          return msgs.length;
        }), (function() {
          return undefined;
        }));
        msg = msgs.shift();
        if ((((typeof msg !== "undefined") && (msg !== null) && !Number.isNaN(msg) && (typeof msg.message !== "undefined") && (msg.message !== null) && !Number.isNaN(msg.message)) ? msg.message : undefined)) throw msg;
        if (msg) {
          if (Array.isArray(msg)) {
            _ref = msg.join("\n");
          } else if (typeof msg === "string") {
            _ref = msg;
          } else {
            _ref = JSON.stringify(msg, null, "  ");
          }
          _ref0 = {
            value: _ref,
            done: false
          }
        } else {
          _ref0 = {
            value: undefined,
            done: true
          }
        }
        return _ref0;
      })
    });
  })();
}
text2stream;

function msg2text(msg) {
  var _ref, _ref0;
  switch (msg.role) {
    case "user":
      if (((typeof msg.content === "string") || (msg.content instanceof String))) {
        _ref0 = ("u: " + msg.content);
      } else if (Array.isArray(msg.content)) {
        _ref0 = msg.content
          .map((function(item) {
            var _ref1;
            switch (item.type) {
              case "text":
                _ref1 = ("u: " + item.text);
                break;
              case "tool_result":
                _ref1 = ("tr: " + item.content);
                break;
              default:
                _ref1 = undefined;
                throw new Error(("unsupported user content type: " + item.type));
            }
            return _ref1;
          }))
          .join("\n");
      } else {
        _ref0 = undefined;
      }
      _ref = _ref0;
      break;
    case "assistant":
      _ref = (function(res) {
        var tres, _ref1;
        if (((typeof msg.content === "string") || (msg.content instanceof String))) {
          res = "a: " + msg.content;
        } else if (Array.isArray(msg.content)) {
          res = msg.content
            .map((function(item) {
              var _ref1;
              switch (item.type) {
                case "text":
                  _ref1 = ("a: " + item.text);
                  break;
                case "tool_use":
                  _ref1 = tpl("tc: {name} {args}", {
                    name: item.name,
                    args: (function(it) {
                      it = ((it.text && (1 === Object.keys(it).length)) ? it.text : JSON.stringify(it));
                      return it;
                    })(item.input)
                  });
                  break;
                default:
                  _ref1 = undefined;
                  throw new Error(("unsupported user content type: " + item.type));
              }
              return _ref1;
            }))
            .join("\n");
        }
        if (msg.tool_calls) tres = msg.tool_calls
          .map((function(tc) {
            var args, text;
            var args;
            var text;
            args = dJSON.parse(tc.function.arguments);
            text = args.text;
            delete args.text;
            args = (Object.keys(args).length ? JSON.stringify(args) : undefined);
            return tpl("tc: {name}{ args}{\ntext}", {
              name: tc.function.name,
              args: args,
              text: text
            });
          }))
          .join("\n");
        if ((res && tres)) {
          _ref1 = (res + "\n" + tres);
        } else if (tres) {
          _ref1 = tres;
        } else {
          _ref1 = res;
        }
        return _ref1;
      })("");
      break;
    case "tool":
      _ref = ("tr: " + msg.content);
      break;
    case "error":
      _ref = ("error: " + msg.content);
      break;
    default:
      _ref = undefined;
  }
  return _ref;
}
msg2text;

function msg2role(msg) {
  return (((msg.role === "assistant") && msg.tool_calls) ? msg.tool_calls
    .map((function(tc) {
      return {
        role: "tool_call",
        content: " " + tc.function.name + " " + tc.function.arguments
      }
    })) : Array({
      role: msg.role,
      content: " " + msg.content
    }));
}
msg2role;

function escape(text) {
  return String((((typeof text !== "undefined") && (text !== null) && !Number.isNaN(text)) ? text : (((typeof "" !== "undefined") && ("" !== null) && !Number.isNaN("")) ? "" : undefined)))
    .replace(/{(\s*\w+\s*)}/g, "{!$1}")
    .replace(/^(s|u|a|c|tr|tc|error):/gm, " $1:");
}
escape;

function unescape(text) {
  return String((((typeof text !== "undefined") && (text !== null) && !Number.isNaN(text)) ? text : (((typeof "" !== "undefined") && ("" !== null) && !Number.isNaN("")) ? "" : undefined)))
    .replace(/{!(\s*\w+\s*)}/g, "{$1}")
    .replace(/^\s(s|u|a|c|tr|tc|error):/gm, "$1:");
}
unescape;

function text2cut(text, cursor) {
  return (function(line) {
    return (function(it) {
      it = it.map((function(item) {
        item.start = line;
        line = line + item.content.split("\n").length;
        item.end = line;
        if (((item.role === "comment") && item.content.match(/^\s*\-{3,}\s*$/))) item.delim = true;
        return item;
      }));
      it = it.reduce((function(memo, item, index) {
        if (item.delim) {
          if (((cursor < item.end) && (cursor >= item.start))) {
            memo = {
              start: item.start,
              mid: item.start,
              end: item.start
            };
          } else if (item.end <= cursor) {
            memo.start = item.end;
          } else if ((cursor < item.start) && (item.end < memo.end)) {
            memo.end = item.start;
          }
        } else if ((item.start <= cursor) && (item.end >= cursor)) {
          memo.mid = item.end;
        }
        return memo;
      }), {
        start: it[0].start,
        mid: cursor,
        end: it["slice"](-1)[0].end
      });
      return it;
    })(text2roles(text));
  })(0);
}
text2cut;

function tpl(str) {
  var _i;
  var params = 2 <= arguments.length ? [].slice.call(arguments, 1, _i = arguments.length - 0) : (_i = 1, []);
  return (function(paramIndex, params) {
    var _ref;
    try {
      _ref = str.replace(/{(\W*)(\w*)(\W*)}/gm, (function(_, pre, name, post) {
        return (function(res) {
          paramIndex += 1;
          return (res ? ((pre || "") + res + (post || "")) : "");
        })(params[name || paramIndex]);
      }));
    } catch (e) {
      _ref = console.log.apply(console, [].concat([e, str]).concat(params));
    }
    return _ref;
  })(0, (((typeof params[0] === "object") && (params.length === 1)) ? params[0] : params));
}
tpl;

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

function pick(obj) {
  var _i;
  var props = 2 <= arguments.length ? [].slice.call(arguments, 1, _i = arguments.length - 0) : (_i = 1, []);
  return (function(it) {
    var prop, _i0, _ref, _len;
    _ref = props;
    for (_i0 = 0, _len = _ref.length; _i0 < _len; ++_i0) {
      prop = _ref[_i0];
      it[prop] = obj[prop];
    }
    return it;
  })({});
}
pick;
fs = require("fs");
assert = require("node:assert/strict");
util = require("util");
path = require("path");
exports.makeContext = makeContext;
exports.env2vars = env2vars;
exports.text2roles = text2roles;
exports.roles2text = roles2text;
exports.text2call = text2call;
exports.text2expand = text2expand;
exports.chat2expand = chat2expand;
exports.text2api = text2api;
exports.payload2api = payload2api;
exports.toolCall = toolCall;
exports.makeTool = makeTool;
exports.text2run = text2run;
exports.text2stream = text2stream;
exports.msg2text = msg2text;
exports.msg2role = msg2role;
exports.text2cut = text2cut;
exports.TuneError = TuneError;
exports.pparse = pparse;
exports.text2var = text2var;