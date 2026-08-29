import type {
  LLMProvider,
  SearchProvider,
  StructuredRequest,
  StructuredResult,
} from "./types";
import { createGroqProvider, createGroqSearchProvider } from "./groq";
import { createAnthropicProvider } from "./anthropic";
import { createGeminiProvider, createGeminiSearchProvider } from "./gemini";
import { createOpenRouterProvider, createOpenRouterSearchProvider } from "./openrouter";

/**
 * Provider selection. This function is the single switch between LLM backends
 * for the whole application - swapping Groq for Anthropic (or, later, a
 * fine-tuned specialist SLM) touches nothing else.
 */

let cachedProvider: LLMProvider | null = null;
let cachedSearch: SearchProvider | null = null;

export function getLLM(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const choice = (process.env.LLM_PROVIDER || "groq").toLowerCase();
  if (choice === "groq") {
    cachedProvider = createGroqProvider();
    return cachedProvider;
  }
  if (choice === "anthropic") {
    cachedProvider = createAnthropicProvider();
    return cachedProvider;
  }
  if (choice === "openrouter") {
    cachedProvider = createOpenRouterProvider();
    return cachedProvider;
  }

  // Gemini remains available explicitly or as a fallback when configured.
  cachedProvider = process.env.GEMINI_API_KEY
    ? withGroqFallback(createGeminiProvider(), createGroqProvider())
    : createGroqProvider();

  // OpenRouter as final fallback if configured and primary failed is not already openrouter
  if (process.env.OPENROUTER_API_KEY && choice !== "openrouter") {
    const base = cachedProvider;
    cachedProvider = withGroqFallback(base, createOpenRouterProvider());
  }

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
  const choice = (process.env.SEARCH_PROVIDER || "groq").toLowerCase();
  if (choice === "groq") {
    cachedSearch = createGroqSearchProvider();
    return cachedSearch;
  }
  if (choice === "openrouter") {
    const ors = createOpenRouterSearchProvider();
    cachedSearch = ors.available ? ors : createGroqSearchProvider();
    return cachedSearch;
  }

  // Gemini remains available explicitly and supplements Groq when configured.
  const gemini = createGeminiSearchProvider();
  if (gemini.available) {
    // If OpenRouter also available, use it as secondary fallback for Gemini
    const ors = createOpenRouterSearchProvider();
    const primary = ors.available ? withGroqSearchFallback(gemini, ors) : gemini;
    cachedSearch = withGroqSearchFallback(primary, createGroqSearchProvider());
    return cachedSearch;
  }
  // No Gemini — try OpenRouter before Groq
  const ors = createOpenRouterSearchProvider();
  cachedSearch = ors.available ? ors : createGroqSearchProvider();
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
      // Community/pricing queries often return 2-3 vendor pages that pass the
      // technical check but are practically thin. Supplement until we have a
      // decent mixed set for the diversifier to rank.
      if (primaryResults.length >= 8) return primaryResults;

      const fallbackResults = await fallback.search(query);
      const seen = new Set<string>();
      const merged = [...primaryResults, ...fallbackResults].filter((result) => {
        if (!result.url || seen.has(result.url)) return false;
        seen.add(result.url);
        return true;
      });
      if (fallbackResults.length > 0) {
        console.warn(
          `[search:${primary.name}] ${primaryResults.length} results; supplemented with ${fallback.name} → ${merged.length}`,
        );
      }
      return merged;
    },
  };
}

export type { LLMProvider, SearchProvider } from "./types";
