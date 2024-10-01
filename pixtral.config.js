({
    url: "https://openrouter.ai/api/v1/chat/completions",
    method: "POST",
    headers: { 
      "content-type": "application/json",
      authorization: `Bearer ${OPENROUTER_KEY}` 
    },
    body: JSON.stringify({ 
      ...payload,
      model: "mistralai/pixtral-12b"
  })
})
