const vm = require('node:vm');
module.exports = async function js({ text }, ctx) {
  const code = `(async () =>{\n${text}\n})()`
  try {
    return vm.runInContext(code, vm.createContext({ ctx }))
  } catch (e) {
    return e.stack
  }
}
