import { parseScript } from 'esprima';
import { generate } from 'escodegen';
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync }  from 'node:fs';
import { randomBytes } from 'crypto';

export default async function execute({ text, inputType }, ctx) {
  // Parse the code into an Abstract Syntax Tree (AST)
  const ast = parseScript(text, { range: true });

  if (ast.body.length === 0) {
    return null;
  }

  const lastNode = ast.body[ast.body.length - 1];
  let modified = false;

  // If the last statement is an expression, replace it with an assignment
  if (lastNode.type === 'ExpressionStatement') {
    const assignExpression = {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'Identifier',
          name: 'myVariable'
        },
        right: lastNode.expression
      }
    };
    ast.body[ast.body.length - 1] = assignExpression;
    modified = true;
  }

  const rand = randomBytes(50).toString('hex').substring(0, 10);
  const filename = (inputType === "module") ? `tune${rand}.mjs`:`tune${rand}.js`;

  let modifiedCode = generate(ast);
  if (modified) {
    if (inputType === "module") {
      modifiedCode = `${modifiedCode}\nimport util from 'util';\nconsole.log(util.inspect(myVariable)) `
    } else  {
      modifiedCode = `${modifiedCode}\nconsole.log(require("util").inspect(myVariable))`
    }
  }
  writeFileSync(filename, modifiedCode)

  try {
    const res = spawnSync("node", [filename], 
      { 
        encoding: "utf8",
        input: modifiedCode, 
      });

    return (res.stderr + res.stdout).trim();
  } finally {
    unlinkSync(filename)
  }
}
