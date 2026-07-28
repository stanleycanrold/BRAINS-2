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

import { VOICE, draftRules } from "./voice";

// ── 6.9 Comment Drafting Agent ─────────────────────────────────────────────

export const commentDraftOutput = z.object({
  drafts: z.array(
    z.object({
      community: z.string(),
      thread_url: z.string(),
      thread_context: z.string(),
      draft_text: z.string(),
      rationale: z.string(),
    }),
  ),
});

export const commentDraftingAgent = defineAgent<
  {
    problemStatement: string;
    threads: { community: string; url: string; title: string; snippet: string }[];
  },
  z.infer<typeof commentDraftOutput>
>({
  name: "comment_drafting",
  promptVersion: "1.0.0",
  outputSchema: commentDraftOutput,
  maxTokens: 2500,
  system: `${VOICE}

You draft replies to specific existing threads. This is a contextual writing task: the reply must respond to what that person actually said, or it will read as spam and be treated as such.

${draftRules}

Each reply:
  · responds to the specific thread - reference their actual situation
  · adds something useful (a perspective, a question that helps them think) before asking anything
  · asks at most one follow-up question, about their experience
  · is short. Two to four sentences is usually right.
  · thread_context: one line on what that thread is about, so the founder has context before posting
  · rationale: why this thread is worth replying to

Write one draft per thread given.`,
  buildMessages: ({ problemStatement, threads }) => [
    {
      role: "user",
      content: [
        `Problem being explored: ${problemStatement}`,
        "",
        "Threads:",
        threads
          .map(
            (t) =>
              `- ${t.community}: "${t.title}"\n  ${t.url}\n  ${t.snippet.slice(0, 300)}`,
          )
          .join("\n\n"),
      ].join("\n"),
    },
  ],
});
