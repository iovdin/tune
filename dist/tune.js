var $roles, fs, assert, util;

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

function AsyncIter() {
  return (this[Symbol.asyncIterator] = this);
}
AsyncIter;
AsyncIter.prototype.next = (async function() {
  var self, result;
  var self;
  self = this;
  await _once((function() {
    return (!!self.err || !!self.result);
  }), (function() {
    return undefined;
  }));
  var result;
  result = self.result;
  self.result = undefined;
  if (self.err) throw self.err;
  return result;
});

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
  this._stack = stack;
  this.error = originalError;
  return this;
}
TuneError;
TuneError.prototype = Object.create(Error.prototype);
TuneError.prototype.constructor = TuneError;
TuneError.wrap = (function(err, filename, row, col) {
  return ((err.name === "TuneError") ? new TuneError(err.message, filename, row, col, err._stack, err.error) : new TuneError("Internal Error", filename, row, col, undefined, err));
});
TuneError.ctx2stack = (function(ctx) {
  return ctx.stack.map((function(item) {
    return {
      filename: item.filename,
      row: item.row,
      col: item.col
    }
  }));
});
TuneError.prototype.toString = (function() {
  return this.stack;
});
Object.defineProperty(TuneError.prototype, "stack", {
  get: (function() {
    return ("TuneError: " + this.message + "\n" + (this._stack || [])
      .map((function() {
        return ("    at " + arguments[0].filename + (((typeof arguments !== 'undefined') && (typeof arguments[0] !== 'undefined') && (typeof arguments[0].row !== 'undefined')) ? (":" + arguments[0].row) : "") + (((typeof arguments !== 'undefined') && (typeof arguments[0] !== 'undefined') && (typeof arguments[0].col !== 'undefined')) ? (":" + arguments[0].col) : ""));
      }))
      .join("\n") + (this.error ? (this.error.stack ? ("\n" + this.error.stack) : this.error.message) : ""));
  })
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
      });
    },
    j = (e, r, u, t) => {
      if ((r && typeof r == "object") || typeof r == "function")
        for (let i of xe(r))
          !ge.call(e, i) &&
          i !== u &&
          N(e, i, {
            get: () => r[i],
            enumerable: !(t = ye(r, i)) || t.enumerable,
          });
      return e;
    },
    U = (e, r, u) => (j(e, r, "default"), u && j(u, r, "default")),
    H = (e, r, u) => (
      (u = e != null ? de(Ee(e)) : {}),
      j(
        r || !e || !e.__esModule ?
        N(u, "default", {
          value: e,
          enumerable: !0
        }) :
        u,
        e,
      )
    ),
    Fe = (e) => j(N({}, "__esModule", {
      value: !0
    }), e);
  var P = c((We, D) => {
    typeof D == "object" && typeof D.exports == "object" && (D.exports = Y);
    Y.defunct = function(e) {
      throw new Error(
        "Unexpected character at index " + (this.index - 1) + ": " + e,
      );
    };

    function Y(e) {
      typeof e != "function" && (e = Y.defunct);
      var r = [],
        u = [],
        t = 0;
      (this.state = 0),
      (this.index = 0),
      (this.input = ""),
      (this.addRule = function(n, v, x) {
        var y = n.global;
        if (!y) {
          var E = "g";
          n.multiline && (E += "m"),
            n.ignoreCase && (E += "i"),
            (n = new RegExp(n.source, E));
        }
        return (
          Object.prototype.toString.call(x) !== "[object Array]" && (x = [0]),
          u.push({
            pattern: n,
            global: y,
            action: v,
            start: x
          }),
          this
        );
      }),
      (this.setInput = function(n) {
        return (
          (t = 0),
          (this.state = 0),
          (this.index = 0),
          (r.length = 0),
          (this.input = n),
          this
        );
      }),
      (this.lex = function() {
        if (r.length) return r.shift();
        for (this.reject = !0; this.index <= this.input.length;) {
          for (
            var n = i.call(this).splice(t), v = this.index; n.length && this.reject;

          ) {
            var x = n.shift(),
              y = x.result,
              E = x.length;
            (this.index += E), (this.reject = !1), t++;
            var f = x.action.apply(this, y);
            if (this.reject) this.index = y.index;
            else if (typeof f < "u")
              switch (Object.prototype.toString.call(f)) {
                case "[object Array]":
                  (r = f.slice(1)), (f = f[0]);
                default:
                  return E && (t = 0), f;
              }
          }
          var F = this.input;
          if (v < F.length)
            if (this.reject) {
              t = 0;
              var f = e.call(this, F.charAt(this.index++));
              if (typeof f < "u")
                return Object.prototype.toString.call(f) === "[object Array]" ?
                  ((r = f.slice(1)), f[0]) :
                  f;
            } else this.index !== v && (t = 0), (this.reject = !0);
          else if (n.length) this.reject = !0;
          else break;
        }
      });

      function i() {
        for (
          var n = [],
            v = 0,
            x = this.state,
            y = this.index,
            E = this.input,
            f = 0,
            F = u.length; f < F; f++
        ) {
          var h = u[f],
            T = h.start,
            p = T.length;
          if (!p || T.indexOf(x) >= 0 || (x % 2 && p === 1 && !T[0])) {
            var o = h.pattern;
            o.lastIndex = y;
            var s = o.exec(E);
            if (s && s.index === y) {
              var d = n.push({
                result: s,
                action: h.action,
                length: s[0].length,
              });
              for (h.global && (v = d); --d > v;) {
                var a = d - 1;
                if (n[d].length > n[a].length) {
                  var _ = n[d];
                  (n[d] = n[a]), (n[a] = _);
                }
              }
            }
          }
        }
        return n;
      }
    }
  });
  var k = c(() => {
    String.fromCodePoint ||
      (function() {
        var e = (function() {
            try {
              var i = {},
                n = Object.defineProperty,
                v = n(i, i, i) && n;
            } catch {}
            return v;
          })(),
          r = String.fromCharCode,
          u = Math.floor,
          t = function(i) {
            var n = 16384,
              v = [],
              x,
              y,
              E = -1,
              f = arguments.length;
            if (!f) return "";
            for (var F = ""; ++E < f;) {
              var h = Number(arguments[E]);
              if (!isFinite(h) || h < 0 || h > 1114111 || u(h) != h)
                throw RangeError("Invalid code point: " + h);
              h <= 65535 ?
                v.push(h) :
                ((h -= 65536),
                  (x = (h >> 10) + 55296),
                  (y = (h % 1024) + 56320),
                  v.push(x, y)),
                (E + 1 == f || v.length > n) &&
                ((F += r.apply(null, v)), (v.length = 0));
            }
            return F;
          };
        e
          ?
          e(String, "fromCodePoint", {
            value: t,
            configurable: !0,
            writable: !0,
          }) :
          (String.fromCodePoint = t);
      })();
  });
  var re = c((V, ee) => {
    "use strict";
    Object.defineProperty(V, "__esModule", {
      value: !0
    });
    V.default = void 0;
    k();
    var Le =
      /\\(u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|(['"tbrnfv0\\]))|\\U([0-9A-Fa-f]{8})/g,
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
        "\\": "\\",
      },
      K = function(r) {
        return String.fromCodePoint(parseInt(r, 16));
      },
      we = function(r) {
        return String.fromCodePoint(parseInt(r, 8));
      },
      _e = function(r) {
        return r.replace(Le, function(u, t, i, n, v, x, y, E) {
          return i !== void 0 ?
            K(i) :
            n !== void 0 ?
            K(n) :
            v !== void 0 ?
            K(v) :
            x !== void 0 ?
            we(x) :
            E !== void 0 ?
            K(E) :
            Re[y];
        });
      };
    V.default = _e;
    ee.exports = V.default;
  });
  var ue = c((J) => {
    (function(e) {
      var r = String.fromCharCode;

      function u(p) {
        for (var o = [], s = 0, d = p.length, a, _; s < d;)
          (a = p.charCodeAt(s++)),
          a >= 55296 && a <= 56319 && s < d ?
          ((_ = p.charCodeAt(s++)),
            (_ & 64512) == 56320 ?
            o.push(((a & 1023) << 10) + (_ & 1023) + 65536) :
            (o.push(a), s--)) :
          o.push(a);
        return o;
      }

      function t(p) {
        for (var o = p.length, s = -1, d, a = ""; ++s < o;)
          (d = p[s]),
          d > 65535 &&
          ((d -= 65536),
            (a += r(((d >>> 10) & 1023) | 55296)),
            (d = 56320 | (d & 1023))),
          (a += r(d));
        return a;
      }

      function i(p) {
        if (p >= 55296 && p <= 57343)
          throw Error(
            "Lone surrogate U+" +
            p.toString(16).toUpperCase() +
            " is not a scalar value",
          );
      }

      function n(p, o) {
        return r(((p >> o) & 63) | 128);
      }

      function v(p) {
        if (!(p & 4294967168)) return r(p);
        var o = "";
        return (
          p & 4294965248 ?
          p & 4294901760 ?
          p & 4292870144 ||
          ((o = r(((p >> 18) & 7) | 240)),
            (o += n(p, 12)),
            (o += n(p, 6))) :
          (i(p), (o = r(((p >> 12) & 15) | 224)), (o += n(p, 6))) :
          (o = r(((p >> 6) & 31) | 192)),
          (o += r((p & 63) | 128)),
          o
        );
      }

      function x(p) {
        for (var o = u(p), s = o.length, d = -1, a, _ = ""; ++d < s;)
          (a = o[d]), (_ += v(a));
        return _;
      }

      function y() {
        if (h >= F) throw Error("Invalid byte index");
        var p = f[h] & 255;
        if ((h++, (p & 192) == 128)) return p & 63;
        throw Error("Invalid continuation byte");
      }

      function E() {
        var p, o, s, d, a;
        if (h > F) throw Error("Invalid byte index");
        if (h == F) return !1;
        if (((p = f[h] & 255), h++, !(p & 128))) return p;
        if ((p & 224) == 192) {
          if (((o = y()), (a = ((p & 31) << 6) | o), a >= 128)) return a;
          throw Error("Invalid continuation byte");
        }
        if ((p & 240) == 224) {
          if (
            ((o = y()),
              (s = y()),
              (a = ((p & 15) << 12) | (o << 6) | s),
              a >= 2048)
          )
            return i(a), a;
          throw Error("Invalid continuation byte");
        }
        if (
          (p & 248) == 240 &&
          ((o = y()),
            (s = y()),
            (d = y()),
            (a = ((p & 7) << 18) | (o << 12) | (s << 6) | d),
            a >= 65536 && a <= 1114111)
        )
          return a;
        throw Error("Invalid UTF-8 detected");
      }
      var f, F, h;

      function T(p) {
        (f = u(p)), (F = f.length), (h = 0);
        for (var o = [], s;
          (s = E()) !== !1;) o.push(s);
        return t(o);
      }
      (e.version = "3.0.0"), (e.encode = x), (e.decode = T);
    })(typeof J > "u" ? (J.utf8 = {}) : J);
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
        [/\s*\.\s*/, Be],
      ];

    function ne(e) {
      return (e = e.replace(/\\\//, "/")), Se(e);
    }

    function Ne(e) {
      let r = new Ce(),
        u = 0,
        t = 0;
      return (
        r.addRule(
          /"((?:\\.|[^"])*?)($|")/,
          (i, n) => (
            (u += i.length), {
              type: le,
              value: ne(n),
              row: t,
              col: u,
              single: !1
            }
          ),
        ),
        r.addRule(
          /'((?:\\.|[^'])*?)($|'|(",?[ \t]*\n))/,
          (i, n) => (
            (u += i.length), {
              type: le,
              value: ne(n),
              row: t,
              col: u,
              single: !0
            }
          ),
        ),
        r.addRule(
          /[\-0-9]*\.[0-9]*([eE][\+\-]?)?[0-9]*(?:\s*)/,
          (i) => (
            (u += i.length), {
              type: te,
              value: parseFloat(i),
              row: t,
              col: u
            }
          ),
        ),
        r.addRule(
          /\-?[0-9]+([eE][\+\-]?)[0-9]*(?:\s*)/,
          (i) => (
            (u += i.length), {
              type: te,
              value: parseFloat(i),
              row: t,
              col: u
            }
          ),
        ),
        r.addRule(
          /\-?[0-9]+(?:\s*)/,
          (i) => (
            (u += i.length), {
              type: ce,
              value: parseInt(i),
              row: t,
              col: u
            }
          ),
        ),
        je.forEach((i) => {
          r.addRule(
            i[0],
            (n) => ((u += n.length), {
              type: i[1],
              value: n,
              row: t,
              col: u
            }),
          );
        }),
        r.addRule(/\s/, (i) => {
          i ==
            `
` ?
            ((u = 0), t++) :
            (u += i.length);
        }),
        r.addRule(
          /\S[ \t]*/,
          (i) => ((u += i.length), {
            type: me,
            value: i,
            row: t,
            col: u
          }),
        ),
        r.setInput(e),
        r
      );
    }
    G.exports.lexString = ie;

    function ie(e, r) {
      let u = Ne(e),
        t = "";
      for (;
        (t = u.lex());) r(t);
    }
    G.exports.getAllTokens = Ue;

    function Ue(e) {
      let r = [];
      return (
        ie(e, function(t) {
          r.push(t);
        }),
        r
      );
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
      e.peek == null &&
        Object.defineProperty(e, "peek", {
          enumerable: !1,
          value: function() {
            return this[this.length - 1];
          },
        }),
        e.last == null &&
        Object.defineProperty(e, "last", {
          enumerable: !1,
          value: function(r) {
            return this[this.length - (1 + r)];
          },
        });
    }

    function l(e, r) {
      return e && e.hasOwnProperty("type") && e.type == r;
    }
    fe.exports.parse = qe;

    function qe(e, r) {
      let u = [],
        t = [];
      ae(u), ae(t);
      let i = function(n) {
        t.push(n);
      };
      De.lexString(e, i),
        t[0].type == O &&
        t.last(0).type != A &&
        t.push({
          type: A,
          value: "]",
          row: -1,
          col: -1
        }),
        t[0].type == $ &&
        t.last(0).type != I &&
        t.push({
          type: I,
          value: "}",
          row: -1,
          col: -1
        });
      for (let n = 0; n < t.length; n++)
        for ("" + t[n].type, u.push(t[n]); w(u););
      return (
        u.length == 1 &&
        u[0].type == X &&
        (u = [{
          type: S,
          value: u[0].value
        }]),
        Q(u[0], r)
      );
    }

    function w(e) {
      let r = e.pop();
      switch (r.type) {
        case b:
          if (r.value.trim() == "true")
            return e.push({
              type: Z,
              value: "true"
            }), !0;
          if (r.value.trim() == "false")
            return e.push({
              type: Z,
              value: "false"
            }), !0;
          if (r.value.trim() == "null")
            return e.push({
              type: g,
              value: null
            }), !0;
          break;
        case Me:
          return l(e.peek(), b) ?
            ((e.peek().value += r.value), !0) :
            (e.push({
              type: b,
              value: r.value
            }), !0);
        case oe:
          return l(r, oe) && l(e.peek(), b) ?
            ((e.peek().value += r.value), !0) :
            ((r.type = g), e.push(r), !0);
        case Je:
          return (r.type = g), (r.value = r.value), e.push(r), !0;
        case Z:
          return (
            (r.type = g),
            r.value == "true" ? (r.value = !0) : (r.value = !1),
            e.push(r),
            !0
          );
        case Ke:
          return (r.type = g), e.push(r), !0;
        case g:
          if (l(e.peek(), L)) return (r.type = q), e.pop(), e.push(r), !0;
          if (l(e.peek(), m)) return (r.type = M), e.pop(), e.push(r), !0;
          if (l(e.peek(), b) && l(e.last(1), g)) {
            let u = e.pop();
            return (
              (e.peek().value += '"' + u.value + '"'),
              (e.peek().value += r.value),
              !0
            );
          }
          if (l(e.peek(), b) && l(e.last(1), C)) {
            let u = e.pop(),
              t = e.peek().value.pop();
            return (
              (t += '"' + u.value + '"'),
              (t += r.value),
              e.peek().value.push(t),
              !0
            );
          }
          if (l(e.peek(), b) && l(e.last(1), X)) {
            let u = e.pop(),
              t = e.peek().value.pop(),
              i = r.single ? "'" : '"';
            return (
              (t.value += i + u.value + i),
              (t.value += r.value),
              e.peek().value.push(t),
              !0
            );
          }
          if (l(e.peek(), b)) {
            let u = e.pop().value;
            return (r.value = u + r.value), e.push(r), !0;
          }
          break;
        case R:
          if (l(r, R) && l(e.peek(), L))
            return (r.type = q), e.pop(), e.push(r), !0;
          if (l(e.peek(), m)) return (r.type = M), e.pop(), e.push(r), !0;
          break;
        case S:
          if (l(e.peek(), L)) {
            let u = {
              type: q,
              value: r
            };
            return e.pop(), e.push(u), !0;
          }
          if (l(e.peek(), m)) {
            let u = {
              type: M,
              value: r
            };
            return e.pop(), e.push(u), !0;
          }
          if (l(e.peek(), b)) {
            let u = e.pop();
            return e.push({
              type: W,
              key: u.value.trim(),
              value: r
            }), !0;
          }
          break;
        case q:
          return l(e.peek(), C) ?
            (e.peek().value.push(r.value), !0) :
            (e.push({
              type: C,
              value: [r.value]
            }), !0);
        case C:
          if (l(e.peek(), g))
            return r.value.unshift(e.peek().value), e.pop(), e.push(r), !0;
          if (l(e.peek(), R))
            return r.value.unshift(e.peek().value), e.pop(), e.push(r), !0;
          if (l(e.peek(), S))
            return r.value.unshift(e.peek()), e.pop(), e.push(r), !0;
          if (l(e.peek(), b) && (e.last(1), L)) {
            let u = e.pop();
            for (e.push({
                type: g,
                value: u.value
              }), "" + u.value; w(e););
            return e.push(r), !0;
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
            }), !0;
          }
          throw new Error(
            "Got a :value that can't be handled at line " + r.row + ":" + r.col,
          );
        case W:
          return l(e.last(0), L) && l(e.last(1), X) ?
            (e.last(1).value.push(r), e.pop(), !0) :
            (e.push({
              type: X,
              value: [r]
            }), !0);
        case X:
          if (l(e.peek(), X))
            return (
              r.value.forEach(function(u) {
                e.peek().value.push(u);
              }),
              !0
            );
          break;
        case A:
          if (l(e.peek(), C) && l(e.last(1), O)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: R,
              value: u.value
            }), !0;
          }
          if (l(e.peek(), R) && l(e.last(1), O)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: R,
              value: [u.value]
            }), !0;
          }
          if (l(e.peek(), O))
            return e.pop(), e.push({
              type: R,
              value: []
            }), !0;
          if (l(e.peek(), g) && l(e.last(1), O)) {
            let u = e.pop().value;
            return e.pop(), e.push({
              type: R,
              value: [u]
            }), !0;
          }
          if (l(e.peek(), S) && l(e.last(1), O)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: R,
              value: [u]
            }), !0;
          }
          if (l(e.peek(), b) && l(e.last(1), L)) {
            let u = e.pop();
            for (e.push({
                type: g,
                value: u.value
              }), "" + u.value; w(e););
            return e.push({
              type: A
            }), !0;
          }
          if (
            l(e.peek(), L) &&
            (l(e.last(1), b) || l(e.last(1), S) || l(e.last(1), g))
          ) {
            for (
              e.pop(), e.push({
                type: A,
                value: "]"
              }), "" + JSON.stringify(e); w(e);

            );
            return !0;
          }
          if (l(e.peek(), b) && l(e.last(1), O)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: R,
              value: [u.value]
            }), !0;
          }
          if (l(e.peek(), L) && l(e.last(1), C)) {
            for (e.pop(), e.push({
                type: A
              }), "" + JSON.stringify(e); w(e););
            return !0;
          }
          break;
        case I:
          if (l(e.peek(), X) && l(e.last(1), $)) {
            let u = e.pop();
            return e.pop(), e.push({
              type: S,
              value: u.value
            }), !0;
          }
          if (l(e.peek(), $))
            return e.pop(), e.push({
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
            }), !0;
          }
          if (l(e.peek(), m)) {
            for (e.push({
                type: g,
                value: null
              }); w(e););
            return e.push({
              type: I
            }), !0;
          }
          if (l(e.peek(), L)) return e.pop(), e.push({
            type: I
          }), !0;
          throw new Error(
            "Found } that I can't handle at line " + r.row + ":" + r.col,
          );
        case L:
          if (l(e.peek(), L)) return !0;
          if (l(e.peek(), b)) {
            let u = e.pop();
            for (e.push({
                type: g,
                value: u.value
              }); w(e););
            return e.push(r), !0;
          }
          if (l(e.peek(), m)) {
            for (e.push({
                type: g,
                value: null
              }); w(e););
            return e.push(r), !0;
          }
      }
      return e.push(r), !1;
    }

    function Q(e, r) {
      if (["boolean", "number", "string"].indexOf(typeof e) != -1) return e;
      if (e === null) return null;
      if (Array.isArray(e)) {
        let t = [];
        for (; e.length > 0;) t.unshift(Q(e.pop()));
        return t;
      }
      if (l(e, S)) {
        let t = {};
        return e.value === null ?
          {} :
          (e.value.forEach(function(i) {
              let n = i.key,
                v = Q(i.value);
              r && n in t ? (t[n] = {
                value: t[n],
                next: v
              }) : (t[n] = v);
            }),
            t);
      }
      return l(e, R) ? Q(e.value) : e.value;
    }
  });
  var z = c((er, ve) => {
    "use strict";
    var Qe = he();
    ve.exports.parse = Ye;

    function Ye(e, r) {
      let u = !0,
        t = !1;
      r &&
        ("fallback" in r && r[u] === !1 && (u = !1),
          (t = "duplicateKeys" in r && r.duplicateKeys === !0));
      try {
        return Qe.parse(e, t);
      } catch (i) {
        if (u === !1) throw i;
        try {
          let n = JSON.parse(e);
          return (
            console.warn(
              "dirty-json got valid JSON that failed with the custom parser. We're returning the valid JSON, but please file a bug report here: https://github.com/RyanMarcus/dirty-json/issues  -- the JSON that caused the failure was: " +
              e,
            ),
            n
          );
        } catch {
          throw i;
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

function Context() {
  var _i;
  var args = 1 <= arguments.length ? [].slice.call(arguments, 0, _i = arguments.length - 0) : (_i = 0, []);
  this.ms = args.filter((function(item) {
    return (item.name !== "write");
  }));
  this.ws = args.filter((function(item) {
    return (item.name === "write");
  }));
  this.stack = [];
  this.type = "Context";
  return this;
}
Context;
Context.prototype.clone = (function() {
  var res;
  var res;
  res = new Context();
  res.ms = this.ms.concat([]);
  res.ws = this.ws.concat([]);
  res.stack = (this.stack || [])
    .concat([]);
  return res;
});
Context.prototype.use = (function(middleware) {
  return ((middleware.name === "write") ? this.ws.push(middleware) : this.ms.push(middleware));
});
Context.prototype.resolve = (async function(name, args) {
  var i, output, match, type, result, res, md;
  if (!this.ms.length) return;
  var i;
  var output;
  var match;
  var type;
  var result;
  var res;
  i = 0;
  output = (((typeof args !== "undefined") && (args !== null) && !Number.isNaN(args) && (typeof args.output !== "undefined") && (args.output !== null) && !Number.isNaN(args.output)) ? args.output : (((typeof "first" !== "undefined") && ("first" !== null) && !Number.isNaN("first")) ? "first" : undefined));
  match = (((typeof args !== "undefined") && (args !== null) && !Number.isNaN(args) && (typeof args.match !== "undefined") && (args.match !== null) && !Number.isNaN(args.match)) ? args.match : (((typeof "exact" !== "undefined") && ("exact" !== null) && !Number.isNaN("exact")) ? "exact" : undefined));
  type = (((typeof args !== "undefined") && (args !== null) && !Number.isNaN(args) && (typeof args.type !== "undefined") && (args.type !== null) && !Number.isNaN(args.type)) ? args.type : (((typeof "any" !== "undefined") && ("any" !== null) && !Number.isNaN("any")) ? "any" : undefined));
  result = ((output === "all") ? [] : undefined);
  res = undefined;
  while (i < this.ms.length) {
    var md;
    md = this.ms[i];
    res = await md.call(this, name, {
      output: output,
      match: match,
      type: type
    });
    if (!res) {
      i++;
      continue;
    }
    if (((output === "all") && Array.isArray(res))) {
      result = result.concat(res);
      i++;
      continue;
    }
    if ((typeof res !== "object")) throw Error(tpl("resolved '@{name}' node must be 'object' but got '{res}'", {
      name: name,
      res: typeof res
    }));
    if (!res.type) throw Error(tpl("resolved '@{name}' node must have a 'type' property", {
      name: name
    }));
    if ((output === "first")) {
      result = res;
      break;
    }
    result.push(res);
    i++;
  }
  return result;
});
Context.prototype.text2run = (function(text, opts) {
  return text2run(text, this, opts);
});
Context.prototype.text2ast = (async function(text) {
  return text2ast(text, this);
});
Context.prototype.text2paylod = (async function(text) {
  return text2payload(text, this);
});
Context.prototype.msg2text = msg2text;
Context.prototype.envmd = envmd;
Context.prototype.text2roles = text2roles;
Context.prototype.roles2text = roles2text;
Context.prototype.text2call = text2call;
Context.prototype.read = (async function(name, args) {
  var resolved, _ref;
  var resolved;
  resolved = await this.resolve(name);
  if ((resolved && resolved.read)) {
    return _ref = await resolved.read(args);
  } else {
    _ref = undefined;
  }
  return _ref;
});
Context.prototype.exec = (async function(name, args) {
  var resolved, _ref;
  var resolved;
  resolved = await this.resolve(name);
  if ((resolved && resolved.exec)) {
    return _ref = await resolved.exec.call(this, args, this);
  } else {
    _ref = undefined;
  }
  return _ref;
});
Context.prototype.write = (async function(name, args) {
  var ws;
  ws = ws || this.ws;
  if (!ws.length) return;
  return ws[0](name, args, this, this.write.bind(this, name, args, ws.slice(1)));
});

function envmd(md) {
  var lmd;
  var lmd;
  lmd = {};
  Object.keys(md)
    .forEach((function(name) {
      var _ref;
      if ((typeof md[name] === "string" || typeof md[name] === "number" || typeof md[name] === "boolean")) {
        _ref = (lmd[name] = {
          type: "text",
          name: name,
          read: (function() {
            return md[name];
          })
        });
      } else if (typeof md[name] === "object") {
        lmd[name] = md[name];
        _ref = (lmd[name].name = name);
      } else {
        _ref = undefined;
        throw new TuneError(("unsupported type of value '" + name + "': " + util.inspect(md)));
      }
      return _ref;
    }));
  async function hash(name, args) {
    var llmd, result, re, key, val, _ref, _len;
    var llmd;
    var result;
    var re;
    llmd = {};
    result = ((args.output === "all") ? [] : undefined);
    re = ((args.match === "regex") ? new RegExp(name) : undefined);
    _ref = lmd;
    for (key in _ref) {
      val = _ref[key];
      if (((args.type !== val.type) && (args.type !== "any"))) continue;
      if (((args.match === "exact") && (name !== key))) continue;
      if ((re && !re.test(key))) continue;
      if ((args.output === "first")) {
        result = Object.assign({}, val);
        break;
      }
      result.push(Object.assign({}, val));
    }
    return result;
  }
  return hash;
}
envmd;

function makeContext() {
  var ctx, _i;
  var args = 1 <= arguments.length ? [].slice.call(arguments, 0, _i = arguments.length - 0) : (_i = 0, []);
  var ctx;
  ctx = new Context();
  if (!args[0]) return ctx;
  args.forEach((function(md) {
    var _ref;
    if ((typeof md === "function")) {
      _ref = ctx.use(md);
    } else if (typeof md === "object") {
      _ref = ctx.use(envmd(md));
    } else {
      _ref = undefined;
      throw new TuneError("context middlewares might be either function or an object");
    }
    return _ref;
  }));
  return ctx;
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
$roles = {
  short2long: {
    "s": "system",
    "u": "user",
    "a": "assistant",
    "au": "audio",
    "tc": "tool_call",
    "err": "error",
    "c": "comment",
    "tr": "tool_result",
    "tool": "tool_result"
  },
  long2short: {
    "system": "s",
    "user": "u",
    "audio": "au",
    "assistant": "a",
    "tool_call": "tc",
    "error": "err",
    "comment": "c",
    "tool_result": "tr",
    "tool": "tr"
  }
};

function text2roles(text, lineNum) {
  return (function(it) {
    it = it.split(/(^(?:s|system|u|user|a|assistant|tc|tool_call|tr|tool_result|c|comment|au|audio|err|error)\s*:)/gm);
    it = it.reduce((function(memo, item, index, arr) {
      memo.row = memo.row || 0;
      (function(it) {
        var res, _ref;
        if (it) {
          var res;
          res = {
            role: $roles.short2long[it[1]] || it[1],
            content: arr[index + 1]
              .replace(/\n$/, ""),
            row: memo.row,
            col: 0
          };
          memo.push(res);
          _ref = (memo.row += res.content.split("\n").length);
        } else {
          _ref = (((index === 0) && item) ? (memo.row += (item.split("\n").length - 1)) : undefined);
        }
        return _ref;
      })(item.match(/^(s|system|u|user|a|assistant|tc|tool_call|tr|tool_result|c|comment|au|audio|err|error)\s*:/));
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
  m = lines[0].match(/^\s*([\@\w\-]+)\s*({.*})?\s*$/);
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
async function text2payload(text, ctx) {
  var ast;
  ast = await text2ast(text, ctx);
  return await ast2payload(ast);
}
text2payload;
async function text2ast(text, ctx, resolve) {
  var lastChar, lastRole;
  var lastChar;
  lastChar = '';
  var lastRole;
  lastRole = '';
  async function parse(text, recursive, ctx) {
    var nodeStack, nodes, index, reAst, m, row, col, match, role, roleName, name, prefix, args, proc, filename, resolved, pargs, pname, p, err, schema, lctx, _ref, _i, _i0, _ref0, _len;
    nodeStack = nodeStack || [];
    var nodes;
    nodes = [];
    var index;
    index = 0;
    reAst = /(?<prefix1>@{1,2})\{(?<name1>(?:\\\}|[^}])+)\}|(?<prefix>@{1,2})(?<name>[\S]+)|(?<role>^(?:s|system|u|user|a|assistant|tc|tool_call|tr|tool_result|c|comment|au|audio|err|error))\s*(?<roleName>\([^\)]+\))?\s*:/gm;
    while (m = reAst.exec(text)) {
      if (((lastRole === "a" || lastRole === "tc" || lastRole === "err" || lastRole === "assistant" || lastRole === "tool_call" || lastRole === "error") && !m.groups.role)) continue;
      if (((m.index > 0) && (text.charAt(m.index - 1) === String.fromCharCode(92)))) continue;
      _ref = getPos(m.index, text);
      row = _ref[0];
      col = _ref[1];
      if ((m.index - index)) {
        nodes.push({
          type: "text",
          start: index,
          end: m.index,
          value: text.slice(index, m.index)
        });
        index = m.index;
        lastChar = text.charAt(m.index - 1);
      }
      var match;
      match = m[0];
      var role;
      var roleName;
      role = m.groups.role;
      roleName = m.groups.roleName;
      if (role) {
        nodes.push({
          type: ((lastChar === '' || lastChar === "\n") ? "role" : "text"),
          start: index,
          end: m.index + match.length,
          role: role,
          roleName: (roleName ? roleName.slice(1, -1) : undefined),
          value: match
        });
        index = m.index + match.length;
        lastChar = text.charAt(index - 1);
        lastRole = match.slice(0, -1);
        continue;
      }
      var name;
      var prefix;
      var args;
      var proc;
      name = m.groups.name || m.groups.name1;
      prefix = m.groups.prefix || m.groups.prefix1;
      args = undefined;
      proc = undefined;
      if (!ctx) {
        nodes.push({
          type: "var",
          start: m.index,
          end: m.index + match.length,
          value: match
        });
        index = m.index + match.length;
        continue;
      }(function(it) {
        it = it.replace(/\\\}/g, "}");
        it = it.split("|");
        it = it.map((function(it) {
          return it.trim();
        }));
        it = it.map((function(item, index) {
          var idx;
          if ((index === 0)) return item;
          var idx;
          idx = item.indexOf(" ");
          if ((idx === -1)) return Array(item, "");
          return Array(item.slice(0, idx), item.slice(idx));
        }));
        name = it[0];
        it = (proc = ((it.length > 1) ? it.slice(1) : undefined));
        return it;
      })(name);
      var filename;
      filename = (function(it) {
        it = it["slice"](-1)[0];
        it = (it ? (it.fullname || it.name) : "");
        return it;
      })(ctx.stack || []);
      var resolved;
      resolved = await ctx.resolve(name);
      if (proc) {
        while (pargs = proc.shift()) {
          var pname;
          pname = pargs.shift();
          var p;
          p = await ctx.resolve(pname, {
            type: "processor"
          });
          if (!p) throw new TuneError(("'" + pname + "' processor not found"), filename, row, col);
          if ((typeof p.exec !== "function")) throw new TuneError(("'" + pname + "' does not have exec function"), filename, row, col);
          try {
            resolved = await p.exec.call(ctx, resolved, pargs[0], ctx);
          } catch (e) {
            var err;
            err = new TuneError(e.message, (p.fullname || p.name), undefined, undefined, [], e);
            err._stack.push({
              filename: filename,
              row: row,
              col: col
            });
            throw err;
          }
        }
      }
      _ref0 = (Array.isArray(resolved) ? resolved : [resolved]);
      for (_i0 = 0, _len = _ref0.length; _i0 < _len; ++_i0) {
        resolved = _ref0[_i0];
        if (!resolved) throw new TuneError(("'" + name + "' not found"), filename, row, col);
        resolved.start = m.index;
        resolved.end = m.index + match.length;
        resolved.stack = TuneError.ctx2stack(ctx);
        resolved.prefix = prefix;
        resolved.name = resolved.name || name;
        resolved.stack.push({
          col: col,
          row: row,
          filename: filename
        });
        if ((resolved.type === "text" || resolved.type === "image" || resolved.type === "audio")) resolved.value = await resolved.read();
        if ((resolved.type === "tool")) {
          var schema;
          schema = resolved.schema;
          if (!schema) throw new TuneError(("schema has to be set" + " for '" + resolved.name + "'"), filename, row, col);
          schema.name = resolved.name;
          if (!schema.description) throw new TuneError(("no description set" + " for '" + resolved.name + "'"), filename, row, col);
          if (!schema.parameters) throw new TuneError(("no parameters set" + " for '" + resolved.name + "'"), filename, row, col);
          if (!schema.parameters.type) throw new TuneError(("no parameters.type set" + " for '" + resolved.name + "'"), filename, row, col);
          if (!schema.parameters.properties) throw new TuneError(("no parameters.properties set" + " for '" + resolved.name + "'"), filename, row, col);
        }
        index = m.index + match.length;
        if ((recursive && (resolved.prefix.length === 2) && (resolved.type === "text"))) {
          var lctx;
          lctx = ctx.clone();
          lctx.stack.push(resolved);
          try {
            resolved.nodes = await parse(resolved.value, true, lctx);
          } catch (e) {
            throw TuneError.wrap(e, filename, row, col);
          }
        }
        nodes.push(resolved);
      }
    }
    if ((text.length - index)) nodes.push({
      type: "text",
      start: index,
      end: text.length,
      value: text.slice(index, text.length)
    });
    return nodes;
  }
  parse;
  return await parse(text, true, ctx);
}
text2ast;

function ast2payload(ast) {
  var payload, toolId, tools, llms, messages, roles, lastRole, lastChar;
  var payload;
  var toolId;
  var tools;
  var llms;
  var messages;
  var roles;
  var lastRole;
  var lastChar;
  payload = {};
  toolId = 0;
  tools = [];
  llms = [];
  messages = [];
  roles = [];
  lastRole = undefined;
  lastChar = '';

  function visit(ast) {
    var node, _i, _res, _ref, _len, _ref0;
    _res = [];
    _ref = ast;
    for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
      node = _ref[_i];
      if ((node.type === "role")) {
        if (lastRole) roles.push(lastRole);
        _ref0 = (lastRole = node);
      } else if (lastRole) {
        lastRole.nodes = lastRole.nodes || [];
        _ref0 = (node.nodes ? visit(node.nodes) : lastRole.nodes.push(node));
      } else if (!!node.nodes) {
        _ref0 = visit(node.nodes);
      } else {
        _ref0 = undefined;
      }
      if (typeof _ref0 !== 'undefined') _res.push(_ref0);
    }
    return _res;
  }
  visit;
  visit(ast);
  roles.push(lastRole);

  function transformRoles(memo, item, index, arr) {
    var tcItem, lines, toolIndex, tc;
    if ((item.role === "user" || item.role === "system" || item.role === "tool_call")) item.content = (Array.isArray(item.content) ? item.content.map((function(item) {
      if (item.text) item.text = unescape(item.text);
      return item;
    })) : unescape(item.content));

    function findToolCalls() {
      var item1, _i, _ref, _len;
      var tools;
      tools = [];
      _ref = memo
        .slice()
        .reverse();
      for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
        item1 = _ref[_i];
        if ((item1.role === "tool")) tools.push(item1);
        if ((!!item1.tool_calls && !!tools.length && (tools.length === item1.tool_calls.length))) return;
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
    } else if (item.role === "audio") {
      var lines;
      lines = item.content.split("\n");
      memo.push({
        role: "assistant",
        content: null,
        audio: {
          id: item.id,
          data: item.data,
          expires_at: (function(it) {
            it = it.trim();
            it = parseInt(it);
            return it;
          })(lines[0]),
          transcript: lines.slice(1)
            .join("\n")
        }
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
    } else {
      memo.push(item);
    }
    return memo;
  }
  payload.messages = roles
    .map((function(item) {
      var res, _ref;
      var res;
      switch (item.role) {
        case "s":
          _ref = "system";
          break;
        case "u":
          _ref = "user";
          break;
        case "a":
          _ref = "assistant";
          break;
        case "au":
          _ref = "audio";
          break;
        case "tc":
          _ref = "tool_call";
          break;
        case "err":
          _ref = "error";
          break;
        case "c":
          _ref = "comment";
          break;
        case "tr":
          _ref = "tool";
          break;
        case "tool":
          _ref = "tool";
          break;
        case "tool_result":
          _ref = "tool";
          break;
        default:
          _ref = item.role;
      }
      res = {
        role: _ref,
        nodes: item.nodes
      };
      if (item.roleName) res.name = item.roleName;
      return res;
    }))
    .map((function(item) {
      item.nodes = item.nodes.reduce((function(memo, node) {
        if ((node.type === "llm")) {
          llms.push(node);
        } else if (node.type === "tool") {
          tools.push(node);
        } else {
          memo.push(node);
        }
        return memo;
      }), []);
      return item;
    }))
    .map((function(item) {
      item.content = item.nodes.reduce((function(memo, node) {
        var lastNode, _ref;
        if ((node.type === "image")) {
          if ((typeof memo === "string")) memo = Array({
            type: "text",
            text: memo
          });
          memo.push({
            type: "image_url",
            image_url: {
              url: "data:" + node.mimetype + ";base64," + node.value.toString("base64")
            }
          });
        } else if ((item.role === "user") && (node.type === "audio")) {
          if ((typeof memo === "string")) memo = Array({
            type: "text",
            text: memo
          });
          switch (node.mimetype) {
            case "audio/mpeg":
              _ref = "mp3";
              break;
            case "audio/wav":
              _ref = "wav";
              break;
            default:
              _ref = undefined;
          }
          memo.push({
            type: "input_audio",
            input_audio: {
              data: node.value.toString("base64"),
              format: _ref
            }
          });
        } else if ((item.role === "audio") && (node.type === "audio")) {
          item.id = node.name;
          item.data = node.value.toString("base64");
        } else if (node.type === "var" || node.type === "text") {
          if ((typeof memo === "string")) {
            memo += node.value;
          } else {
            var lastNode;
            lastNode = memo["slice"](-1)[0];
            (lastNode.type === "text") ? lastNode.text += node.value: memo.push({
              type: "text",
              text: node.value
            });
          }
        }
        return memo;
      }), "");
      delete item.nodes;
      item.content = ((typeof item.content === "string") ? item.content.trim() : item.content.map((function(content) {
        if ((content.type === "text")) content.text = content.text.trim();
        return content;
      })));
      return item;
    }))
    .reduce(transformRoles, Array());
  if (tools.length) payload.tools = tools;
  if (llms.length) payload.llm = llms["slice"](-1)[0];
  return payload;
}
ast2payload;
async function payload2http(payload, ctx) {
  var llm, stack, lastStack, body, _ref;
  var llm;
  llm = payload.llm;
  delete payload.llm;
  if (!llm) llm = await ctx.resolve("default", {
    type: "llm"
  });
  if (!llm) {
    var stack;
    stack = TuneError.ctx2stack(ctx);
    var lastStack;
    lastStack = stack.pop();
    throw new TuneError("llm file not found", (((typeof lastStack !== "undefined") && (lastStack !== null) && !Number.isNaN(lastStack) && (typeof lastStack.filename !== "undefined") && (lastStack.filename !== null) && !Number.isNaN(lastStack.filename)) ? lastStack.filename : undefined), (((typeof lastStack !== "undefined") && (lastStack !== null) && !Number.isNaN(lastStack) && (typeof lastStack.row !== "undefined") && (lastStack.row !== null) && !Number.isNaN(lastStack.row)) ? lastStack.row : undefined), (((typeof lastStack !== "undefined") && (lastStack !== null) && !Number.isNaN(lastStack) && (typeof lastStack.col !== "undefined") && (lastStack.col !== null) && !Number.isNaN(lastStack.col)) ? lastStack.col : undefined), stack);
  }
  var body;
  body = Object.assign({}, payload);
  if (body.tools) body.tools = body.tools.map((function(tool) {
    return {
      type: "function",
      function: Object.assign({}, tool.schema)
    }
  }));
  try {
    _ref = await llm.exec.call(ctx, body, ctx);
  } catch (e) {
    throw new TuneError(e.message, (llm.filename || llm.fullname || llm.name), llm.row, llm.col, llm.stack, e);
  }
  return _ref;
}
payload2http;
async function toolCall(payload, ctx) {
  var lastMsg, tools;
  var lastMsg;
  lastMsg = payload.messages["slice"](-1)[0];
  if (((((typeof lastMsg !== "undefined") && (lastMsg !== null) && !Number.isNaN(lastMsg) && (typeof lastMsg.tool_calls !== "undefined") && (lastMsg.tool_calls !== null) && !Number.isNaN(lastMsg.tool_calls) && (typeof lastMsg.tool_calls.length !== "undefined") && (lastMsg.tool_calls.length !== null) && !Number.isNaN(lastMsg.tool_calls.length)) ? lastMsg.tool_calls.length : (((typeof 0 !== "undefined") && (0 !== null) && !Number.isNaN(0)) ? 0 : undefined)) === 0)) return [];
  var tools;
  tools = (payload.tools || [])
    .reduce((function(memo, tool) {
      memo[tool.name] = tool;
      return memo;
    }), {});
  return Promise.all(lastMsg.tool_calls.map((async function(item) {
    var res, tc, tool;
    var res;
    res;
    var tc;
    tc = item.function;
    var tool;
    tool = tools[tc.name];
    if (!tool) throw new TuneError(("tool '" + tc.name + "' not defined"), "", undefined, undefined, TuneError.ctx2stack(ctx));
    try {
      res = await tools[tc.name].exec.call(ctx, JSON.parse(tc.arguments), ctx);
    } catch (e) {
      throw new TuneError(e.message, (tool.filename || tool.fullname || tool.name), tool.row, tool.col, tool.stack, e);
    }

    function transformRes(res) {
      var _ref;
      if (((typeof res === "string" || typeof res === "number" || typeof res === "boolean" || typeof res === "undefined") || (res instanceof String) || (res === null))) {
        _ref = String(res);
      } else if (Array.isArray(res)) {
        _ref = res
          .map(transformRes)
          .join("\n");
      } else if (typeof util !== 'undefined') {
        _ref = util.inspect(res);
      } else if (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.toString !== "undefined") && (res.toString !== null) && !Number.isNaN(res.toString)) ? res.toString : undefined) {
        _ref = res.toString();
      } else {
        _ref = String(res);
      }
      return _ref;
    }
    transformRes;
    return {
      role: "tool",
      id: item.id,
      content: transformRes(res)
    }
  })));
}
toolCall;

function TunePromise(executor, iterator) {
  this.promise = new Promise(executor);
  if (iterator) {
    this.next = iterator;
    this[Symbol.asyncIterator] = this;
  }
  return this;
}
TunePromise;
TunePromise.prototype.then = (function(onFulfilled, onRejected) {
  return this.promise.then(onFulfilled, onRejected);
});
TunePromise.prototype.catch = (function(onRejected) {
  return this.promise.catch(onRejected);
});
TunePromise.prototype.finally = (function(onFinally) {
  return this.promise.finally(onFinally);
});

function text2run(text, ctx, opts) {
  var msgs, stopVal, stream, resolve, reject, p, iter;
  if (!ctx) throw Error("context not set");
  var msgs;
  var stopVal;
  var stream;
  var resolve;
  var reject;
  msgs = [];
  stopVal = (((typeof opts !== "undefined") && (opts !== null) && !Number.isNaN(opts) && (typeof opts.stop !== "undefined") && (opts.stop !== null) && !Number.isNaN(opts.stop)) ? opts.stop : (((typeof "step" !== "undefined") && ("step" !== null) && !Number.isNaN("step")) ? "step" : undefined));
  stream = (((typeof opts !== "undefined") && (opts !== null) && !Number.isNaN(opts) && (typeof opts.stream !== "undefined") && (opts.stream !== null) && !Number.isNaN(opts.stream)) ? opts.stream : (((typeof false !== "undefined") && (false !== null) && !Number.isNaN(false)) ? false : undefined));
  resolve = undefined;
  reject = undefined;
  var p;
  var iter;
  p = new Promise((function(res, rej) {
    resolve = res;
    return (reject = rej);
  }));
  iter = new AsyncIter();

  function stop() {
    var lastMsg, _ref;
    if ((!msgs || !msgs.length)) return;
    var lastMsg;
    lastMsg = msgs["slice"](-1)[0];
    if ((stopVal === "step")) {
      _ref = !!lastMsg;
    } else if (stopVal === "assistant") {
      _ref = (!!lastMsg && (lastMsg.role === "assistant") && !!lastMsg.content && !lastMsg.tool_calls);
    } else if (typeof stopVal === "function") {
      _ref = stopVal(msgs);
    } else {
      _ref = undefined;
    }
    return _ref;
  }
  stop;
  async function doit() {
    var ast, payload, res, ctype, err, reader, data, done, reData, reComment;
    while (!stop(msgs)) {
      var ast;
      ast = await text2ast(text + "\n" + msg2text(msgs), ctx);
      var payload;
      payload = await ast2payload(ast, ctx);
      if (stream) payload.stream = stream;
      var res;
      res = await toolCall(payload, ctx);
      if (res.length) {
        msgs = msgs.concat(res);
        iter.result = {
          value: msgs
        };
        continue;
      }
      payload = await payload2http(payload, ctx);
      res = await fetch(payload.url, payload);
      var ctype;
      ctype = res.headers.get("content-type");
      if ((!stream || ctype.includes("application/json"))) {
        res = await res.json();
        if (((((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res[0] !== "undefined") && (res[0] !== null) && !Number.isNaN(res[0]) && (typeof res[0].error !== "undefined") && (res[0].error !== null) && !Number.isNaN(res[0].error)) ? res[0].error : (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.error !== "undefined") && (res.error !== null) && !Number.isNaN(res.error)) ? res.error : undefined)) || (res.object === "error"))) {
          var err;
          err = new TuneError(tpl("{type: }{message}", (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res[0] !== "undefined") && (res[0] !== null) && !Number.isNaN(res[0]) && (typeof res[0].error !== "undefined") && (res[0].error !== null) && !Number.isNaN(res[0].error)) ? res[0].error : (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.error !== "undefined") && (res.error !== null) && !Number.isNaN(res.error)) ? res.error : (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res)) ? res : undefined)))));
          err._stack = TuneError.ctx2stack(ctx);
          throw err;
        }
        msgs.push((((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.message !== "undefined") && (res.message !== null) && !Number.isNaN(res.message)) ? res.message : (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.choices !== "undefined") && (res.choices !== null) && !Number.isNaN(res.choices) && (typeof res.choices[0] !== "undefined") && (res.choices[0] !== null) && !Number.isNaN(res.choices[0]) && (typeof res.choices[0].message !== "undefined") && (res.choices[0].message !== null) && !Number.isNaN(res.choices[0].message)) ? res.choices[0].message : undefined)));
        iter.result = {
          value: msgs,
          done: true
        };
        continue;
      }
      var reader;
      var data;
      var done;
      var reData;
      var reComment;
      reader = res.body
        .pipeThrough(new TextDecoderStream("utf8"))
        .getReader();
      data = "";
      done = false;
      reData = new RegExp("^data: (.*)");
      reComment = new RegExp("^:.*");
      if (ctype.includes("text/event-stream")) {
        while (!done) {
          res = await reader.read();
          done = (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.done !== "undefined") && (res.done !== null) && !Number.isNaN(res.done)) ? res.done : (((typeof true !== "undefined") && (true !== null) && !Number.isNaN(true)) ? true : undefined));
          (function(it) {
            it = it.split(/\n/);
            it = it.map((function(item) {
              return item.trim();
            }));
            it = it.filter((function(item) {
              return !item.match(reComment);
            }));
            it = it.map((function(item, index) {
              var m;
              var m;
              m = item.match(reData);
              if ((!m || ('' !== it[(index + 1)]))) return;
              if ((m[1] === '[DONE]')) {
                done = true;
                return;
              }
              return m[1];
            }));
            it = it.filter((function(item) {
              return item;
            }));
            it = it.map((function(item) {
              return JSON.parse(item);
            }));
            it = it.reduce((function(msg, chunk) {
              var delta, tc, tcIdx;
              var delta;
              delta = (((typeof chunk !== "undefined") && (chunk !== null) && !Number.isNaN(chunk) && (typeof chunk.choices !== "undefined") && (chunk.choices !== null) && !Number.isNaN(chunk.choices) && (typeof chunk.choices[0] !== "undefined") && (chunk.choices[0] !== null) && !Number.isNaN(chunk.choices[0]) && (typeof chunk.choices[0].delta !== "undefined") && (chunk.choices[0].delta !== null) && !Number.isNaN(chunk.choices[0].delta)) ? chunk.choices[0].delta : (((typeof {} !== "undefined") && ({} !== null) && !Number.isNaN({})) ? {} : undefined));
              if ((((typeof chunk !== "undefined") && (chunk !== null) && !Number.isNaN(chunk) && (typeof chunk.error !== "undefined") && (chunk.error !== null) && !Number.isNaN(chunk.error)) ? chunk.error : undefined)) {
                var err;
                err = new TuneError(JSON.stringify((((typeof chunk !== "undefined") && (chunk !== null) && !Number.isNaN(chunk) && (typeof chunk.error !== "undefined") && (chunk.error !== null) && !Number.isNaN(chunk.error)) ? chunk.error : undefined), null, "  "));
                err._stack = TuneError.ctx2stack(ctx);
                throw err;
              }
              if (delta.content) {
                msg.content = msg.content || "";
                msg.content += delta.content;
              } else if (delta.tool_calls) {
                msg.tool_calls = msg.tool_calls || [];
                tc = delta.tool_calls[0];
                tcIdx = tc.index || 0;
                msg.tool_calls[tcIdx] = msg.tool_calls[tcIdx] || tc;
                msg.tool_calls[tcIdx].function.arguments += tc.function.arguments;
              }
              return msg;
            }), {
              role: "assistant",
              content: ""
            });
            it = (iter.result = {
              value: msgs.concat(Array(it))
            });
            return it;
          })(data += (((typeof res !== "undefined") && (res !== null) && !Number.isNaN(res) && (typeof res.value !== "undefined") && (res.value !== null) && !Number.isNaN(res.value)) ? res.value : (((typeof "" !== "undefined") && ("" !== null) && !Number.isNaN("")) ? "" : undefined)));
        }
        msgs = iter.result.value;
      }
    }
    return (stream ? (iter.result = {
      value: msgs,
      done: true
    }) : resolve(msgs));
  }
  doit;
  doit()
    .catch((function(e) {
      var err;
      var err;
      err = e;
      if ((e.name !== "TuneError")) {
        err = new TuneError(e.message);
        err._stack = TuneError.ctx2stack(ctx);
        err.error = e;
      }
      return (stream ? (iter.err = err) : reject(err));
    }));
  if (stream) resolve(iter);
  return p;
}
text2run;

