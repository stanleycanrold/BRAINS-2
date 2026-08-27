import { z } from "zod";
import { defineAgent } from "../types";
import { hypothesisCategorySchema } from "@/lib/domain/types";

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

// ── Hypothesis Agent ───────────────────────────────────────────────────────

/**
 * Turns the research report into the assumptions the idea stands on. Each one
 * is a falsifiable claim the validation round then tests, so the founder
 * watches specific bets resolve rather than a vague "people seem interested".
 */
export const hypothesisOutput = z.object({
  hypotheses: z.array(
    z.object({
      statement: z.string(),
      category: hypothesisCategorySchema,
      /** The observable outcome that would confirm it. */
      testable_expectation: z.string(),
    }),
  ),
});

export const hypothesisAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    valueProp: string;
    problemStrength: string;
    evidence: string[];
    contraryEvidence: string[];
    competitors: string[];
    workarounds: string[];
    communityQuotes: string[];
  },
  z.infer<typeof hypothesisOutput>
>({
  name: "hypothesis_generation",
  promptVersion: "1.0.0",
  outputSchema: hypothesisOutput,
  temperature: 0.3,
  maxTokens: 1400,
  system: `${VOICE}

You distil a research report into the falsifiable assumptions this idea is
really betting on. The validation round that follows exists to test these, so
each hypothesis must be something real respondents can confirm or kill.

RULES
- Write 4 to 6 hypotheses. Fewer, sharper ones beat a wall of trivia.
- Every statement must be grounded in the supplied research: an evidence
  claim, a contrary finding, a competitor gap, a workaround, or a community
  quote. No hypothesis may float free of what research actually found.
- Falsifiable and specific. "People find invoicing painful" is useless.
  "Freelancers with 5+ clients lose over an hour a week chasing late
  invoices" can be tested.
- testable_expectation describes the concrete answer pattern that would
  confirm it: what respondents would describe, how often, or how many.
- Spread across categories where the research supports it. If research says
  nothing about pricing, do not invent a pricing hypothesis; a strong
  Problem hypothesis is worth two invented ones.
- Where research found contrary evidence, at least one hypothesis should
  carry that risk openly rather than assuming it away.
- Language a founder states out loud. No "value proposition alignment" or
  other deck-speak.`,
  buildMessages: ({
    problemStatement,
    icp,
    valueProp,
    problemStrength,
    evidence,
    contraryEvidence,
    competitors,
    workarounds,
    communityQuotes,
  }) => [
    {
      role: "user",
      content: [
        `Problem: ${problemStatement}`,
        `Who has it: ${icp}`,
        `What the product would change: ${valueProp}`,
        `Research rated the problem: ${problemStrength}`,
        "",
        evidence.length
          ? `Evidence found:\n${evidence.map((e) => `- ${e}`).join("\n")}`
          : "",
        contraryEvidence.length
          ? `Contrary evidence:\n${contraryEvidence
              .map((e) => `- ${e}`)
              .join("\n")}`
          : "",
        competitors.length
          ? `Named competitors: ${competitors.join(", ")}`
          : "",
        workarounds.length
          ? `Current workarounds:\n${workarounds
              .map((w) => `- ${w}`)
              .join("\n")}`
          : "",
        communityQuotes.length
          ? `Things people said in communities:\n${communityQuotes
              .map((q) => `- "${q}"`)
              .join("\n")}`
          : "",
        "",
        "Write the hypotheses this idea is betting on.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ],
});

// ── Hypothesis Evaluation Agent ────────────────────────────────────────────

/**
 * Re-reads every response against the standing hypotheses and moves their
 * status with evidence. Runs at the decision gate, where the whole pool is
 * finally in.
 */
export const hypothesisEvaluationOutput = z.object({
  evaluations: z.array(
    z.object({
      id: z.string(),
      status: z.enum([
        "Testing",
        "Validated",
        "Partially Validated",
        "Disproven",
      ]),
      /** 0-100, how strongly the evidence supports the statement. */
      confidence: z.number(),
      /** Short evidence pointers FOR the statement. */
      supporting: z.array(z.string()),
      /** Short evidence pointers AGAINST it. */
      counter: z.array(z.string()),
      takeaway: z.string(),
    }),
  ),
});

export const hypothesisEvaluationAgent = defineAgent<
  {
    problemStatement: string;
    hypotheses: {
      id: string;
      statement: string;
      category: string;
      testable_expectation: string;
    }[];
    confirmationRate: number;
    responseCount: number;
    responses: { confirmed: string; channel: string; notes: string }[];
    synthesis: { themes: string[]; objections: string[]; narrative: string };
  },
  z.infer<typeof hypothesisEvaluationOutput>
>({
  name: "hypothesis_evaluation",
  promptVersion: "1.0.0",
  outputSchema: hypothesisEvaluationOutput,
  temperature: 0,
  maxTokens: 2000,
  system: `${VOICE}

You judge each standing hypothesis against everything respondents said. You
return an evaluation for EVERY hypothesis you are given, using the exact id
it came in with.

RULES
- Evidence only. A hypothesis moves on what respondents described, not on
  what would be nice to conclude.
- supporting and counter hold short pointers: a quote fragment of ten words
  or so, a theme name, or "none found". Counter-evidence stays visible even
  when the verdict is positive.
- Validated needs multiple respondents describing the expected pattern.
  One enthusiastic answer is not validation.
- Disproven needs respondents describing the opposite, not merely silence.
  When the pool simply did not touch a hypothesis, it stays Testing with
  low confidence and a takeaway that says exactly that.
- Partially Validated is for a real signal with a real caveat: the pain is
  there but smaller than assumed, or confined to one segment.
- confidence reflects evidence strength AND sample size. Two responses can
  point the same way and still not justify confidence above 50.
- When the pool is thin, say so in the takeaways. A founder reading these
  must never mistake a small sample for a settled question.`,
  buildMessages: ({
    problemStatement,
    hypotheses,
    confirmationRate,
    responseCount,
    responses,
    synthesis,
  }) => [
    {
      role: "user",
      content: [
        `Problem being validated: ${problemStatement}`,
        `${responseCount} responses collected; ${Math.round(confirmationRate * 100)}% confirmed the problem.`,
        "",
        `Standing hypotheses:\n${hypotheses
          .map(
            (h) =>
              `- [${h.id}] (${h.category}) ${h.statement}\n  Would be confirmed by: ${h.testable_expectation}`,
          )
          .join("\n")}`,
        "",
        `Synthesis of the pool:\nThemes: ${synthesis.themes.join("; ") || "(none)"}\nObjections: ${synthesis.objections.join("; ") || "(none)"}\nNarrative: ${synthesis.narrative || "(none)"}`,
        "",
        `The responses:\n${responses
          .map(
            (r, i) =>
              `${i + 1}. [${r.channel}] confirmed=${r.confirmed}\n   ${r.notes || "(no notes)"}`,
          )
          .join("\n")}`,
        "",
        "Evaluate every hypothesis.",
      ].join("\n\n"),
    },
  ],
});
