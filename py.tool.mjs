import { spawnSync } from 'node:child_process';

export default async function py({text}) {
  //text = text.replace(/'''/g, "\'\'\'")
  //TODO escape '''
  // const script = `script = '''${text}'''\nprint(exec(script))`
  // console.log(script)
  const res = spawnSync("python", ["-c", text], {encoding: "utf8"});
  return (res.stdout || res.stderr || "").trim() 
}
