var path, tune, envmd, TuneError, text2run;

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
let msgpack = (function() {
  "use strict";

  // Serializes a value to a MessagePack byte array.
  //
  // data: The value to serialize. This can be a scalar, array or object.
  // options: An object that defines additional options.
  // - multiple: (boolean) Indicates whether multiple values in data are concatenated to multiple MessagePack arrays. Default: false.
  // - invalidTypeReplacement:
  //   (any) The value that is used to replace values of unsupported types.
  //   (function) A function that returns such a value, given the original value as parameter.
  function serialize(data, options) {
    if (options && options.multiple && !Array.isArray(data)) {
      throw new Error(
        "Invalid argument type: Expected an Array to serialize multiple values.",
      );
    }
    const pow32 = 0x100000000; // 2^32
    let floatBuffer, floatView;
    let array = new Uint8Array(128);
    let length = 0;
    if (options && options.multiple) {
      for (let i = 0; i < data.length; i++) {
        append(data[i]);
      }
    } else {
      append(data);
    }
    return array.subarray(0, length);

    function append(data, isReplacement) {
      switch (typeof data) {
        case "undefined":
          appendNull(data);
          break;
        case "boolean":
          appendBoolean(data);
          break;
        case "number":
          appendNumber(data);
          break;
        case "string":
          appendString(data);
          break;
        case "object":
          if (data === null) appendNull(data);
          else if (data instanceof Date) appendDate(data);
          else if (Array.isArray(data)) appendArray(data);
          else if (
            data instanceof Uint8Array ||
            data instanceof Uint8ClampedArray
          )
            appendBinArray(data);
          else if (
            data instanceof Int8Array ||
            data instanceof Int16Array ||
            data instanceof Uint16Array ||
            data instanceof Int32Array ||
            data instanceof Uint32Array ||
            data instanceof Float32Array ||
            data instanceof Float64Array
          )
            appendArray(data);
          else appendObject(data);
          break;
        default:
          if (!isReplacement && options && options.invalidTypeReplacement) {
            if (typeof options.invalidTypeReplacement === "function")
              append(options.invalidTypeReplacement(data), true);
            else append(options.invalidTypeReplacement, true);
          } else {
            throw new Error(
              "Invalid argument type: The type '" +
              typeof data +
              "' cannot be serialized.",
            );
          }
      }
    }

    function appendNull(data) {
      appendByte(0xc0);
    }

    function appendBoolean(data) {
      appendByte(data ? 0xc3 : 0xc2);
    }

    function appendNumber(data) {
      if (isFinite(data) && Number.isSafeInteger(data)) {
        // Integer
        if (data >= 0 && data <= 0x7f) {
          appendByte(data);
        } else if (data < 0 && data >= -0x20) {
          appendByte(data);
        } else if (data > 0 && data <= 0xff) {
          // uint8
          appendBytes([0xcc, data]);
        } else if (data >= -0x80 && data <= 0x7f) {
          // int8
          appendBytes([0xd0, data]);
        } else if (data > 0 && data <= 0xffff) {
          // uint16
          appendBytes([0xcd, data >>> 8, data]);
        } else if (data >= -0x8000 && data <= 0x7fff) {
          // int16
          appendBytes([0xd1, data >>> 8, data]);
        } else if (data > 0 && data <= 0xffffffff) {
          // uint32
          appendBytes([0xce, data >>> 24, data >>> 16, data >>> 8, data]);
        } else if (data >= -0x80000000 && data <= 0x7fffffff) {
          // int32
          appendBytes([0xd2, data >>> 24, data >>> 16, data >>> 8, data]);
        } else if (data > 0 && data <= 0xffffffffffffffff) {
          // uint64
          appendByte(0xcf);
          appendInt64(data);
        } else if (data >= -0x8000000000000000 && data <= 0x7fffffffffffffff) {
          // int64
          appendByte(0xd3);
          appendInt64(data);
        } else if (data < 0) {
          // below int64
          appendBytes([0xd3, 0x80, 0, 0, 0, 0, 0, 0, 0]);
        } else {
          // above uint64
          appendBytes([0xcf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
        }
      } else {
        // Float
        if (!floatView) {
          floatBuffer = new ArrayBuffer(8);
          floatView = new DataView(floatBuffer);
        }
        floatView.setFloat64(0, data);
        appendByte(0xcb);
        appendBytes(new Uint8Array(floatBuffer));
      }
    }

    function appendString(data) {
      let bytes = encodeUtf8(data);
      let length = bytes.length;

      if (length <= 0x1f) appendByte(0xa0 + length);
      else if (length <= 0xff) appendBytes([0xd9, length]);
      else if (length <= 0xffff) appendBytes([0xda, length >>> 8, length]);
      else
        appendBytes([0xdb, length >>> 24, length >>> 16, length >>> 8, length]);

      appendBytes(bytes);
    }

    function appendArray(data) {
      let length = data.length;

      if (length <= 0xf) appendByte(0x90 + length);
      else if (length <= 0xffff) appendBytes([0xdc, length >>> 8, length]);
      else
        appendBytes([0xdd, length >>> 24, length >>> 16, length >>> 8, length]);

      for (let index = 0; index < length; index++) {
        append(data[index]);
      }
    }

    function appendBinArray(data) {
      let length = data.length;

      if (length <= 0xff) appendBytes([0xc4, length]);
      else if (length <= 0xffff) appendBytes([0xc5, length >>> 8, length]);
      else
        appendBytes([0xc6, length >>> 24, length >>> 16, length >>> 8, length]);

      appendBytes(data);
    }

    function appendObject(data) {
      let length = 0;
      for (let key in data) {
        if (data[key] !== undefined) {
          length++;
        }
      }

      if (length <= 0xf) appendByte(0x80 + length);
      else if (length <= 0xffff) appendBytes([0xde, length >>> 8, length]);
      else
        appendBytes([0xdf, length >>> 24, length >>> 16, length >>> 8, length]);

      for (let key in data) {
        let value = data[key];
        if (value !== undefined) {
          append(key);
          append(value);
        }
      }
    }

    function appendDate(data) {
      let sec = data.getTime() / 1000;
      if (data.getMilliseconds() === 0 && sec >= 0 && sec < 0x100000000) {
        // 32 bit seconds
        appendBytes([0xd6, 0xff, sec >>> 24, sec >>> 16, sec >>> 8, sec]);
      } else if (sec >= 0 && sec < 0x400000000) {
        // 30 bit nanoseconds, 34 bit seconds
        let ns = data.getMilliseconds() * 1000000;
        appendBytes([
          0xd7,
          0xff,
          ns >>> 22,
          ns >>> 14,
          ns >>> 6,
          ((ns << 2) >>> 0) | (sec / pow32),
          sec >>> 24,
          sec >>> 16,
          sec >>> 8,
          sec,
        ]);
      } else {
        // 32 bit nanoseconds, 64 bit seconds, negative values allowed
        let ns = data.getMilliseconds() * 1000000;
        appendBytes([0xc7, 12, 0xff, ns >>> 24, ns >>> 16, ns >>> 8, ns]);
        appendInt64(sec);
      }
    }

    function appendByte(byte) {
      if (array.length < length + 1) {
        let newLength = array.length * 2;
        while (newLength < length + 1) newLength *= 2;
        let newArray = new Uint8Array(newLength);
        newArray.set(array);
        array = newArray;
      }
      array[length] = byte;
      length++;
    }

    function appendBytes(bytes) {
      if (array.length < length + bytes.length) {
        let newLength = array.length * 2;
        while (newLength < length + bytes.length) newLength *= 2;
        let newArray = new Uint8Array(newLength);
        newArray.set(array);
        array = newArray;
      }
      array.set(bytes, length);
      length += bytes.length;
    }

    function appendInt64(value) {
      // Split 64 bit number into two 32 bit numbers because JavaScript only regards 32 bits for
      // bitwise operations.
      let hi, lo;
      if (value >= 0) {
        // Same as uint64
        hi = value / pow32;
        lo = value % pow32;
      } else {
        // Split absolute value to high and low, then NOT and ADD(1) to restore negativity
        value++;
        hi = Math.abs(value) / pow32;
        lo = Math.abs(value) % pow32;
        hi = ~hi;
        lo = ~lo;
      }
      appendBytes([
        hi >>> 24,
        hi >>> 16,
        hi >>> 8,
        hi,
        lo >>> 24,
        lo >>> 16,
        lo >>> 8,
        lo,
      ]);
    }
  }

  // Deserializes a MessagePack byte array to a value.
  //
  // array: The MessagePack byte array to deserialize. This must be an Array or Uint8Array containing bytes, not a string.
  // options: An object that defines additional options.
  // - multiple: (boolean) Indicates whether multiple concatenated MessagePack arrays are returned as an array. Default: false.
  function deserialize(array, options) {
    const pow32 = 0x100000000; // 2^32
    let pos = 0;
    if (array instanceof ArrayBuffer) {
      array = new Uint8Array(array);
    }
    if (typeof array !== "object" || typeof array.length === "undefined") {
      throw new Error(
        "Invalid argument type: Expected a byte array (Array or Uint8Array) to deserialize.",
      );
    }
    if (!array.length) {
      throw new Error(
        "Invalid argument: The byte array to deserialize is empty.",
      );
    }
    if (!(array instanceof Uint8Array)) {
      array = new Uint8Array(array);
    }
    let data;
    if (options && options.multiple) {
      // Read as many messages as are available
      data = [];
      while (pos < array.length) {
        data.push(read());
      }
    } else {
      // Read only one message and ignore additional data
      data = read();
    }
    return data;

    function read() {
      const byte = array[pos++];
      if (byte >= 0x00 && byte <= 0x7f) return byte; // positive fixint
      if (byte >= 0x80 && byte <= 0x8f) return readMap(byte - 0x80); // fixmap
      if (byte >= 0x90 && byte <= 0x9f) return readArray(byte - 0x90); // fixarray
      if (byte >= 0xa0 && byte <= 0xbf) return readStr(byte - 0xa0); // fixstr
      if (byte === 0xc0) return null; // nil
      if (byte === 0xc1) throw new Error("Invalid byte code 0xc1 found."); // never used
      if (byte === 0xc2) return false; // false
      if (byte === 0xc3) return true; // true
      if (byte === 0xc4) return readBin(-1, 1); // bin 8
      if (byte === 0xc5) return readBin(-1, 2); // bin 16
      if (byte === 0xc6) return readBin(-1, 4); // bin 32
      if (byte === 0xc7) return readExt(-1, 1); // ext 8
      if (byte === 0xc8) return readExt(-1, 2); // ext 16
      if (byte === 0xc9) return readExt(-1, 4); // ext 32
      if (byte === 0xca) return readFloat(4); // float 32
      if (byte === 0xcb) return readFloat(8); // float 64
      if (byte === 0xcc) return readUInt(1); // uint 8
      if (byte === 0xcd) return readUInt(2); // uint 16
      if (byte === 0xce) return readUInt(4); // uint 32
      if (byte === 0xcf) return readUInt(8); // uint 64
      if (byte === 0xd0) return readInt(1); // int 8
      if (byte === 0xd1) return readInt(2); // int 16
      if (byte === 0xd2) return readInt(4); // int 32
      if (byte === 0xd3) return readInt(8); // int 64
      if (byte === 0xd4) return readExt(1); // fixext 1
      if (byte === 0xd5) return readExt(2); // fixext 2
      if (byte === 0xd6) return readExt(4); // fixext 4
      if (byte === 0xd7) return readExt(8); // fixext 8
      if (byte === 0xd8) return readExt(16); // fixext 16
      if (byte === 0xd9) return readStr(-1, 1); // str 8
      if (byte === 0xda) return readStr(-1, 2); // str 16
      if (byte === 0xdb) return readStr(-1, 4); // str 32
      if (byte === 0xdc) return readArray(-1, 2); // array 16
      if (byte === 0xdd) return readArray(-1, 4); // array 32
      if (byte === 0xde) return readMap(-1, 2); // map 16
      if (byte === 0xdf) return readMap(-1, 4); // map 32
      if (byte >= 0xe0 && byte <= 0xff) return byte - 256; // negative fixint
      console.debug("msgpack array:", array);
      throw new Error(
        "Invalid byte value '" +
        byte +
        "' at index " +
        (pos - 1) +
        " in the MessagePack binary data (length " +
        array.length +
        "): Expecting a range of 0 to 255. This is not a byte array.",
      );
    }

    function readInt(size) {
      let value = 0;
      let first = true;
      while (size-- > 0) {
        if (first) {
          let byte = array[pos++];
          value += byte & 0x7f;
          if (byte & 0x80) {
            value -= 0x80; // Treat most-significant bit as -2^i instead of 2^i
          }
          first = false;
        } else {
          value *= 256;
          value += array[pos++];
        }
      }
      return value;
    }

    function readUInt(size) {
      let value = 0;
      while (size-- > 0) {
        value *= 256;
        value += array[pos++];
      }
      return value;
    }

    function readFloat(size) {
      let view = new DataView(array.buffer, pos + array.byteOffset, size);
      pos += size;
      if (size === 4) return view.getFloat32(0, false);
      if (size === 8) return view.getFloat64(0, false);
    }

    function readBin(size, lengthSize) {
      if (size < 0) size = readUInt(lengthSize);
      let data = array.subarray(pos, pos + size);
      pos += size;
      return data;
    }

    function readMap(size, lengthSize) {
      if (size < 0) size = readUInt(lengthSize);
      let data = {};
      while (size-- > 0) {
        let key = read();
        data[key] = read();
      }
      return data;
    }

    function readArray(size, lengthSize) {
      if (size < 0) size = readUInt(lengthSize);
      let data = [];
      while (size-- > 0) {
        data.push(read());
      }
      return data;
    }

    function readStr(size, lengthSize) {
      if (size < 0) size = readUInt(lengthSize);
      let start = pos;
      pos += size;
      return decodeUtf8(array, start, size);
    }

    function readExt(size, lengthSize) {
      if (size < 0) size = readUInt(lengthSize);
      let type = readUInt(1);
      let data = readBin(size);
      switch (type) {
        case 255:
          return readExtDate(data);
      }
      return {
        type: type,
        data: data
      };
    }

    function readExtDate(data) {
      if (data.length === 4) {
        let sec =
          ((data[0] << 24) >>> 0) +
          ((data[1] << 16) >>> 0) +
          ((data[2] << 8) >>> 0) +
          data[3];
        return new Date(sec * 1000);
      }
      if (data.length === 8) {
        let ns =
          ((data[0] << 22) >>> 0) +
          ((data[1] << 14) >>> 0) +
          ((data[2] << 6) >>> 0) +
          (data[3] >>> 2);
        let sec =
          (data[3] & 0x3) * pow32 +
          ((data[4] << 24) >>> 0) +
          ((data[5] << 16) >>> 0) +
          ((data[6] << 8) >>> 0) +
          data[7];
        return new Date(sec * 1000 + ns / 1000000);
      }
      if (data.length === 12) {
        let ns =
          ((data[0] << 24) >>> 0) +
          ((data[1] << 16) >>> 0) +
          ((data[2] << 8) >>> 0) +
          data[3];
        pos -= 8;
        let sec = readInt(8);
        return new Date(sec * 1000 + ns / 1000000);
      }
      throw new Error("Invalid data length for a date value.");
    }
  }

  // Encodes a string to UTF-8 bytes.
  function encodeUtf8(str) {
    // Prevent excessive array allocation and slicing for all 7-bit characters
    let ascii = true,
      length = str.length;
    for (let x = 0; x < length; x++) {
      if (str.charCodeAt(x) > 127) {
        ascii = false;
        break;
      }
    }

    // Based on: https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
    let i = 0,
      bytes = new Uint8Array(str.length * (ascii ? 1 : 4));
    for (let ci = 0; ci !== length; ci++) {
      let c = str.charCodeAt(ci);
      if (c < 128) {
        bytes[i++] = c;
        continue;
      }
      if (c < 2048) {
        bytes[i++] = (c >> 6) | 192;
      } else {
        if (c > 0xd7ff && c < 0xdc00) {
          if (++ci >= length)
            throw new Error("UTF-8 encode: incomplete surrogate pair");
          let c2 = str.charCodeAt(ci);
          if (c2 < 0xdc00 || c2 > 0xdfff)
            throw new Error(
              "UTF-8 encode: second surrogate character 0x" +
              c2.toString(16) +
              " at index " +
              ci +
              " out of range",
            );
          c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
          bytes[i++] = (c >> 18) | 240;
          bytes[i++] = ((c >> 12) & 63) | 128;
        } else bytes[i++] = (c >> 12) | 224;
        bytes[i++] = ((c >> 6) & 63) | 128;
      }
      bytes[i++] = (c & 63) | 128;
    }
    return ascii ? bytes : bytes.subarray(0, i);
  }

  // Decodes a string from UTF-8 bytes.
  function decodeUtf8(bytes, start, length) {
    // Based on: https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
    let i = start,
      str = "";
    length += start;
    while (i < length) {
      let c = bytes[i++];
      if (c > 127) {
        if (c > 191 && c < 224) {
          if (i >= length)
            throw new Error("UTF-8 decode: incomplete 2-byte sequence");
          c = ((c & 31) << 6) | (bytes[i++] & 63);
        } else if (c > 223 && c < 240) {
          if (i + 1 >= length)
            throw new Error("UTF-8 decode: incomplete 3-byte sequence");
          c = ((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
        } else if (c > 239 && c < 248) {
          if (i + 2 >= length)
            throw new Error("UTF-8 decode: incomplete 4-byte sequence");
          c =
            ((c & 7) << 18) |
            ((bytes[i++] & 63) << 12) |
            ((bytes[i++] & 63) << 6) |
            (bytes[i++] & 63);
        } else
          throw new Error(
            "UTF-8 decode: unknown multibyte start 0x" +
            c.toString(16) +
            " at index " +
            (i - 1),
          );
      }
      if (c <= 0xffff) str += String.fromCharCode(c);
      else if (c <= 0x10ffff) {
        c -= 0x10000;
        str += String.fromCharCode((c >> 10) | 0xd800);
        str += String.fromCharCode((c & 0x3ff) | 0xdc00);
      } else
        throw new Error(
          "UTF-8 decode: code point 0x" +
          c.toString(16) +
          " exceeds UTF-16 reach",
        );
    }
    return str;
  }

  // The exported functions
  return {
    serialize: serialize,
    deserialize: deserialize,

    // Compatibility with other libraries
    encode: serialize,
    decode: deserialize,
  };
})();

if (typeof window !== "undefined") {
  window.msgpack = msgpack;
}
path = require("path");
tune = require("./tune");
envmd = tune.envmd;
TuneError = tune.TuneError;
text2run = tune.text2run;

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
async function runFile(filename, ctx) {
  var parsed, node, text, lctx, res, module, spawnSync, result, sres, _i, _ref, _ref0, _ref1, _ref2, _ref3;
  var args = 3 <= arguments.length ? [].slice.call(arguments, 2, _i = arguments.length - 0) : (_i = 2, []);
  try {
    var parsed;
    parsed = pparse(filename);
    if ((parsed.ext === ".chat")) {
      var node;
      node = await ctx.resolve(filename);
      var text;
      text = await node.read();
      var lctx;
      lctx = ctx.clone();
      lctx.stack.push(node);
      lctx.ms.unshift(envmd(args[0]));
      var res;
      res = await lctx.text2run(text, {
        stop: "assistant"
      });
      _ref = res["slice"](-1)[0].content.replace(/@/g, "\\@");
    } else if (parsed.ext === ".mjs") {
      var module;
      module = await import(filename + "?t=" + Date.now());
      if ((typeof module.default !== "function")) throw Error("JS file does not export default function");
      _ref = module.default.call.apply(module.default, [].concat([ctx]).concat(args).concat([ctx]));
    } else if (parsed.ext === ".js" || parsed.ext === ".cjs") {
      var module;
      module = require(filename);
      if ((typeof module !== "function")) throw Error("JS file does not export default function");
      _ref = module.call.apply(module, [].concat([ctx]).concat(args).concat([ctx]));
    } else if (parsed.ext === ".py" || parsed.ext === ".php") {
      var spawnSync;
      spawnSync = require("child_process").spawnSync;
      var res;
      switch (parsed.ext) {
        case ".py":
          _ref0 = "python";
          break;
        case ".php":
          _ref0 = "php";
          break;
        default:
          _ref0 = undefined;
      }
      switch (parsed.ext) {
        case ".py":
          _ref1 = "run.py";
          break;
        case ".php":
          _ref1 = "run.php";
          break;
        default:
          _ref1 = undefined;
      }
      res = spawnSync(_ref0, Array(path.resolve(__dirname, _ref1)), {
        input: JSON.stringify({
          filename: filename,
          arguments: args[0],
          ctx: ""
        }),
        env: extend(process.env, ctx.env)
      });
      if (res.error) throw res.error;
      var result;
      result = Array();
      if (res.stderr.length) result.push(res.stderr.toString("utf8"));
      if (res.stdout.length) {
        var sres;
        try {
          _ref2 = msgpack.deserialize(Buffer.from(res.stdout.toString("utf8"), "hex"));
        } catch (e) {
          console.log("cant decode messageback", e);
          _ref2 = res.stdout.toString("utf8");
        }
        sres = _ref2;
        Array.isArray(sres) ? result = result.concat(sres) : result.push(sres);
      }
      if ((result.length === 1)) result = result[0];
      _ref = result;
    } else {
      _ref = undefined;
      throw Error(tpl("{ext} extension is not supported, for {filename} ", {
        ext: parsed.ext,
        filename: filename
      }));
    }
    _ref3 = _ref;
  } catch (e) {
    throw e;
  }
  return _ref3;
}
runFile;

function fsctx(paths, opts, fs) {
  var imageExt, audioExt, envCache;
  fs = fs || require("fs");
  if (!Array.isArray(paths)) paths = Array(paths);
  var imageExt;
  var audioExt;
  imageExt = "png jpeg jpg webp"
    .split(" ")
    .map((function(item) {
      return ("." + item);
    }));
  audioExt = "mp3 wav"
    .split(" ")
    .map((function(item) {
      return ("." + item);
    }));

  function mkfsmd1(p) {
    async function fsmd(name, args) {
      var self, result, parsed, dir, re, item, parsed1, fileType, fullname, schemaFile, schema, res, _i, _ref, _len, _ref0, _ref1, _ref2, _ref3;
      var self;
      var result;
      self = this;
      result = ((args.output === "all") ? [] : undefined);
      if (!name) return;
      var parsed;
      var dir;
      var re;
      parsed = ((args.match === "exact") ? pparse(path.resolve(p, name)) : undefined);
      dir = (((typeof parsed !== "undefined") && (parsed !== null) && !Number.isNaN(parsed) && (typeof parsed.dir !== "undefined") && (parsed.dir !== null) && !Number.isNaN(parsed.dir)) ? parsed.dir : (((typeof p !== "undefined") && (p !== null) && !Number.isNaN(p)) ? p : undefined));
      re = ((args.match === "regex") ? new RegExp(name) : undefined);
      if (!fs.existsSync(dir)) return;
      _ref = fs.readdirSync(dir)
        .sort((function(a, b) {
          var exts, idx1, idx2;
          var exts;
          var idx1;
          var idx2;
          exts = [".js", ".mjs", ".cjs", ".py", ".php", ".chat"];
          idx1 = exts.indexOf(path.extname(a));
          idx2 = exts.indexOf(path.extname(b));
          return (idx2 - idx1);
        }));
      for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
        item = _ref[_i];
        var parsed1;
        parsed1 = pparse(path.join(dir, item));
        if (((args.match === "exact") && (parsed.base !== item) && (parsed.base !== (parsed1.name + parsed1.ext2)) && (parsed.base !== parsed1.name))) continue;
        if ((re && !re.test(item))) continue;
        var fileType;
        if ((parsed1.ext2 === ".tool")) {
          _ref0 = "tool";
        } else if (parsed1.ext2 === ".llm") {
          _ref0 = "llm";
        } else if (parsed1.ext2 === ".proc") {
          _ref0 = "processor";
        } else if (parsed1.ext === ".jpg" || parsed1.ext === ".jpeg" || parsed1.ext === ".png" || parsed1.ext === ".webp") {
          _ref0 = "image";
        } else if (parsed1.ext === ".mp3" || parsed1.ext === ".wav") {
          _ref0 = "audio";
        } else if (parsed1.ext2 === ".ctx") {
          _ref0 = "context";
        } else {
          _ref0 = "text";
        }
        fileType = _ref0;
        var fullname;
        fullname = path.resolve(dir, item);
        if (((args.type !== "any") && (args.type !== fileType))) continue;
        var res;
        switch (fileType) {
          case "tool":
            var schemaFile;
            schemaFile = path.format({
              root: parsed1.root,
              dir: parsed1.dir,
              name: parsed1.name,
              ext: ".schema.json"
            });
            var schema;
            schema;
            if (fs.existsSync(schemaFile)) {
              schema = JSON.parse(fs.readFileSync(schemaFile, "utf8"));
            } else if (opts && opts.makeSchema && (opts.output !== "all")) {
              schema = await opts.makeSchema({
                text: fs.readFileSync(fullname, "utf8")
              }, self);
              fs.writeFileSync(schemaFile, schema);
              schema = JSON.parse(schema);
            } else {
              throw new Error(("schema file not found " + schemaFile));
            }
            _ref1 = {
              type: "tool",
              schema: schema,
              name: parsed1.name,
              exec: (async function(params, ctx) {
                return runFile(fullname, ctx, params);
              }),
              read: (async function() {
                return fs.readFileSync(fullname, "utf8");
              }),
              dirname: parsed1.dir,
              fullname: fullname
            }
            break;
          case "llm":
            _ref1 = {
              type: "llm",
              dirname: parsed1.dir,
              fullname: fullname,
              name: parsed1.name,
              exec: (async function(payload, ctx) {
                return runFile(fullname, ctx, payload);
              }),
              read: (async function() {
                return fs.readFileSync(fullname, "utf8");
              })
            }
            break;
          case "context":
            if ((args.output !== "all")) self.use((async function(name, args) {
              return runFile(fullname, this, name, args);
            }));
            _ref1 = {
              type: "text",
              fullname: fullname,
              name: parsed1.name,
              dirname: parsed1.dir,
              read: (async function() {
                return "";
              })
            }
            break;
          case "processor":
            _ref1 = {
              type: "processor",
              name: parsed1.name,
              exec: (function(node, args, ctx) {
                return runFile(fullname, ctx, node, args);
              }),
              read: (async function() {
                return fs.readFileSync(fullname, "utf8");
              }),
              dirname: parsed1.dir,
              fullname: fullname
            }
            break;
          case "image":
            if ((parsed1.ext === ".jpg" || parsed1.ext === ".jpeg")) {
              _ref2 = "image/jpeg";
            } else if (parsed1.ext === ".png") {
              _ref2 = "image/png";
            } else if (parsed1.ext === ".webp") {
              _ref2 = "image/webp";
            } else {
              _ref2 = undefined;
            }
            _ref1 = {
              type: "image",
              dirname: parsed1.dir,
              fullname: fullname,
              mimetype: _ref2,
              read: (async function() {
                return fs.readFileSync(fullname);
              })
            }
            break;
          case "audio":
            if ((parsed1.ext === ".mp3")) {
              _ref3 = "audio/mpeg";
            } else if (parsed1.ext === ".wav") {
              _ref3 = "audio/wav";
            } else {
              _ref3 = undefined;
            }
            _ref1 = {
              type: "audio",
              dirname: parsed1.dir,
              fullname: fullname,
              mimetype: _ref3,
              read: (async function() {
                return fs.readFileSync(fullname);
              })
            }
            break;
          case "text":
            _ref1 = {
              type: "text",
              dirname: parsed1.dir,
              fullname: fullname,
              name: parsed1.name,
              read: (async function(binary) {
                var stat, buf, i, c;
                var stat;
                stat = fs.lstatSync(fullname);
                if (stat.isDirectory()) return fs.readdirSync(fullname);
                if (binary) return fs.readFileSync(fullname);
                var buf;
                buf = fs.readFileSync(fullname, "utf8");
                var i;
                i = 0;
                while (i < Math.min(1024, buf.length)) {
                  var c;
                  c = buf.charCodeAt(i);
                  if (((c === 65533) || (c <= 8))) throw Error(tpl("{} is a binary file, can not include it", fullname));
                  i++;
                }
                return buf;
              })
            }
            break;
          default:
            _ref1 = undefined;
        }
        res = _ref1;
        if ((args.output === "all")) {
          result.push(res);
        } else {
          result = res;
          break;
        }
      }
      return result;
    }
    return fsmd;
  }
  mkfsmd1;
  envCache = {};
  return (async function(name, args) {
    var lpaths, handles, result, p, envFile, handle, res, _i, _ref, _len;
    var lpaths;
    lpaths = this.stack
      .filter((function(item) {
        return !!item.dirname;
      }))
      .map((function(item) {
        return item.dirname;
      }))
      .reverse()
      .concat(paths);
    var handles;
    handles = [];
    var result;
    result = ((args.output === "all") ? [] : undefined);
    _ref = lpaths;
    for (_i = 0, _len = _ref.length; _i < _len; ++_i) {
      p = _ref[_i];
      var envFile;
      envFile = path.resolve(p, ".env");
      if (!envCache[envFile]) envCache[envFile] = ((!envFile || !fs.existsSync(envFile)) ? {} : env2vars(fs.readFileSync(envFile, "utf8")));
      if (envCache[envFile][name]) return {
        type: "text",
        read: (async function() {
          return envCache[envFile][name];
        })
      };
      handles.push(mkfsmd1(p));
    }
    while (handles.length) {
      var handle;
      handle = handles.shift();
      var res;
      res = await handle.call(this, name, args);
      if (!res) continue;
      if ((args.output === "all")) {
        Array.isArray(res) ? result = result.concat(res) : result.push();
      } else {
        result = res;
        break;
      }
    }
    return result;
  });
}
fsctx;

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
exports.runFile = runFile;
exports.fsctx = fsctx;
exports.pparse = pparse;