({
  url: "https://openrouter.ai/api/v1/chat/completions",
  method: "POST",
  headers: { 
    "content-type": "application/json",
    authorization: `Bearer ${OPENROUTER_KEY}` 
  },
  body: JSON.stringify({ 
    ...payload,
    model: "perplexity/llama-3.1-sonar-small-128k-online"
  })
})