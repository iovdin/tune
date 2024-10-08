({
  url: "https://openrouter.ai/api/v1/chat/completions",
  method: "POST",
  headers: { 
    "content-type": "application/json",
    "authorization": `Bearer ${OPENROUTER_KEY}`
  },
  body: JSON.stringify({ 
    ...payload,
    model: "microsoft/phi-3.5-mini-128k-instruct",
  })
})
