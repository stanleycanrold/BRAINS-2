import type {
  LLMProvider,
  SearchProvider,
  StructuredRequest,
  StructuredResult,
} from "./types";
import { createGroqProvider, createGroqSearchProvider } from "./groq";
import { createAnthropicProvider } from "./anthropic";
import { createGeminiProvider, createGeminiSearchProvider } from "./gemini";

/**
 * Provider selection. This function is the single switch between LLM backends
 * for the whole application - swapping Groq for Anthropic (or, later, a
 * fine-tuned specialist SLM) touches nothing else.
 */

let cachedProvider: LLMProvider | null = null;
let cachedSearch: SearchProvider | null = null;

export function getLLM(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const choice = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
  if (choice === "groq") {
    cachedProvider = createGroqProvider();
    return cachedProvider;
  }
  if (choice === "anthropic") {
    cachedProvider = createAnthropicProvider();
    return cachedProvider;
  }

  // Gemini is the default LLM. Groq remains the automatic fallback until the
  // Gemini key is configured in local, preview, or production environments.
  cachedProvider = process.env.GEMINI_API_KEY
    ? withGroqFallback(createGeminiProvider(), createGroqProvider())
    : createGroqProvider();

  return cachedProvider;
}

function withGroqFallback(primary: LLMProvider, fallback: LLMProvider): LLMProvider {
  return {
    name: primary.name,
    model: primary.model,
    async structured<T>(
      request: StructuredRequest<T>,
    ): Promise<StructuredResult<T>> {
      try {
        return await primary.structured(request);
      } catch (error) {
        console.error(`[llm:${primary.name}] falling back to ${fallback.name}`, error);
        const result = await fallback.structured(request);
        return { ...result, model: `${result.model} (fallback)` };
      }
    },
  };
}

export function getSearch(): SearchProvider {
  if (cachedSearch) return cachedSearch;
  const choice = (process.env.SEARCH_PROVIDER || "gemini").toLowerCase();
  if (choice === "groq") {
    cachedSearch = createGroqSearchProvider();
    return cachedSearch;
  }

  // Gemini is the default search backend. Keep Groq available automatically
  // until a Gemini key is configured, so local and preview environments keep
  // their existing search behavior.
  const gemini = createGeminiSearchProvider();
  cachedSearch = gemini.available
    ? withGroqSearchFallback(gemini, createGroqSearchProvider())
    : createGroqSearchProvider();
  return cachedSearch;
}

function withGroqSearchFallback(
  primary: SearchProvider,
  fallback: SearchProvider,
): SearchProvider {
  return {
    name: primary.name,
    model: primary.model,
    available: primary.available || fallback.available,
    async search(query) {
      const primaryResults = await primary.search(query);
      // A small Google-grounded result set is often technically successful but
      // practically weak. Run Groq as a second opinion until we have enough
      // material for the research agent to compare, especially for forum and
      // complaint queries where Google may return only vendor pages.
      if (primaryResults.length >= 5) return primaryResults;

      console.warn(
        `[search:${primary.name}] only ${primaryResults.length} results; supplementing with ${fallback.name}`,
      );
      const fallbackResults = await fallback.search(query);
      const seen = new Set<string>();
      return [...primaryResults, ...fallbackResults].filter((result) => {
        if (!result.url || seen.has(result.url)) return false;
        seen.add(result.url);
        return true;
      });
    },
  };
}

export type { LLMProvider, SearchProvider } from "./types";
