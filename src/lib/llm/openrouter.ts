import type {
  LLMProvider,
  SearchProvider,
  SearchResult,
  StructuredRequest,
  StructuredResult,
} from "./types";

/**
 * OpenRouter adapter — unified access to 200+ models with free tier.
 * Uses OpenAI-compatible API: https://openrouter.ai/docs/api-reference/overview
 * Free models: meta-llama/llama-3.3-70b:free, google/gemini-flash-1.5:free, etc.
 */

function getKeys(): string[] {
  const raw = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || "";
  return raw.split(",").map(k=>k.trim()).filter(Boolean);
}
let idx = 0;
function nextKey(keys: string[]): string {
  const k = keys[idx % keys.length];
  idx = (idx + 1) % keys.length;
  return k;
}
function apiKey(): string {
  const keys = getKeys();
  if (keys.length === 0) throw new Error("OPENROUTER_API_KEY is not set.");
  return nextKey(keys);
}

export function createOpenRouterProvider(): LLMProvider {
  // Free tier default — also supports any OpenRouter model via env
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

  return {
    name: "openrouter",
    model,

    async structured<T>(
      req: StructuredRequest<T>,
    ): Promise<StructuredResult<T>> {
      const keys = getKeys();
      if (keys.length === 0) throw new Error("OPENROUTER_API_KEY is not set.");

      const system = `${req.system}\n\nRespond with a single JSON object conforming exactly to this JSON Schema. Output JSON only - no prose, no markdown fences.\n\n${JSON.stringify(req.jsonSchema)}`;

      const messages = [
        { role: "system" as const, content: system },
        ...req.messages,
      ];

      let lastError: unknown;
      let raw = "";

      for (let k = 0; k < keys.length; k++) {
        const key = nextKey(keys);
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://brains-app-rho.vercel.app",
              "X-Title": "BRAINS AI",
            },
            body: JSON.stringify({
              model,
              messages:
                attempt === 0
                  ? messages
                  : [
                      ...messages,
                      { role: "assistant" as const, content: raw },
                      {
                        role: "user" as const,
                        content: `That response did not match the required schema: ${String(lastError)}. Return corrected JSON only.`,
                      },
                    ],
              temperature: req.temperature ?? 0.3,
              max_tokens: req.maxTokens ?? 2048,
              response_format: { type: "json_object" } as any,
            }),
            signal: AbortSignal.timeout(60_000),
          });

          const payload: any = await res.json();
          if (!res.ok) {
            const msg = payload.error?.message || `HTTP ${res.status}`;
            if (/429|quota|rate.?limit/i.test(msg) && k < keys.length - 1) {
              lastError = msg;
              break; // try next key
            }
            throw new Error(msg);
          }

          raw = payload.choices?.[0]?.message?.content ?? "";
          try {
            const parsed = req.schema.parse(JSON.parse(stripFences(raw)));
            return { data: parsed, model, raw };
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
          }
        }
        if (k === keys.length - 1) break;
        // if last attempt was schema error not quota, don't rotate, just throw
        if (lastError && !/429|quota|rate.?limit/i.test(String(lastError))) break;
      }

      throw new Error(
        `OpenRouter returned output that did not match schema "${req.name}": ${String(lastError)}`,
      );
    },
  };
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

// OpenRouter search via its :online models (e.g. openai/gpt-4o:online) — not used for search,
// we keep search on Gemini/Groq. This is a no-op search provider for when OpenRouter is LLM only.
export function createOpenRouterSearchProvider(): SearchProvider {
  return {
    name: "openrouter-search",
    model: "openrouter",
    available: false,
    async search(): Promise<SearchResult[]> {
      return [];
    },
  };
}
