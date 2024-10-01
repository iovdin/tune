 {
  "description": "Transcribe audio using the Groq API",
  "parameters": {
    "type": "object",
    "properties": {
      "file": {
        "type": "string",
        "description": "Audio file to be transcribed"
      },
    },
    "required": ["file"]
  }
}