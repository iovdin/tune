const path = require('path')

const man = require("tune-sdk/man");
const models = require("tune-models")
const basics = require("tune-basic-toolset")
const tunefs = require("tune-fs")
const { current, writer } = tunefs

let dirs = [];
if (process.env.TUNE_PATH) {
  dirs = process.env.TUNE_PATH.split(path.delimiter);
}

module.exports = [
  man(),
  current(),
  basics(),
  tunefs({ paths: dirs, makeSchema: true }),
  models({
    default: "gpt-5.4",
    alias: { "sonnet": "claude-sonnet-4-6"}
  }),
  writer()
]
