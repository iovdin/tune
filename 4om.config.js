({
  url: "https://api.openai.com/v1/chat/completions",
  method: "POST",
  headers: { 
    "content-type": "application/json",
    "authorization": `Bearer ${OPENAI_KEY}`
  },
  body: JSON.stringify({ 
    ...payload,
    model: "gpt-4o-mini",
  })
})
