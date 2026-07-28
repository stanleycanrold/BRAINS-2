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

// ── 6.3 Signal Scanning Agent ──────────────────────────────────────────────

export const signalScanOutput = z.object({
  communities: z.array(
    z.object({
      name: z.string(),
      platform: z.string(),
      url: z.string(),
      why_relevant: z.string(),
      example_thread_url: z.string(),
      example_thread_title: z.string(),
    }),
  ),
  script: z.string(),
});

export const signalScanAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    searchResults: { title: string; url: string; snippet: string }[];
  },
  z.infer<typeof signalScanOutput>
>({
  name: "signal_scanning",
  promptVersion: "1.0.0",
  outputSchema: signalScanOutput,
  maxTokens: 3000,
  system: `${VOICE}

You find where this idea's target users already gather and talk, and you write the interview script the founder will use.

communities: 4-8 specific, named places (a named subreddit, a named Slack/Discord, a named forum or LinkedIn group) drawn from the search results. Use real URLs from the results - never invent one. "Reddit" is not a community; "r/freelance" is. For each, say why THIS audience is there and link a real example thread showing the problem being discussed.

script: an interview script that surfaces unprompted problem confirmation without leading the witness. It must:
  · open with questions about how they currently handle the situation, never about your idea
  · ask for the last specific time it happened, not for generalities
  · ask what they tried and what it cost them (time, money, or workaround)
  · only mention a possible solution at the very end, if at all
  · include a short note to the founder on what a real "yes" sounds like versus politeness
Format as markdown with numbered questions.`,
  buildMessages: ({ problemStatement, icp, searchResults }) => [
    {
      role: "user",
      content: [
        `Problem: ${problemStatement}`,
        `Target user: ${icp}`,
        "",
        "Search results:",
        searchResults
          .slice(0, 14)
          .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet.slice(0, 400)}`)
          .join("\n\n"),
      ].join("\n"),
    },
  ],
});
