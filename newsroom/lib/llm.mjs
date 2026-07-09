/**
 * OpenRouter chat helper — same provider the app's /api/daily-summary route
 * uses, so one OPENROUTER_API_KEY covers both. Per-agent model overrides come
 * from the agent config (`model`); otherwise OPENROUTER_MODEL or the default.
 */

const API = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

export function hasApiKey() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function chat({ system, user, model, temperature = 0.4, maxTokens = 4096 }) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch(API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
      "X-Title": "Debrief Newsroom",
    },
    body: JSON.stringify({
      model: model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`OpenRouter ${res.status}: ${detail}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter returned an empty completion");
  return text.trim();
}

/** Chat, expecting a JSON object/array back. Tolerates ```json fences. */
export async function chatJSON(opts) {
  const raw = await chat(opts);
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  // Fall back to the outermost {...} or [...] if the model added prose.
  const candidates = [stripped];
  const objMatch = stripped.match(/[\[{][\s\S]*[\]}]/);
  if (objMatch) candidates.push(objMatch[0]);
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      /* try next */
    }
  }
  throw new Error(`Model did not return valid JSON:\n${raw.slice(0, 400)}`);
}
