 {
  "description": "Asynchronous function to write content to a file",
  "parameters": {
    "type": "object",
    "properties": {
      "filename": {
        "type": "string",
        "description": "The name of the file to write"
      },
      "text": {
        "type": "string",
        "description": "The content to write to the file"
      }
    },
    "required": ["filename", "text"]
  }
}