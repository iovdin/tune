const fs = require("fs")
const path = require("path")
// all the registered manuals
// { name, description, filename/content } 


// i have to make to keep mans in globalThis because keeping it in module context
// breaks when few copies of tune-sdk is installed
let globalKey = "tune.man";

function getStore() {
  globalThis[globalKey] ||= []
  return globalThis[globalKey]
}

/*
  @man include all manuals for all packages included
  @man/ - list all the manuals, like list directory
  @man/tune - get manual for tune core package 
  @man/tune-basic-toolset - get manual for tune-basic-tool set package

  TODO: subdocuments
  @man/tune/js-api - lis
  @man/tune/agents - lis
*/

function read(man) {
  const store = getStore()

  const { filename, content } = man
  if (content) {
    return content
  }
  if (!fs.existsSync(filename)) {
    return `file ${filename} not found`
  }
  return fs.readFileSync(filename)
}

module.exports = ({ mount } = {}) => {
  mount ||= "man"
  return async (name, { type, match, output }) => {
    if ((type || "any") !== 'any' && type !== 'text' ) {
      return
    }

    // supported only with mount
    if (!mount) {
      return 
    }

    const mans = getStore()

    if (match === "regex") {
      re = new RegExp(name);
      const result = mans.filter(man => re.test(`${mount}/${man.name}`)).map(man => ({
        type: "text",
        source: "docs",
        name: `${mount}/${man.name}`,
        read: async () => read(man) 
      }))

      // @man/
      if (re.test(`${mount}/`)) {
        result.unshift({
          type: "text",
          name: `${mount}/`,
          source: "docs",
          read: async () => mans.map(man => `${man.name} - ${man.description}`).join("\n")
        })
      }

      // @man 
      if (re.test(mount)) {
        result.unshift({
          type: "text",
          name: mount,
          source: "docs",
          read: async () => mans.map(man => `<${man.name}>\n ${read(man)} \n</${man.name}>`).join("\n")
        })
      }


      if (!result.length) {
        return
      }
      if (output === "all") {
        return result
      }
      return result[0]
    }

    // @man include all the manuals
    if (name === mount) {
      return ({
        type: "text",
        name,
        read: async () => mans.map(man => `<${man.name}>\n ${read(man)} \n</${man.name}>`).join("\n")
      })
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
      read: async() => read(man)
    }
  }
}

const add = (man) => {
  const {name, description, content, filename} = man
  if (!content && !filename) {
    throw Error(`neither content nor filename is set for '${name}' manual`)
  }

  const mans = getStore() 

  let idx = mans.findIndex(man => man.name === name)
  if (idx !== -1) {
    mans.splice(idx, 1, man)
  } else {
    mans.push(man)
  }
}

const addPackage = (dirname) => {
  let package = path.resolve(dirname, "package.json");
  if (!fs.existsSync(package)){
    dirname = path.resolve(dirname, "..")
    package = path.resolve(dirname, "package.json");
  }

  if (!fs.existsSync(package)){
    throw Error(`cant make manual ${package} not found`);
  }

  const { name, version, description } = JSON.parse(fs.readFileSync(package, "utf8"));

  const filename = path.resolve(dirname, "README.md")
  add({ name, version, description, filename })

}

// add tune-sdk package
addPackage(__dirname)


module.exports.add = add;
module.exports.addPackage = addPackage;
