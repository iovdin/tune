export default async function append({filename, text}) {
  const content = await this.read(filename) || ""
  await this.write(filename, `${content}\n${text}`)
  return "done"
}
