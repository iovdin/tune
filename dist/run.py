import sys
stdout = sys.stdout
sys.stdout = sys.stderr

import json
import importlib.util
import umsgpack

data = json.loads(input())
filename = data["filename"]
arguments = data.get("arguments", {})
ctx = data["ctx"]

spec = importlib.util.spec_from_file_location("module.name", filename)
module = importlib.util.module_from_spec(spec)
sys.modules["module.name"] = module
spec.loader.exec_module(module)


result = module.main(arguments)

stdout.write(umsgpack.packb(result).hex())
