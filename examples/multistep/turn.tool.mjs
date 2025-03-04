import fs from "fs"; 

export default async function turn({ role, filename }) {
  if (filename) {
    fs.writeFileSync(filename, `@@${role}`);
  }
  return `${role} turn`
}
