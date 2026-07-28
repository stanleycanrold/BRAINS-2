import type { z } from "zod";

/**
 * The provider-agnostic LLM interface (PRD §10, extensibility).
 *
 * Every agent talks to this shape and nothing else. Swapping Groq for
 * Anthropic — or for a fine-tuned specialist SLM later — is a change to
 * `LLM_PROVIDER` plus one adapter file, with no caller touched.
 */

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type StructuredRequest<T> = {
  /** Name used for the JSON schema and for logging. */
  name: string;
  system: string;
  messages: LLMMessage[];
  schema: z.ZodType<T>;
  /** JSON Schema mirror of `schema`, for providers that constrain decoding. */
  jsonSchema: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
};

export type StructuredResult<T> = {
  data: T;
  model: string;
  raw: string;
};

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  /** Returns schema-valid JSON, or throws after exhausting repair attempts. */
  structured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>>;
}

/** A single web/social search result, used as evidence by research agents. */
export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export interface SearchProvider {
  readonly name: string;
  readonly model: string;
  /** Runs a real search. Returns [] when no search backend is configured. */
  search(query: string): Promise<SearchResult[]>;
  readonly available: boolean;
}
