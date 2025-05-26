const { createProviderContext } = require("./llm-utils");

async function fetchGeminiModels(apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`,
  );

  if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
  
  const content = await res.json();
  content.models.forEach(model => {
    model.id = model.name.split("/")[1]
  })
  return content.models;
}

module.exports = createProviderContext("gemini", {
  apiKeyEnv: "GEMINI_KEY",
  apiModelFetcher: fetchGeminiModels,
  //modelMatcher: (name) => name.indexOf("google/") === 0,
  // modelFilter: (models, name, args) => {
  //   const shortName = name.split("/")[1];
  //   return models
  //     .map((item) => ({ ...item, shortName: item.name.split("/")[1] }))
  //     .filter((item) => item.shortName === shortName);
  // },
  createExecFunction: (model, payload, key) => {
    // google does not like content to be null
    payload.messages.forEach((message) => {
      if (message.content === null) {
        message.content = [];
      }
    });

    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model.shortName || model.name.split("/")[1],
        ...payload,
        messages: payload.messages.filter(msg => msg.role !== 'comment'),
      }),
    };
  }
});
