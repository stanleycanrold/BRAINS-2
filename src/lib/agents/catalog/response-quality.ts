import { z } from "zod";
import { defineAgent } from "../types";

import { VOICE } from "./voice";

// ── Response Quality Agent ─────────────────────────────────────────────────

/**
 * Screens an interview response before it is allowed to count.
 *
 * The product's whole claim is that a founder can trust the score. One
 * ChatGPT-written paragraph or one "great idea, I would definitely use this"
 * in the pool quietly corrupts that, and nobody can tell afterwards which
 * response did it. So every response is read before it is admitted.
 *
 * Two things this is deliberately NOT:
 *
 *  1. It is not a grammar or eloquence check. A short, blunt, badly spelled
 *     answer from someone who genuinely has the problem is exactly what we
 *     want. Length and polish are not quality.
 *
 *  2. It is not the final say. It returns a verdict and its reasons, and a
 *     human approves or overrides in the ops console. An automated reject
 *     that silently bins a real person's answer is worse than a queue.
 */
export const responseQualityOutput = z.object({
  /**
   * accept  - counts toward the score.
   * review  - a human should look; ambiguous rather than bad.
   * reject  - does not count.
   */
  verdict: z.enum(["accept", "review", "reject"]),
  /** 0-100. How confident the judgment is, not how good the answer is. */
  confidence: z.number(),
  /** Shown to whoever reviews. Plain, specific, no hedging. */
  reasoning: z.string(),
  /** Which problems were found. Empty on a clean accept. */
  flags: z.array(
    z.enum([
      /** Reads as generated rather than lived. */
      "likely_ai_generated",
      /** True of any product in any market; says nothing about this one. */
      "generic",
      /** Answered without engaging: "yes", "good idea", "n/a". */
      "low_effort",
      /** Contradicts itself or the question asked. */
      "incoherent",
      /** Answers a different question, or is off topic entirely. */
      "off_topic",
      /** Repeats another response closely enough to look duplicated. */
      "duplicate",
      /** Reads as someone trying to please the founder rather than inform. */
      "sycophantic",
    ]),
  ),
  /**
   * The signal actually worth keeping, in one line. Blank on a reject.
   * Gives the founder something readable without opening every response.
   */
  substance: z.string(),
});

export const responseQualityAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    questionText: string;
    answer: string;
    confirmed: "yes" | "no" | "unsure";
    /** Other answers in the pool, to catch near-duplicates. */
    existingAnswers?: string[];
  },
  z.infer<typeof responseQualityOutput>
>({
  name: "response_quality",
  promptVersion: "1.0.0",
  outputSchema: responseQualityOutput,
  temperature: 0,
  maxTokens: 700,
  system: `${VOICE}

You screen interview responses before they are allowed to affect a founder's
validation score. You are the reason the score can be trusted.

WHAT YOU ARE PROTECTING AGAINST

1. AI-generated answers. Tells: even, balanced sentence rhythm; tidy
   three-part structures; "moreover", "furthermore", "it is worth noting";
   naming benefits nobody was asked about; enthusiasm with no specifics; a
   summarising closing sentence. Real people digress, contradict themselves,
   mention irrelevant specifics, and stop mid-thought.

2. Generic answers. If the same sentence would be true of a completely
   different product in a different industry, it carries no signal. "This
   would save me time" is generic. "I lose about an hour every Friday
   reconciling two spreadsheets" is not.

3. Low effort. One word, restating the question, or filler.

4. Sycophancy. Someone praising the idea rather than describing their own
   situation. Enthusiasm is not evidence.

WHAT YOU MUST NOT PENALISE

- Short answers that are specific. Two blunt sentences naming a real
  situation beat three polished paragraphs.
- Bad spelling, bad grammar, slang, swearing, a language that is not
  English, or a stream-of-consciousness ramble.
- A "no, this is not a problem for me" answer. A well-reasoned no is as
  valuable as a yes, and rejecting negatives would bias the score upward,
  which is the single most damaging thing you could do here.
- Strong criticism of the idea.

HOW TO DECIDE

- accept: contains at least one concrete, situational detail that could only
  come from someone in this position.
- review: you suspect a problem but a reasonable person could disagree.
  Prefer this over reject whenever you are unsure.
- reject: clearly generated, clearly generic, or clearly empty of content.

Reserve high confidence for cases you would defend to the person who wrote
the answer. When the answer is short, be slower to reject: brevity is not
evidence of anything.`,
  buildMessages: (input) => [
    {
      role: "user",
      content: `IDEA BEING VALIDATED
Problem: ${input.problemStatement}
Who it is for: ${input.icp}

QUESTION ASKED
${input.questionText}

THEIR ANSWER TO THE SCORED QUESTION: ${input.confirmed}

THEIR WRITTEN RESPONSE
"""
${input.answer}
"""
${
  input.existingAnswers?.length
    ? `\nOTHER RESPONSES ALREADY IN THE POOL (check for near-duplicates)\n${input.existingAnswers
        .slice(0, 10)
        .map((a, i) => `${i + 1}. ${a.slice(0, 300)}`)
        .join("\n")}`
    : ""
}

Judge this response.`,
    },
  ],
});
