import type { z } from "zod";
import type { LLMMessage } from "@/lib/llm/types";

/**
 * The common agent contract (PRD §10, extensibility):
 *   input: an idea_state slice + config  →  output: structured JSON
 *
 * Deliberately free of server-only imports so agent definitions can be loaded
 * by scripts and tests without pulling in the database layer.
 */
export interface AgentDefinition<TInput, TOutput> {
  /** Stable identifier, used as the log key and SLM training partition. */
  name: string;
  /** Bump whenever the prompt changes - training data must be attributable. */
  promptVersion: string;
  outputSchema: z.ZodType<TOutput>;
  system: string;
  /** Builds the user turn(s) from the agent's typed input. */
  buildMessages: (input: TInput) => LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export function defineAgent<TInput, TOutput>(
  definition: AgentDefinition<TInput, TOutput>,
): AgentDefinition<TInput, TOutput> {
  return definition;
}
