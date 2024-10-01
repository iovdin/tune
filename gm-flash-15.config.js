({
    url: "https://openrouter.ai/api/v1/chat/completions",
    method: "POST",
    headers: { 
      "content-type": "application/json",
      authorization: `Bearer ${OPENROUTER_KEY}` 
    },
    body: JSON.stringify({ 
      ...payload,
      model: "google/gemini-flash-1.5"
  })
})
