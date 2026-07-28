import { z } from "zod";
import { defineAgent } from "../types";
import {
  signalSchema,
} from "@/lib/domain/types";

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

// ── 6.7 Decision Gate Agent ────────────────────────────────────────────────

export const decisionGateOutput = z.object({
  score: z.number(),
  signal: signalSchema,
  reasoning: z.string(),
  risk_factors: z.array(
    z.object({
      label: z.string(),
      detail: z.string(),
      severity: z.enum(["info", "caution", "high"]),
    }),
  ),
  diagnostic: z.object({
    verdict: z.enum([
      "wrong_problem_statement",
      "wrong_audience",
      "genuinely_weak_problem",
      "not_applicable",
    ]),
    explanation: z.string(),
  }),
  improvement_proposal: z.array(
    z.object({
      text: z.string(),
      reasoning: z.string(),
      patches: z.enum(["problem_statement", "icp", "value_prop", "none"]),
      patch_value: z.string(),
    }),
  ),
});

export const decisionGateAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    confirmationRate: number;
    totalResponses: number;
    channelMix: Record<string, number>;
    sourceCount: number;
    expertResponses: number;
    synthesis: { themes: string[]; objections: string[]; narrative: string };
    researchStrength: string | null;
  },
  z.infer<typeof decisionGateOutput>
>({
  name: "decision_gate",
  promptVersion: "1.0.0",
  outputSchema: decisionGateOutput,
  maxTokens: 2500,
  system: `${VOICE}

You deliver the founder's verdict. A bare number is never an acceptable output.

SIGNAL - this rule is fixed and you must follow it exactly:
  confirmation rate >= 50% across all channels combined → "go_ahead"
  below 50% → "rethink"
"rethink" is NOT a kill. It means the current framing needs work.

SCORE (0-100) - start from the confirmation rate as a percentage, then adjust for signal quality:
  · sample size under 10 responses: subtract meaningfully - small samples are weak evidence
  · thin, one-word responses: subtract
  · every response from one community or one channel: subtract for lack of diversity
  · detailed, specific, independent accounts across several sources: add
Keep the score within 15 points of the raw confirmation rate unless you explain why in reasoning. Never let the score cross the 50 line in the opposite direction from the signal.

RISK FACTORS - surface each that applies, individually, never bundled:
  sample size · response depth · source diversity · channel mix · expert-vs-user distinction · contradiction with the earlier research report

Expert interviews validate "domain experts believe this problem exists" - a different and often stronger claim than lived end-user experience. If the responses are expert-heavy, say so explicitly rather than averaging it away.

DIAGNOSTIC - required whenever the signal is "rethink". Decide which is true and explain:
  wrong_problem_statement - people have the pain, but not as framed
  wrong_audience - the problem is real for someone, just not this ICP
  genuinely_weak_problem - people cope fine; this isn't worth solving
Set "not_applicable" only on a go_ahead.

IMPROVEMENT PROPOSAL - 2-4 concrete changes. On a rethink these are the path forward; on a go_ahead they sharpen before building. Each must cite what in the responses prompted it, and set patches/patch_value the same way as the research step (patch_value is a complete replacement for that field).

REASONING - plain language, addressed to the founder, explaining how you got to the score. They must never be handed a number they can't interrogate.`,
  buildMessages: (input) => [
    {
      role: "user",
      content: [
        `Problem: ${input.problemStatement}`,
        `ICP: ${input.icp}`,
        "",
        `Confirmation rate: ${(input.confirmationRate * 100).toFixed(1)}% of ${input.totalResponses} responses`,
        `Channel mix: ${JSON.stringify(input.channelMix)}`,
        `Distinct sources: ${input.sourceCount}`,
        `Expert interviews among these: ${input.expertResponses}`,
        input.researchStrength
          ? `Earlier research rated the problem: ${input.researchStrength}`
          : "",
        "",
        `What people said - themes: ${input.synthesis.themes.join("; ") || "none identified"}`,
        `Objections raised: ${input.synthesis.objections.join("; ") || "none recorded"}`,
        `Summary: ${input.synthesis.narrative}`,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});
