({
    url: "https://openrouter.ai/api/v1/chat/completions",
    method: "POST",
    headers: { 
      "content-type": "application/json",
      authorization: `Bearer ${OPENROUTER_KEY}` 
    },
    body: JSON.stringify({ 
      ...payload,
      model: "anthropic/claude-3.5-sonnet"
  })
})