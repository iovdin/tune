const path = require('path')

const models = require("tune-models")
const basics = require("tune-basic-toolset")
const tunefs = require("tune-fs")
const { current, writer } = tunefs

let dirs = [];
if (process.env.TUNE_PATH) {
  dirs = process.env.TUNE_PATH.split(path.delimiter);
}

module.exports = [
  current(),
  basics(),
  tunefs({ paths: dirs, makeSchema: true }),
  models({
    default: "gpt-5-mini",
    alias: { "sonnet": "claude-sonnet-4-20250514"}
  }),
  writer()
]
