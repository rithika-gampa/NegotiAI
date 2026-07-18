// Multi-provider LLM client with automatic fallback.
// Set PRIMARY_PROVIDER and BACKUP_PROVIDERS (comma-separated) in env.
// Supported providers: "xai", "groq", "gemini", "anthropic"
//
// All providers are normalized to the same call signature:
//   callProvider(providerName, { systemPrompt, userContent })
// and all return: { text, provider }  (text is the raw model output string)

const PROVIDER_CONFIG = {
  xai: {
    envKey: "XAI_API_KEY",
    model: process.env.XAI_MODEL || "grok-4.20-reasoning",
    url: "https://api.x.ai/v1/chat/completions",
    call: callOpenAICompatible,
  },
  groq: {
    envKey: "GROQ_API_KEY",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    url: "https://api.groq.com/openai/v1/chat/completions",
    call: callOpenAICompatible,
  },
  gemini: {
    envKey: "GEMINI_API_KEY",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    call: callGemini,
  },
  anthropic: {
    envKey: "ANTHROPIC_API_KEY",
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    url: "https://api.anthropic.com/v1/messages",
    call: callAnthropic,
  },
};

// Caps how long any single provider attempt can take. Without this, a
// slow/hanging provider (not just an outright error) would stall the whole
// negotiation request instead of failing over to the next provider in chain.
const PROVIDER_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`timed out after ${PROVIDER_TIMEOUT_MS}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAICompatible(config, apiKey, { systemPrompt, userContent }) {
  const res = await fetchWithTimeout(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`${config.model} error: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(config, apiKey, { systemPrompt, userContent }) {
  const res = await fetchWithTimeout(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!res.ok) throw new Error(`${config.model} error: ${await res.text()}`);
  const data = await res.json();
  return data.content.map((c) => c.text || "").join("\n");
}

async function callGemini(config, apiKey, { systemPrompt, userContent }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
    }),
  });
  if (!res.ok) throw new Error(`${config.model} error: ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0].content.parts.map((p) => p.text || "").join("\n");
}

function getProviderChain() {
  const primary = process.env.PRIMARY_PROVIDER || "xai";
  const backups = (process.env.BACKUP_PROVIDERS || "groq,gemini")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [primary, ...backups.filter((p) => p !== primary)];
}

// Tries each provider in the configured chain until one succeeds.
// Throws only if every configured (and API-key-present) provider fails.
async function callWithFallback({ systemPrompt, userContent }) {
  const chain = getProviderChain();
  const errors = [];

  for (const providerName of chain) {
    const config = PROVIDER_CONFIG[providerName];
    if (!config) {
      errors.push(`${providerName}: unknown provider`);
      continue;
    }
    const apiKey = process.env[config.envKey];
    if (!apiKey) {
      errors.push(`${providerName}: ${config.envKey} not set, skipping`);
      continue;
    }
    try {
      const text = await config.call(config, apiKey, { systemPrompt, userContent });
      return { text, provider: providerName };
    } catch (err) {
      console.error(`Provider ${providerName} failed:`, err.message);
      errors.push(`${providerName}: ${err.message}`);
    }
  }

  throw new Error(`All providers failed or unconfigured. Chain: [${chain.join(", ")}]. Details: ${errors.join(" | ")}`);
}

module.exports = { callWithFallback, getProviderChain };
