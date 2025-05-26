const { createProviderContext } = require("./llm-utils");

async function fetchMistralModels(apiKey) {
  const res = await fetch("https://api.mistral.ai/v1/models", {
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
  const content = await res.json();
  return content.data;
}

function hashIntegerToBase62(num) {
  const crypto = require("crypto");
  const base62chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const buffer = crypto.createHash("sha256").update(num.toString()).digest();

  let hashValue = "";
  for (let i = 0; hashValue.length < 9 && i < buffer.length; i++) {
    const index = buffer[i] % base62chars.length;
    hashValue += base62chars.charAt(index);
  }

  return hashValue.padEnd(9, "0");
}

module.exports = createProviderContext("mistral", {
  apiKeyEnv: "MISTRAL_KEY",
  apiModelFetcher: fetchMistralModels,
  // modelMatcher: (name) => true, // Handle all names and filter later
  // modelFilter: (models, name) => models.filter(item => item.id === name),
  createExecFunction: (model, payload, key, context) => {
    const { messages, ...rest } = payload;

    // Format tool IDs for Mistral (must be 9 symbols)
    messages.forEach((msg) => {
      if (msg.role === "tool") {
        msg.tool_call_id = hashIntegerToBase62(msg.tool_call_id);
      }
      if (msg.tool_calls) {
        msg.tool_calls.forEach((tc) => {
          tc.id = hashIntegerToBase62(tc.id);
        });
      }
    });

    return {
      url: "https://api.mistral.ai/v1/chat/completions",
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: messages.filter(msg => msg.role !== 'comment'),
        ...rest,
      }),
    };
  }
});
