import Anthropic from "@anthropic-ai/sdk";
import type {
  LLMProvider,
  StructuredRequest,
  StructuredResult,
} from "./types";

/**
 * Anthropic adapter - the phase-2 provider.
 *
 * Wired and ready: set ANTHROPIC_API_KEY and flip LLM_PROVIDER to "anthropic".
 * No agent, route, or component changes are required, which is the whole point
 * of the provider interface (PRD §10, extensibility).
 *
 * Two API details worth knowing before editing this file:
 *  • `temperature` / `top_p` / `top_k` were removed on Claude Opus 5 and the
 *    4.7+ family - sending any of them returns a 400. Response shape is steered
 *    with structured outputs instead, so this adapter never sends them.
 *  • Structured JSON comes from `output_config.format`, not from assistant
 *    prefills (prefills also 400 on these models).
 */

export function createAnthropicProvider(): LLMProvider {
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";

  return {
    name: "anthropic",
    model,

    async structured<T>(
      req: StructuredRequest<T>,
    ): Promise<StructuredResult<T>> {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model,
        max_tokens: req.maxTokens ?? 8192,
        system: req.system,
        messages: req.messages.map((m) => ({
          role: m.role === "system" ? "user" : m.role,
          content: m.content,
        })),
        output_config: {
          format: {
            type: "json_schema",
            schema: req.jsonSchema,
          },
        },
      });

      // Safety classifiers can decline a request: HTTP 200 with a refusal
      // stop_reason and no usable content. Check before reading content.
      if (response.stop_reason === "refusal") {
        throw new Error(
          `Anthropic declined this request (agent "${req.name}"). Rephrase the idea description and retry.`,
        );
      }

      const raw = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as { text: string }).text)
        .join("");

      try {
        return { data: req.schema.parse(JSON.parse(raw)), model, raw };
      } catch (err) {
        throw new Error(
          `Anthropic returned output that did not match schema "${req.name}": ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    },
  };
}
