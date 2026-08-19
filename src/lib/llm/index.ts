import type { LLMProvider, SearchProvider } from "./types";
import { createGroqProvider, createGroqSearchProvider } from "./groq";
import { createAnthropicProvider } from "./anthropic";
import { createGeminiSearchProvider } from "./gemini";

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
  cachedProvider =
    choice === "anthropic" ? createAnthropicProvider() : createGroqProvider();

  return cachedProvider;
}

export function getSearch(): SearchProvider {
  if (cachedSearch) return cachedSearch;
  const choice = (process.env.SEARCH_PROVIDER || "groq").toLowerCase();
  cachedSearch =
    choice === "gemini"
      ? createGeminiSearchProvider()
      : createGroqSearchProvider();
  return cachedSearch;
}

export type { LLMProvider, SearchProvider } from "./types";
