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
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

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

// OpenRouter online search — uses :online models that perform web search server-side
// Paid but cheap: openai/gpt-4o-mini:online ($0.15/1M) — free tier has 0 results for sonar
export function createOpenRouterSearchProvider(): SearchProvider {
  const available = getKeys().length > 0;
  const model = process.env.OPENROUTER_SEARCH_MODEL || "openai/gpt-4o-mini:online";

  return {
    name: "openrouter-search",
    model,
    available,

    async search(query: string): Promise<SearchResult[]> {
      if (!available) return [];
      const keys = getKeys();
      for (let k = 0; k < keys.length; k++) {
        const key = nextKey(keys);
        try {
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
              messages: [
                {
                  role: "system",
                  content: "You are a research assistant. Use web search to answer. Prefer primary sources, forum and community threads, and product pages. Do not speculate. Keep your written answer to a few lines - the caller reads the underlying search results, not your prose.",
                },
                { role: "user", content: query },
              ],
              temperature: 0.2,
              max_tokens: 700,
            }),
            signal: AbortSignal.timeout(30_000),
          });

          const payload: any = await res.json();
          if (!res.ok) {
            const msg = payload.error?.message || `HTTP ${res.status}`;
            if (/429|quota|rate.?limit/i.test(msg) && k < keys.length - 1) continue;
            throw new Error(msg);
          }

          // Perplexity/sonar returns citations in message.citations or annotations
          // Fallback to parsing content for URLs
          const content: string = payload.choices?.[0]?.message?.content ?? "";
          const citations: any[] = payload.choices?.[0]?.message?.citations ?? payload.choices?.[0]?.message?.annotations ?? [];

          const results: SearchResult[] = [];
          if (citations.length > 0) {
            for (const c of citations) {
              const url = c.url || c.uri || "";
              if (!url) continue;
              results.push({
                title: c.title || url,
                url,
                snippet: (c.snippet || c.content || content).slice(0, 1200),
              });
            }
          } else {
            // Fallback: extract URLs from content
            const urlRegex = /https?:\/\/[^\s"')\]]+/g;
            const urls = content.match(urlRegex) || [];
            for (const url of urls.slice(0, 5)) {
              results.push({
                title: url,
                url,
                snippet: content.slice(0, 1200),
              });
            }
            // If no URLs but content exists, synthesize a result
            if (results.length === 0 && content.trim()) {
              results.push({
                title: query.slice(0, 80),
                url: `https://openrouter.ai/search?q=${encodeURIComponent(query)}`,
                snippet: content.slice(0, 1200),
              });
            }
          }

          if (results.length > 0) return results.slice(0, 5);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (/429|quota|rate.?limit/i.test(msg) && k < keys.length - 1) continue;
          console.error(`[openrouter-search] query failed: ${query}`, e);
          return [];
        }
      }
      return [];
    },
  };
}
