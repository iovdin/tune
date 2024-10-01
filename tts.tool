{
  "description": "Fetch audio from OpenAI's TTS",
  "parameters": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "Text input to convert to speech"
      },
      "voice": {
        "type": "string",
        "enum": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
        "description": "Voice type to use for TTS"
      }
    },
    "required": ["text", "voice"]
  }
}