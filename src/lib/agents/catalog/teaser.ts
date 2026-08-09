import { z } from "zod";
import { defineAgent } from "../types";
import { VOICE } from "./voice";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The Teaser Agent - the free read on the marketing site.
 *
 * Deliberately NOT the Research Agent. That one does live web and social
 * search and takes one to two minutes, which is far too slow and too
 * expensive to run for every anonymous visitor, including the bots and the
 * people who will never sign up. This is a single model call with no tool
 * use: it reflects and reasons over what the founder typed, and it does not
 * pretend to have looked anything up.
 *
 * That distinction is a product rule, not an optimisation. The moment this
 * agent implies it researched something, the site is making exactly the kind
 * of unevidenced claim the product refuses to make everywhere else. Hence
 * `unknown`, which is a required field: every response has to name what it
 * could not determine without real research. That is the honest version of a
 * teaser, and it happens to also be the sharpest argument for signing up.
 *
 * What the founder gets for free is genuinely usable: their problem stated
 * back to them, the alternative they are really competing with, and interview
 * questions they could ask someone tomorrow. A teaser that gives nothing away
 * converts worse than one that does, and a founder who actually uses the
 * questions comes back.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const teaserOutput = z.object({
  /** Short, concrete. Shown as the heading of the brief. */
  title: z.string(),
  /**
   * The problem in the user's terms, not the founder's solution. This is the
   * line that has to make someone feel read correctly, which is what earns
   * the rest of the page any attention at all.
   */
  reflection: z.string(),
  /** Who specifically has this problem. Narrow or it is not useful. */
  icp: z.string(),
  /** What those people do about it today. Usually the real competitor. */
  today: z.string(),
  /** The single assumption most likely to sink this, and why it matters. */
  first_check: z.object({ claim: z.string(), why: z.string() }),
  /**
   * Two or three non-leading questions, each paired with the bar an answer
   * has to clear. Capped in code rather than by schema, because array bounds
   * are stripped from the decoding grammar and would only fail after the
   * fact.
   */
  questions: z.array(z.object({ question: z.string(), listen_for: z.string() })),
  /**
   * What this read could not establish without real research.
   *
   * Named `needs_research` rather than `unknown`, which is what it was
   * called first. The model dropped that field often enough to fail strict
   * decoding and 502 the request: `unknown` reads as a placeholder or an
   * optional catch-all, while a verb phrase names an obligation. Abstract
   * field names are a reliability problem, not just a readability one.
   */
  needs_research: z.string(),
});

export type TeaserOutput = z.infer<typeof teaserOutput>;

export const teaserAgent = defineAgent<
  { description: string },
  TeaserOutput
>({
  name: "teaser",
  promptVersion: "1.0.0",
  outputSchema: teaserOutput,
  // Small ceiling on purpose. This has to feel instant, and a teaser that
  // runs long stops being a teaser.
  maxTokens: 900,
  temperature: 0.3,
  system: `${VOICE}

You give a founder an immediate, free first read on an idea they just typed into a public web page. You have NOT researched anything. You have no search results, no sources, and no data about this market. You are reasoning from what they wrote and from how businesses of this kind generally fail.

Never imply otherwise. Do not cite statistics, name market sizes, or refer to studies, competitors' funding, or user numbers. If you name a category of existing alternative, frame it as something to check rather than something you verified.

Rules for each field:
- reflection: state the problem as the USER experiences it, not the solution the founder described. One or two sentences. If they described only a solution, infer the problem it implies. This must read as though you understood them, without flattering them.
- icp: as narrow as their words support. "Small businesses" is a failure. If they were vague, say what you would need to know to narrow it.
- today: what these people most likely do about this right now without any product. A spreadsheet, a group chat, a person they pay, or simply tolerating it. This is usually the real competitor and founders routinely forget it.
- first_check: the single assumption this idea most depends on, and why it would sink the idea if false. Pick the one that is cheapest to test and most likely to be wrong. Not a list.
- questions: exactly two or three interview questions, non-leading by construction. Ask about the last time the problem actually happened, never what someone would hypothetically do or want. Pair each with listen_for: the specific thing in an answer that makes it real evidence rather than politeness.
- needs_research: the most important thing you could NOT determine from a single read with no research. Be specific to this idea. This field is not a disclaimer, it is the honest boundary of what you just did.

Every field above is required and must be present in your response. There is no partial answer: a response missing any field is discarded entirely and the founder sees an error instead of a read.`,
  buildMessages: ({ description }) => [
    {
      role: "user",
      content: `A founder typed this into the box:\n\n${description.slice(0, 4000)}`,
    },
  ],
});
