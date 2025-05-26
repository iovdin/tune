const { createProviderContext } = require("./llm-utils");

async function fetchOpenRouterModels() {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
  });

  if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
  const content = await res.json();
  return content.data;
}

module.exports = createProviderContext("openrouter", {
  apiKeyEnv: "OPENROUTER_KEY",
  apiModelFetcher: fetchOpenRouterModels,
  //modelMatcher: (name) => true, // Handle all names
  // modelFilter: (models, name) => {
  //   const baseName = name.split(":")[0];
  //   return models.filter(item => item.id === baseName);
  // },
  createExecFunction: (model, payload, key) => {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://iovdin.github.io/tune",
        "X-Title": "tune"
      },
      body: JSON.stringify({
        model: model.id,
        ...payload,
        messages: payload.messages.filter(msg => msg.role !== 'comment'),
      }),
    };
  }
});
