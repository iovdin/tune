 {
  "description": "Execute JavaScript code synchronously",
  "parameters": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "The JavaScript code to execute"
      }
    },
    "required": ["text"]
  },
  "returns": {
    "type": "string",
    "description": "Output from executing the JavaScript code"
  }
}