import type {
  LLMProvider,
  SearchProvider,
  SearchResult,
  StructuredRequest,
  StructuredResult,
} from "./types";

type GroundingChunk = {
  web?: { uri?: string; title?: string };
};

type GroundingSupport = {
  segment?: { text?: string };
  groundingChunkIndices?: number[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: {
      groundingChunks?: GroundingChunk[];
      groundingSupports?: GroundingSupport[];
    };
  }>;
  error?: { message?: string };
};

/** Gemini structured-output adapter used by the agent pipeline. */
export function createGeminiProvider(): LLMProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return {
    name: "gemini",
    model,

    async structured<T>(
      req: StructuredRequest<T>,
    ): Promise<StructuredResult<T>> {
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: req.system }] },
            contents: req.messages
              .filter((message) => message.role !== "system")
              .map((message) => ({
                role: message.role === "assistant" ? "model" : "user",
                parts: [{ text: message.content }],
              })),
            generationConfig: {
              temperature: req.temperature ?? 0.3,
              maxOutputTokens: req.maxTokens ?? 2048,
              responseMimeType: "application/json",
              responseJsonSchema: req.jsonSchema,
            },
          }),
          signal: AbortSignal.timeout(60_000),
        },
      );

      const payload = (await response.json()) as GeminiResponse;
      if (!response.ok) {
        throw new Error(payload.error?.message || `HTTP ${response.status}`);
      }

      const raw = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();
      if (!raw) throw new Error(`Gemini returned no content for "${req.name}".`);

      try {
        return { data: req.schema.parse(JSON.parse(raw)), model, raw };
      } catch (error) {
        throw new Error(
          `Gemini returned output that did not match schema "${req.name}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  };
}

/**
 * Gemini search using Google's built-in Google Search grounding tool.
 * Grounding metadata, rather than model prose, supplies the URLs used by the
 * research pipeline as evidence.
 */
export function createGeminiSearchProvider(): SearchProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_SEARCH_MODEL || "gemini-2.5-flash";
  const available = Boolean(apiKey);

  return {
    name: "gemini-google-search",
    model,
    available,

    async search(query: string): Promise<SearchResult[]> {
      if (!apiKey) return [];

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: query }] }],
              tools: [{ google_search: {} }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
            }),
            signal: AbortSignal.timeout(30_000),
          },
        );

        const payload = (await response.json()) as GeminiResponse;
        if (!response.ok) {
          throw new Error(payload.error?.message || `HTTP ${response.status}`);
        }

        return parseGroundedResults(payload);
      } catch (error) {
        console.error(`[gemini-search] query failed: ${query}`, error);
        return [];
      }
    },
  };
}

function parseGroundedResults(payload: GeminiResponse): SearchResult[] {
  const candidate = payload.candidates?.[0];
  const chunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const supports = candidate?.groundingMetadata?.groundingSupports ?? [];
  const snippets = new Map<number, string[]>();

  for (const support of supports) {
    const text = support.segment?.text?.trim();
    if (!text) continue;
    for (const index of support.groundingChunkIndices ?? []) {
      const values = snippets.get(index) ?? [];
      values.push(text);
      snippets.set(index, values);
    }
  }

  const seen = new Set<string>();
  return chunks.flatMap((chunk, index) => {
    const url = chunk.web?.uri?.trim();
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [
      {
        title: chunk.web?.title?.trim() || url,
        url,
        snippet: (snippets.get(index) ?? []).join(" ").slice(0, 1200),
      },
    ];
  });
}