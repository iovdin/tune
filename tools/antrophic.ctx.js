const { createProviderContext } = require("./llm-utils");

async function fetchAnthropicModels(apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    }
  });

  if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);

  const content = await res.json();
  return content.data;
}

module.exports = createProviderContext("anthropic", {
  apiKeyEnv: "ANTHROPIC_KEY",
  apiModelFetcher: fetchAnthropicModels,
  createExecFunction: (model, payload, key) => {
    return {
      url: "https://api.anthropic.com/v1/chat/completions",
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model.id,
        ...payload,
      }),
    };
  }
});
