const { createProviderContext } = require("./llm-utils");

async function fetchOpenAIModels(apiKey) {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
  const content = await res.json();
  return content.data;
}

module.exports = createProviderContext("openai", {
  apiKeyEnv: "OPENAI_KEY",
  apiModelFetcher: fetchOpenAIModels,
  createExecFunction: (model, payload, key) => {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model.id,
        ...payload,
        messages: payload.messages.filter(msg => msg.role !== 'comment'),
      }),
    };
  }
});