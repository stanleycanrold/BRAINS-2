import "server-only";
import { db, schema } from "@/lib/db";
import { getLLM } from "@/lib/llm";
import { toJsonSchema } from "./schema";
import type { AgentDefinition } from "./types";

export { defineAgent } from "./types";
export type { AgentDefinition } from "./types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The common agent interface (PRD §6, §10).
 *
 * Every agent in the pipeline is defined here and nowhere else:
 *   input: an idea_state slice + config  →  output: structured JSON
 *
 * Two things this buys us:
 *
 *  1. Any agent can be swapped for a fine-tuned specialist SLM later without
 *     changing a single caller - the "agents now, SLMs later" strategy.
 *
 *  2. Every run is logged with its prompt version, full input, full output,
 *     model and latency. That is a hard requirement, not nice-to-have
 *     instrumentation: it is the audit trail *and* the future SLM training
 *     corpus. Failures are logged too, so a failed judgment is as traceable as
 *     a successful one.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type AgentRunContext = {
  /** Links the run to the idea version it acted on. Null for ad-hoc runs. */
  ideaStateVersionId?: string | null;
};

export async function runAgent<TInput, TOutput>(
  agent: AgentDefinition<TInput, TOutput>,
  input: TInput,
  context: AgentRunContext = {},
): Promise<TOutput> {
  const llm = getLLM();
  const startedAt = Date.now();

  let output: TOutput | null = null;
  let error: string | null = null;

  try {
    const result = await llm.structured<TOutput>({
      name: agent.name,
      system: agent.system,
      messages: agent.buildMessages(input),
      schema: agent.outputSchema,
      jsonSchema: toJsonSchema(agent.outputSchema),
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    });
    // The house rules tell the model not to use em dashes, but a prompt is a
    // request, not a guarantee. Everything an agent produces is shown to the
    // founder or to the people they survey, so the rule is enforced here too.
    output = stripEmDashes(result.data);
    return output;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    // Logging never blocks or breaks the pipeline - a logging outage must not
    // take down a founder's validation run.
    void logAgentRun({
      ideaStateVersionId: context.ideaStateVersionId ?? null,
      agentName: agent.name,
      promptVersion: agent.promptVersion,
      inputJson: input,
      outputJson: output,
      modelUsed: llm.model,
      provider: llm.name,
      latencyMs: Date.now() - startedAt,
      error,
    }).catch((logErr) => {
      console.error(`[agent-log] failed to record ${agent.name} run:`, logErr);
    });
  }
}

/**
 * Replaces em dashes anywhere in an agent's output, at any depth.
 *
 * Structural rather than field-by-field, so a field added to any agent later
 * is covered without anyone remembering to handle it.
 */
function stripEmDashes<T>(value: T): T {
  if (typeof value === "string") {
    // \u2014 is the em dash, written escaped so no literal one exists
    // anywhere in the codebase, including the code that removes them.
    return (
      value
        .replace(/\s*\u2014\s*/g, " - ")
        // \u2011 is the non-breaking hyphen, which models reach for in
        // compounds like "back-and-forth". It is invisible in most editors,
        // survives copy and paste into a founder's own documents, and breaks
        // word wrapping in narrow columns. Same class of problem as the em
        // dash, so it is normalised in the same place.
        .replace(/\u2011/g, "-") as T
    );
  }
  if (Array.isArray(value)) {
    return value.map(stripEmDashes) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, stripEmDashes(v)]),
    ) as T;
  }
  return value;
}

async function logAgentRun(entry: {
  ideaStateVersionId: string | null;
  agentName: string;
  promptVersion: string;
  inputJson: unknown;
  outputJson: unknown;
  modelUsed: string;
  provider: string;
  latencyMs: number;
  error: string | null;
}) {
  await db.insert(schema.agentRunLogs).values({
    ideaStateVersionId: entry.ideaStateVersionId,
    agentName: entry.agentName,
    promptVersion: entry.promptVersion,
    inputJson: entry.inputJson as object,
    outputJson: (entry.outputJson ?? null) as object | null,
    modelUsed: entry.modelUsed,
    provider: entry.provider,
    latencyMs: entry.latencyMs,
    error: entry.error,
  });
}
