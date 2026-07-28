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

// ── Questionnaire Agent ────────────────────────────────────────────────────

export const questionnaireOutput = z.object({
  intro: z.string(),
  questions: z.array(
    z.object({
      text: z.string(),
      kind: z.enum(["open", "confirmation", "scale"]),
      intent: z.string(),
      required: z.boolean(),
    }),
  ),
});

export const questionnaireAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    valueProp: string;
    problemStrength: string;
    evidenceThemes: string[];
  },
  z.infer<typeof questionnaireOutput>
>({
  name: "questionnaire",
  promptVersion: "1.0.0",
  outputSchema: questionnaireOutput,
  maxTokens: 2000,
  system: `${VOICE}

You write the question set a founder will put in front of real people - used verbatim for their own interviews, for a shareable questionnaire, and for interviews run on their behalf. Same questions everywhere, so results are comparable.

These questions must be ABOUT THIS SPECIFIC PROBLEM, not a generic customer-research template. Someone reading them should be able to tell what product this is for.

Write 6-8 questions in this order:
  1. Two or three about how they handle this situation TODAY - no mention of any product. Ask about the last specific time it happened, not what they generally do.
  2. Exactly ONE question of kind "confirmation": a direct, unambiguous yes/no on whether they experience this problem. The confirmation rate and the final score are computed from this one, so it must be answerable yes or no and must not lead.
  3. Two or three "open" questions digging into cost - time lost, money spent, workarounds built, what they tried that failed.
  4. One closing open question inviting anything you didn't ask about.

Rules:
  · Never mention the founder's solution or ask whether someone would use/buy it. Stated intent to buy is worthless; described past behaviour is not.
  · Never ask two things in one question.
  · Plain spoken language, as one person asking another. No "leverage", no "solutions", no scale jargon.
  · "kind": "confirmation" for the one confirmation question, "scale" for anything answerable on a 1-5 or yes/no basis, "open" for everything else.
  · "intent": one line to the FOUNDER on what this question is really testing. The respondent never sees it.
  · "required": true only for the confirmation question and at most one other.

intro: two or three sentences the respondent reads first. Say what you're trying to learn and roughly how long it takes. Do not pitch, and do not say the word "startup" or "validate".`,
  buildMessages: ({ problemStatement, icp, valueProp, problemStrength, evidenceThemes }) => [
    {
      role: "user",
      content: [
        `Problem: ${problemStatement}`,
        `Who has it: ${icp}`,
        `What the product would change: ${valueProp}`,
        `Research rated the problem: ${problemStrength}`,
        evidenceThemes.length
          ? `What research already surfaced:\n${evidenceThemes
              .map((t) => `- ${t}`)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});
