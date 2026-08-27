import { z } from "zod";
import { defineAgent } from "../types";
import {
  communitySignalSchema,
  competitorSchema,
  evidenceSchema,
  problemStrengthSchema,
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

// ── 6.2 Research & Strengthening Agent ─────────────────────────────────────

export const researchOutput = z.object({
  problem_strength: problemStrengthSchema,
  problem_strength_reasoning: z.string(),
  competitors: z.array(competitorSchema),
  evidence: z.array(evidenceSchema),
  /**
   * What people currently do instead. Almost always the real competition:
   * ideas lose to a spreadsheet and a habit far more often than to a rival
   * product, and a founder who only sees named competitors misreads the
   * market they are entering.
   */
  current_workarounds: z.array(
    z.object({
      description: z.string(),
      why_it_persists: z.string(),
      source_url: z.string(),
    }),
  ),
  /**
   * Evidence that cuts the other way. Recorded separately so it cannot be
   * quietly folded into a positive narrative - if the strongest argument
   * against the idea is missing, the report is flattering, not useful.
   */
  contrary_evidence: z.array(
    z.object({
      claim: z.string(),
      source_url: z.string(),
    }),
  ),
  /** Questions the search could not settle, for the interviews to answer. */
  open_questions: z.array(z.string()),
  /**
   * Verbatim things real people said in community threads found by the
   * search. The market's own voice, each quote tied to its exact thread.
   */
  community_signals: z.array(communitySignalSchema),
  proposed_changes: z.array(
    z.object({
      text: z.string(),
      reasoning: z.string(),
      patches: z.enum(["problem_statement", "icp", "value_prop", "none"]),
      patch_value: z.string(),
    }),
  ),
});

export const researchAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    valueProp: string;
    existingProductContext?: string;
    /** Country or region to weight evidence toward. Blank for worldwide. */
    locationFocus?: string;
    /** Text pulled from documents the founder attached. Context, not evidence. */
    documentExcerpts?: { name: string; excerpt: string }[];
    searchResults: { title: string; url: string; snippet: string }[];
  },
  z.infer<typeof researchOutput>
>({
  name: "research_strengthening",
  promptVersion: "3.0.0",
  outputSchema: researchOutput,
  // Raised with the brief: the extra strands need room to be answered
  // properly rather than truncated into a thin report. Raised again for
  // community_signals, which quote real threads verbatim.
  maxTokens: 5500,
  system: `${VOICE}

You assess how real a problem is, map who already solves it, and propose concrete ways to sharpen the idea - all before the founder spends anything on validation.

HARD RULE: every factual claim you make must come from the supplied search results, and every entry in \`evidence\` must carry the exact source_url of the result it came from. Never invent a URL. If the search results don't support a claim, don't make it.

BE THOROUGH. A thin report is worse than no report, because the founder acts on it. Work through every strand below rather than stopping at the first supporting quote you find. Read the results for what people are actually doing, not just what they are saying about this product category.

SOURCE MIX: when the supplied results include Reddit, Hacker News, forums, or other community discussions, use them in the evidence, workarounds, contrary_evidence, and open_questions. Do not let vendor pages or SEO articles stand in for lived experience. Explicitly distinguish independent people describing a problem from companies marketing a solution. If community results are present, mention what they add or contradict rather than silently omitting them.

problem_strength:
  · strong - multiple INDEPENDENT people describing this exact pain unprompted, in their own words, having already tried to solve it
  · moderate - the problem appears, but mostly adjacent, inferred, or voiced by people with something to sell
  · weak - little evidence anyone experiences this, or it reads as a solution looking for a problem
Judge the PROBLEM, not the idea's cleverness. Say "weak" when it is weak. Two people complaining is not a market, and one vendor's blog post is not evidence.

In the reasoning, say how many distinct sources support the judgment and how independent they are of each other. A founder should be able to tell the difference between "twelve people said this" and "one thread said this and eleven pages quoted that thread".

competitors: who already solves this and how, plus the gap they leave. Only real products found in the results. Include the indirect ones - a general tool people bend to this purpose competes just as hard as a direct rival.

current_workarounds: what people do TODAY without any product. Spreadsheets, an assistant, a WhatsApp group, doing nothing and absorbing the cost. For each, say why it persists despite being bad, because that is what a new product has to beat.

contrary_evidence: the strongest case against this idea that the results support. If you found none, return an empty array rather than inventing balance - but look properly first.

open_questions: what the search genuinely could not settle. These become interview questions, so make them answerable by a person describing their own situation, not by more searching.

community_signals: 3-8 verbatim quotes from real people in the community results - Reddit posts and comments, Hacker News comments, forum replies. Rules:
  · quote text that actually appears in the supplied snippets. Trim a long passage down to the telling sentence, but never rewrite it, and never stitch words from different places together.
  · source_url is the exact URL of the thread the quote sits in. Never invent one.
  · platform is Reddit, Hacker News, or the forum named in the result.
  · theme is two or three words on what the quote shows: "workaround cost", "tool abandonment", "time lost", and so on.
  · Prefer first-person lived experience over opinions about the market. If no community results contain usable first-person quotes, return an empty array rather than paraphrasing claims as quotes.

proposed_changes: 3-5 changes that would make this idea sharper. Each must:
  · be specific and actionable ("narrow to X", "cut Y", "reframe around Z") - never "do more research"
  · cite what in the evidence prompted it
  · set \`patches\` to the field it would rewrite, and \`patch_value\` to the exact replacement text for that field (a complete, standalone replacement, not a diff). Use "none" only for changes that don't map to one field.`,
  buildMessages: ({
    problemStatement,
    icp,
    valueProp,
    existingProductContext,
    locationFocus,
    documentExcerpts,
    searchResults,
  }) => [
    {
      role: "user",
      content: [
        `Problem: ${problemStatement}`,
        `ICP: ${icp}`,
        `Value prop: ${valueProp}`,
        locationFocus
          ? `Market to focus on: ${locationFocus}. Weight evidence from this market heavily, and say so when a finding comes from somewhere else.`
          : "Market: worldwide, no particular country.",
        documentExcerpts?.length
          ? [
              "",
              "The founder attached documents. Treat these as context about",
              "their thinking, NOT as evidence - they are not independent",
              "sources:",
              documentExcerpts
                .map((d) => `--- ${d.name} ---\n${d.excerpt.slice(0, 4000)}`)
                .join("\n\n"),
            ].join("\n")
          : "",
        existingProductContext
          ? `The founder's own product already tells us: ${existingProductContext}`
          : "",
        "",
        "Search results (48 max, community + pricing prioritized):",
        searchResults
          .slice(0, 48)
          .map(
            (r, i) =>
              `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet.slice(0, 800)}`,
          )
          .join("\n\n"),
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});
