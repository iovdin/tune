{
  "description": "Generate sound effectx from text using Eleven Labs API",
  "parameters": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "The text to generate sound from"
      },
      "duration_seconds": {
        "type": "number",
        "description": "Duration of the sound in seconds"
      }
    },
    "required": ["text", "duration_seconds"]
  }
}
