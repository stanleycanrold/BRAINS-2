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

// ── 6.8 Post Drafting Agent ────────────────────────────────────────────────


export const postDraftOutput = z.object({
  drafts: z.array(
    z.object({
      community: z.string(),
      community_url: z.string(),
      title: z.string(),
      draft_text: z.string(),
      rationale: z.string(),
    }),
  ),
});

export const postDraftingAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    communities: { name: string; platform: string; url: string; why_relevant: string }[];
  },
  z.infer<typeof postDraftOutput>
>({
  name: "post_drafting",
  promptVersion: "1.0.0",
  outputSchema: postDraftOutput,
  maxTokens: 2500,
  system: `${VOICE}

You draft standalone posts the founder could publish to surface people who have this problem. A cold-open post is a different writing task from a reply: it has to earn attention from strangers with no context.

${draftRules}

Each draft:
  · opens with a genuine question or a real situation, not a preamble
  · matches the norms of that specific community - Reddit is not LinkedIn
  · is short enough to read in full without scrolling
  · invites people to describe their own experience
  · title: only for platforms that use titles; empty string otherwise
  · rationale: one line to the founder on why this angle suits this community

Write one draft per community given.`,
  buildMessages: ({ problemStatement, icp, communities }) => [
    {
      role: "user",
      content: [
        `Problem: ${problemStatement}`,
        `Target user: ${icp}`,
        "",
        "Communities:",
        communities
          .map((c) => `- ${c.name} (${c.platform}) ${c.url} - ${c.why_relevant}`)
          .join("\n"),
      ].join("\n"),
    },
  ],
});
