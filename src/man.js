const fs = require("fs")
const path = require("path")
// all the registered manuals
// { name, description, filename/content } 

let mans = [
] 

/*
  @man include all manuals for all packages included
  @man/ - list all the manuals, like list directory
  @man/tune - get manual for tune core package 
  @man/tune-basic-toolset - get manual for tune-basic-tool set package

  TODO:
  @man/tune/js-api - lis
  @man/tune/agents - lis
*/

function read({ filename, content }) {
  if (content) {
    return content
  }
  if (!fs.existsSync(filename)) {
    return `file ${filename} not found`
  }
  return fs.readFileSync(filename)
}

module.exports = ({ mount } = {}) => async (name, { type }) => {
  if ((type || "any") !== 'any' && type !== 'text' ) {
    return
  }
  mount ||= "man"

  // supported only with mount
  if (!mount) {
    return 
  }

  // @man include all the manuals
  if (name === mount) {
    return {
      type: "text",
      name,
      read: async () => mans.map(man => `<${man.name}>\n ${read(man)} \n</${man.name}>`).join("\n")
    }
  }

  if (!name.startsWith(mount + '/')) {
    return 
  }

  // @man/ - list all the manuals to include
  if (name === mount + '/') {
    return {
      type: "text",
      name,
      read: async () => mans.map(man => `${man.name} - ${man.description}`).join("\n")
    }
  }


  // @man/tune - get manual for tune core package 
  // @man/tune-basic-toolset - get manual for tune-basic-tool set package
  
  const actualName = name.slice(mount.length + 1);

  const man = mans.find(man => man.name === actualName);
  if (!man) return

  return {
    type: "text",
    name,
    read: async() => read(man.filename)
  }
}

const addManual = (dirname) => {
  let package = path.resolve(dirname, "package.json");
  if (!fs.existsSync(package)){
    dirname = path.resolve(dirname, "..")
    package = path.resolve(dirname, "package.json");
  }

  if (!fs.existsSync(package)){
    throw Error(`cant make manual ${package} not found`);
  }

  const { name, version, description } = JSON.parse(fs.readFileSync(package, "utf8"));

  const newMans = mans.filter(man => man.name !== name)

  const filename = path.resolve(dirname, "README.md")

  newMans.push({name, description, filename})
  mans = newMans
}

addManual(__dirname)
/*
const addManual = ({name, description, content, filename}) => {
  const  = params;

  const newMans = mans.filter(man => man.name !== name)
  if (!name) {
    throw Error(`name is not set for manual`)
  }
  if (!content && !filename) {
    throw Error(`neither content nor filename is set for '${name}' manual`)
  }

  newMans.push({name, description, content, filename})
}
*/

module.exports.addManual = addManual;
