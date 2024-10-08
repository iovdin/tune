import ast
import sys

def main(params):
    parsed = ast.parse(params['text'])
    

    last_stmt = parsed.body[-1]
    if isinstance(last_stmt, ast.Expr):
        parsed.body[-1] = ast.Assign(
                targets=[ast.Name(id='myvariable', ctx=ast.Store())],
                value=last_stmt.value)

    ast.fix_missing_locations(parsed)
    compiled = compile(parsed, filename="cell.py", mode="exec")
    namespace = {}
    exec(compiled, namespace)

    return namespace.get('myvariable', None) 
    
