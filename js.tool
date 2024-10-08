 {
  "description": "Execute a given JavaScript code snippet and return the result",
  "parameters": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "The JavaScript code to be executed"
      },
      "inputType": {
        "type": "string",
        "enum": ["module", "commonjs"],
        "description": "Type of script (module or commonjs), default it commonjs",
        "default": "commonjs"
      }
    },
    "required": ["text", "inputType"]
  }
}
