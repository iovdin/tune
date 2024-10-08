import { promises as fs } from 'fs';
import { relative, dirname } from 'path' 

export default async function readFile({ filename }, ctx) {
  const relFile = relative(dirname(ctx.top.filename), filename)
  return`{${relFile}}`

}
