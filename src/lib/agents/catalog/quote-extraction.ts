import { z } from "zod";
import { defineAgent } from "../types";
import { quoteCategorySchema } from "@/lib/domain/types";

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

// ── Quote Extraction Agent ─────────────────────────────────────────────────

/**
 * Reads one response and pulls out the fragments actually worth showing the
 * founder. A response is mostly ordinary text with one or two sentences that
 * carry the whole signal; this agent finds those rather than making the
 * founder dig through every submission by hand.
 */
export const quoteExtractionOutput = z.object({
  quotes: z.array(
    z.object({
      /** The respondent's own words, trimmed but never rewritten. */
      text: z.string(),
      /** Which question drew it, when the answers are structured. */
      question_id: z.string().nullable(),
      category: quoteCategorySchema,
      /** One line on what makes this quote worth reading. */
      why_it_matters: z.string(),
    }),
  ),
});

export const quoteExtractionAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    questions: { id: string; text: string; intent: string }[];
    confirmed: "yes" | "no" | "unsure";
    /** Structured answers when the response came through a questionnaire. */
    answers: { question_id: string; question: string; answer: string }[];
    /** The prose shape every channel shares. Used when answers is empty. */
    notes: string;
  },
  z.infer<typeof quoteExtractionOutput>
>({
  name: "quote_extraction",
  promptVersion: "2.0.0",
  outputSchema: quoteExtractionOutput,
  temperature: 0,
  maxTokens: 1400,
  system: `${VOICE}

You extract ONLY the respondent's own feedback — never the question — and only the most painful, highly-correlated fragments.

FEEDBACK vs QUESTIONS — critical distinction:
- The "questions asked" and "Their answers" are provided separately. The question text is NEVER a quote. Only the text after "→" is the respondent's voice.
- Never return a question as a quote, even trimmed. If an answer is "Yes, we have this problem", that is not a quote — it is a confirmation without substance.

WHAT COUNTS AS A HIGHLY-CORRELATED PAIN QUOTE (strict — when in doubt, discard):
- Verbatim from the respondent's answer, trimmed but never rewritten. Founder must trust it was actually written.
- Concrete past behaviour highly correlated with the problem being validated: the last time THIS exact problem happened, what they did, how long it took, what it cost. Generic pain ("it's annoying") is not enough.
- Real cost highly correlated: money spent, hours lost, tools paid for, workarounds built FOR THIS PROBLEM. Must name a concrete cost or workaround, not a vague complaint.
- Genuine objections highly correlated: why THIS problem does not matter to them or why their current way of handling THIS problem is good enough.
- Unprompted volunteered detail highly correlated with the problem — strongest signal. Prefix why_it_matters with "[Unprompted] ".

WHAT NEVER COUNTS (discard even if it looks like a quote):
- Any question text, even paraphrased.
- Praise, enthusiasm, "I would definitely use that" — stated intent is not pain evidence.
- Hypotheticals: what they would do / would pay / would prefer.
- Generic statements applicable to any product/market ("we need better tools", "it's hard to manage").
- Low-correlation pain not tied to the problem being validated.
- Fragments < 8 words or without a concrete detail.

CATEGORY RULES — single best fit, only for highly-correlated pain:
- Problem Urgency: past pain highly correlated, time lost, urgency, frequency.
- Willingness to Pay: actual spend highly correlated.
- Existing Friction: complaint about current workaround FOR THIS PROBLEM.
- Feature Requirement: must-have capability described concretely.
- Objection & Risk: why they would NOT adopt for THIS problem.

QUALITY BAR: Return 0 to 2 fragments, not 3. Most responses yield 0 or 1. Average responses yield 0 — return empty rather than a weak or low-correlation quote. Only the best candidates survive. Prefer silence over noise.

HARD FILTER — never return these, even if they seem like a quote:
- Text that is exactly the question, paraphrases the question, or looks like a question prompt (ends with "?" or starts with "Think about", "How often", "What", "When", "Why", "Have you", "Do you", "Can you", "Describe", "Tell me").
- The hill example "Think about the last time you tried to ride up a hill that felt too steep." is a QUESTION — never return it. Only a respondent's answer to it could be a quote.

Set question_id to the question the fragment answers when structured; null when from free notes. Never copy the question into text.

why_it_matters is one plain line for the founder: what this highly-correlated pain reveals that numbers alone do not. Start with "[Unprompted] " when volunteered.`,
  buildMessages: ({
    problemStatement,
    icp,
    questions,
    confirmed,
    answers,
    notes,
  }) => [
    {
      role: "user",
      content: [
        `Problem being validated: ${problemStatement}`,
        `Who it is for: ${icp}`,
        "",
        questions.length
          ? `The questions asked:\n${questions
              .map((q) => `- [${q.id}] ${q.text} (intent: ${q.intent})`)
              .join("\n")}`
          : "",
        "",
        `Their answer to the scored question: ${confirmed}`,
        "",
        answers.length
          ? `Their answers:\n${answers
              .map(
                (a) =>
                  `[${a.question_id}] ${a.question}\n→ ${a.answer || "(blank)"}`,
              )
              .join("\n\n")}`
          : `Their notes:\n"""\n${notes || "(no notes)"}\n"""`,
        "",
        "Extract the quotes worth showing the founder.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});
