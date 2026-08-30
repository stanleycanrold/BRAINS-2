import Groq from "groq-sdk";
import type {
  LLMProvider,
  SearchProvider,
  SearchResult,
  StructuredRequest,
  StructuredResult,
} from "./types";

/**
 * Groq adapter - the phase-1 provider.
 *
 * Two distinct models are used, deliberately:
 *  • GROQ_MODEL - a fast instruct model with strict JSON-schema
 *                        decoding, for every structured agent call.
 *  • GROQ_SEARCH_MODEL - Groq's agentic "compound" model, which performs real
 *                        web searches server-side and returns the underlying
 *                        results. That is what lets research output carry
 *                        genuine source URLs rather than model recall, which
 *                        the PRD requires (§4.2 acceptance criteria).
 */

function client() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set.");
  return new Groq({ apiKey });
}

/** Models that reject `response_format: json_schema`, discovered at runtime. */
const noSchemaSupport = new Set<string>();

function isUnsupportedSchemaError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("does not support response format") ||
    message.includes("json_schema") ||
    message.includes("JSON schema") ||
    message.includes("required")
  );
}

type RateLimitedError = { status?: number; headers?: { get?: (k: string) => string | null } };

function isRateLimited(err: unknown): boolean {
  const status = (err as RateLimitedError)?.status;
  return status === 429 || status === 413;
}

/**
 * Groq's free tier is token-per-minute limited (8k TPM on the default model at
 * the time of writing), and a validation pipeline issues several agent calls
 * in quick succession. Rather than surface a rate-limit error to a founder
 * mid-run, back off and retry - honouring the server's own `retry-after`.
 */
async function withRateLimitRetry<T>(
  operation: () => Promise<T>,
  attempts = 4,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (!isRateLimited(err) || attempt === attempts - 1) throw err;

      const header = (err as RateLimitedError)?.headers?.get?.("retry-after");
      const retryAfter = header ? Number(header) : NaN;
      const delayMs = Number.isFinite(retryAfter)
        ? Math.min(retryAfter * 1000 + 250, 30_000)
        : Math.min(2 ** attempt * 1000, 30_000);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export function createGroqProvider(): LLMProvider {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  return {
    name: "groq",
    model,

    async structured<T>(
      req: StructuredRequest<T>,
    ): Promise<StructuredResult<T>> {
      const groq = client();

      // Not every Groq model supports strict schema decoding. Where it isn't
      // available we fall back to plain JSON mode with the schema inlined into
      // the system prompt - the zod parse below is the real guarantee either
      // way, so behaviour is identical, just less constrained during decoding.
      const strict = !noSchemaSupport.has(model);

      const system = strict
        ? req.system
        : `${req.system}\n\nRespond with a single JSON object conforming exactly to this JSON Schema. Output JSON only - no prose, no markdown fences.\n\n${JSON.stringify(
            req.jsonSchema,
          )}`;

      const messages = [
        { role: "system" as const, content: system },
        ...req.messages,
      ];

      let lastError: unknown;
      let raw = "";

      // One retry with the validation error fed back - models occasionally
      // miss an enum value, and a targeted repair is far cheaper than failing
      // the whole pipeline step.
      for (let attempt = 0; attempt < 2; attempt++) {
        let completion;
        try {
          completion = await withRateLimitRetry(() =>
            groq.chat.completions.create({
              model,
              messages:
                attempt === 0
                  ? messages
                  : [
                      ...messages,
                      { role: "assistant" as const, content: raw },
                      {
                        role: "user" as const,
                        content: `That response did not match the required schema: ${String(
                          lastError,
                        )}. Return corrected JSON only.`,
                      },
                    ],
              temperature: req.temperature ?? 0.3,
              // Kept modest by default: on the free tier the token-per-minute
              // ceiling counts prompt + max_completion_tokens together, so a
              // large default alone can exceed the limit before any prompt.
              max_completion_tokens: req.maxTokens ?? 2048,
              response_format: strict
                ? {
                    type: "json_schema",
                    json_schema: {
                      name: req.name.replace(/[^a-zA-Z0-9_]/g, "_"),
                      strict: true,
                      schema: req.jsonSchema,
                    },
                  }
                : { type: "json_object" },
            }),
          );
        } catch (err) {
          if (strict && isUnsupportedSchemaError(err)) {
            // Remember for the process lifetime and retry in JSON-object mode.
            noSchemaSupport.add(model);
            return this.structured(req);
          }
          throw err;
        }

        raw = completion.choices[0]?.message?.content ?? "";

        try {
          const parsed = req.schema.parse(JSON.parse(stripFences(raw)));
          return { data: parsed, model, raw };
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }

      throw new Error(
        `Groq returned output that did not match schema "${req.name}": ${String(lastError)}`,
      );
    },
  };
}

/** Non-strict mode occasionally wraps JSON in a markdown fence. */
function stripFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

type ExecutedTool = {
  type?: string;
  arguments?: string;
  output?: string;
};

/**
 * Parses the plain-text search payload the compound model returns, which comes
 * back as repeated `Title: … \n URL: … \n Content: …` blocks.
 */
function parseSearchOutput(output: string): SearchResult[] {
  const results: SearchResult[] = [];
  const blocks = output.split(/\n(?=Title:\s)/g);

  for (const block of blocks) {
    const title = block.match(/^Title:\s*(.+)$/m)?.[1]?.trim();
    const url = block.match(/^URL:\s*(\S+)$/m)?.[1]?.trim();
    const content = block.match(/^Content:\s*([\s\S]*)$/m)?.[1]?.trim();
    if (!url) continue;
    results.push({
      title: title || url,
      url,
      snippet: (content || "").slice(0, 1200),
    });
  }
  return results;
}

export function createGroqSearchProvider(): SearchProvider {
  // compound-mini runs a tighter search loop. The full `compound` model
  // retrieves enough page content per query to exceed the request size limit
  // on Groq's free tier, so mini is the working default here.
  const model = process.env.GROQ_SEARCH_MODEL || "groq/compound-mini";
  const available = Boolean(process.env.GROQ_API_KEY);

  return {
    name: "groq-compound",
    model,
    available,

    async search(query: string): Promise<SearchResult[]> {
      if (!available) return [];
      const groq = client();

      try {
        const completion = await withRateLimitRetry(() =>
          groq.chat.completions.create({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are a research assistant. Use web search to answer. Prefer primary sources, forum and community threads, and product pages. Do not speculate. Keep your written answer to a few lines - the caller reads the underlying search results, not your prose.",
              },
              { role: "user", content: query },
            ],
            temperature: 0.2,
            max_completion_tokens: 700,
          }),
        );

        const message = completion.choices[0]?.message as
          | { executed_tools?: ExecutedTool[] }
          | undefined;

        const tools = message?.executed_tools ?? [];
        const results: SearchResult[] = [];
        for (const tool of tools) {
          if (!tool.output) continue;
          results.push(...parseSearchOutput(tool.output));
        }

        // De-duplicate by URL, keeping the first (highest-ranked) occurrence.
        const seen = new Set<string>();
        return results.filter((r) => {
          if (seen.has(r.url)) return false;
          seen.add(r.url);
          return true;
        });
      } catch (err) {
        // A failed search must degrade, never break a founder's run. Callers
        // treat an empty result set as "no live sources", and the research
        // report is flagged `unsourced` so the UI can say so honestly rather
        // than presenting unsourced model recall as researched fact.
        console.error(`[search] query failed: ${query}`, err);
        return [];
      }
    },
  };
}