function msg2text(msg, long) {
  var _ref, _ref0, _ref1;

  function mkline(role, content) {
    return (long ? tpl("{role}:{new_line}{content}", {
      role: role,
      content: content,
      new_line: ((role === "system" || role === "user" || role === "assistant" || role === "tool_result") ? "\n" : " ")
    }) : tpl("{role}: {content}", {
      role: $roles.long2short[role],
      content: content
    }));
  }
  mkline;
  if (Array.isArray(msg)) {
    _ref1 = msg
      .map((function(item) {
        return msg2text(item, long);
      }))
      .join("\n");
  } else {
    switch (msg.role) {
      case "user":
        if (((typeof msg.content === "string") || (msg.content instanceof String))) {
          _ref0 = (msg.name ? tpl("{role}({name}): {content}", {
            name: msg.name,
            content: msg.content,
            role: (long ? "user" : "u")
          }) : mkline("user", msg.content));
        } else if (Array.isArray(msg.content)) {
          _ref0 = msg.content
            .map((function(item) {
              var _ref1;
              switch (item.type) {
                case "text":
                  _ref1 = mkline("user", item.text);
                  break;
                case "tool_result":
                  _ref1 = mkline("tool_result", item.content);
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
          if ((((typeof msg !== 'undefined') && (typeof msg.content !== 'undefined')) && ((typeof msg.content === "string") || (msg.content instanceof String)))) {
            res.push(mkline("assistant", msg.content));
          } else if (Array.isArray(msg.content)) {
            res.push(msg.content
              .map((function(item) {
                var _ref1;
                switch (item.type) {
                  case "text":
                    _ref1 = mkline("assistant", item.text);
                    break;
                  case "tool_use":
                    _ref1 = tpl("{role}: {name} {args}", {
                      role: (long ? "tool_call" : "tc"),
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
              .join("\n"));
          }
          if (msg.audio) res.push(tpl("{role}: @{id} {expires_at}\n{transcript}", extend(msg.audio, {
            role: (long ? "audio" : "au")
          })));
          if (msg.tool_calls) res.push(msg.tool_calls
            .map((function(tc) {
              var args, text, _ref1, _err;
              var args;
              var text;
              try {
                _ref1 = dJSON.parse(tc.function.arguments || "{}");
              } catch (_err) {
                _ref1 = {}
              }
              args = _ref1;
              text = args.text;
              delete args.text;
              args = (Object.keys(args).length ? JSON.stringify(args) : undefined);
              return tpl("{role}: {name}{ args}{\ntext}", {
                name: tc.function.name,
                args: args,
                text: text,
                role: (long ? "tool_call" : "tc")
              });
            }))
            .join("\n"));
          return res.join("\n");
        })([]);
        break;
      case "tool":
        _ref = mkline("tool_result", msg.content);
        break;
      case "system":
        _ref = mkline("system", msg.content);
        break;
      case "comment":
        _ref = mkline("comment", msg.content);
        break;
      case "error":
        _ref = mkline("error ", msg.content);
        break;
      default:
        _ref = undefined;
    }
    _ref1 = _ref;
  }
  return _ref1;
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
    .replace(/^(s|u|a|c|tr|tc|err):/gm, "\\$1:");
}
escape;

function unescape(text) {
  return String((((typeof text !== "undefined") && (text !== null) && !Number.isNaN(text)) ? text : (((typeof "" !== "undefined") && ("" !== null) && !Number.isNaN("")) ? "" : undefined)))
    .replace(/\\(?<item>@{1,2}\{\s*[~\.\-\w/]+\s*)(?<proc>(?:\s*\|\s*\w+(?:\s+\w+)*)*\})/g, "$<item>$<proc>")
    .replace(/\\(?<item>@{1,2}[~\.\-\w/]+)/g, "$<item>")
    .replace(/^\\(s|system|u|user|a|assistant|c|comment|tr|tool_result|tc|tool_call|err|error):/gm, "$1:");
}
unescape;

function text2cut(text, cursor) {
  return (function(line) {
    return (function(it) {
      it = it.map((function(item) {
        item.start = item.row;
        line = item.row + item.content.split("\n").length;
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
    })(text2roles(text, true));
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
          return ((typeof res !== 'undefined') ? ((pre || "") + res + (post || "")) : "");
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
exports.makeContext = makeContext;
exports.Context = Context;
exports.text2roles = text2roles;
exports.roles2text = roles2text;
exports.text2call = text2call;
exports.text2ast = text2ast;
exports.ast2payload = ast2payload;
exports.toolCall = toolCall;
exports.text2run = text2run;
exports.msg2text = msg2text;
exports.msg2role = msg2role;
exports.text2cut = text2cut;
exports.TuneError = TuneError;
exports.text2cut = text2cut;
exports.text2payload = text2payload;
exports.payload2http = payload2http;
exports.envmd = envmd;
exports.unescape = unescape;
exports.escape = escape;