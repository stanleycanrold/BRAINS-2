import { z } from "zod";
import { defineAgent } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Agent definitions - PRD §6.
 *
 * Every judgment call, synthesis, estimate, go/no-go and "propose changes"
 * step in the pipeline is an agent call, never hardcoded logic. Each one is a
 * tightly scoped prompt plus a strict output schema, so it can be swapped for
 * a fine-tuned specialist SLM later without touching a caller.
 *
 * Prompt versions are bumped whenever wording changes, so the training corpus
 * in `agent_run_logs` stays attributable.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { VOICE } from "./voice";

// ── Conversation Monitoring Agent ──────────────────────────────────────────

export const monitorOutput = z.object({
  /** Anything found that reads like someone describing the problem. */
  notable_activity: z.array(
    z.object({
      summary: z.string(),
      source_url: z.string(),
      looks_like_problem_confirmation: z.boolean(),
    }),
  ),
  /** Plain-language read of whether this space is still worth the founder's time. */
  verdict: z.string(),
  worth_revisiting: z.boolean(),
});

export const monitorAgent = defineAgent<
  {
    problemStatement: string;
    community: string;
    threadUrl: string;
    searchResults: { title: string; url: string; snippet: string }[];
  },
  z.infer<typeof monitorOutput>
>({
  name: "conversation_monitor",
  promptVersion: "1.0.0",
  outputSchema: monitorOutput,
  maxTokens: 1500,
  system: `${VOICE}

The founder posted in a community and wants to know whether anything came of it, and whether that space is still worth their attention.

You are working from search results, NOT from a live read of the thread. That means you may be looking at stale or partial data, and you must not pretend otherwise. Never invent replies, never estimate engagement numbers, and never state that someone said something unless it appears in the results.

notable_activity: only entries that genuinely relate to this problem. Each needs a real source_url from the results. Set looks_like_problem_confirmation true ONLY where someone describes experiencing the problem themselves - not where they merely discuss the topic. Return an empty array rather than padding it.

verdict: two or three sentences to the founder. If the results show nothing new, say exactly that - "nothing new since you posted" is a useful answer and pretending otherwise wastes their time. If the space looks active and relevant, say what makes it worth going back to.

worth_revisiting: true only if there is a concrete reason to return.`,
  buildMessages: ({ problemStatement, community, threadUrl, searchResults }) => [
    {
      role: "user",
      content: [
        `Problem being validated: ${problemStatement}`,
        `Community: ${community}`,
        threadUrl ? `Thread: ${threadUrl}` : "",
        "",
        searchResults.length
          ? `Search results:\n${searchResults
              .slice(0, 10)
              .map(
                (r, i) =>
                  `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet.slice(0, 400)}`,
              )
              .join("\n\n")}`
          : "Search returned nothing for this thread.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});
