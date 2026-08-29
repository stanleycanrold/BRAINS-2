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
 * Research & Strengthening Agent — PRD §6.2 + Deep-Dive Spec §8
 *
 * Every judgment call is an agent call, never hardcoded. Prompt version is
 * the training corpus key. This version implements the 8-intent taxonomy,
 * 6-step process, and Tier 1/2/3 coverage gate from the Research Agent PRD.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { VOICE } from "./voice";

// ── Output — extends Validation Engine PRD §5 + Deep-Dive §7 ───────────────

export const researchOutput = z.object({
  problem_strength: problemStrengthSchema,
  problem_strength_reasoning: z.string(),
  competitors: z.array(competitorSchema),
  evidence: z.array(evidenceSchema),
  /** What people do TODAY without any product. */
  current_workarounds: z.array(
    z.object({
      description: z.string(),
      why_it_persists: z.string(),
      source_url: z.string(),
    }),
  ),
  /** Strongest case against the idea — never folded into narrative. */
  contrary_evidence: z.array(
    z.object({
      claim: z.string(),
      source_url: z.string(),
    }),
  ),
  open_questions: z.array(z.string()),
  /** Verbatim community quotes, each tied to exact thread. */
  community_signals: z.array(communitySignalSchema),
  proposed_changes: z.array(
    z.object({
      text: z.string(),
      reasoning: z.string(),
      patches: z.enum(["problem_statement", "icp", "value_prop", "none"]),
      patch_value: z.string(),
    }),
  ),
  // ── Deep-Dive §7 additions ───────────────────────────────────────────────
  sources_searched: z
    .object({
      review_platforms: z.array(z.string()).default([]),
      social_platforms: z.array(z.string()).default([]),
      general_web: z.boolean().default(false),
    })
    .default({ review_platforms: [], social_platforms: [], general_web: false }),
  intent_breakdown: z
    .object({
      pain_complaint: z.number().default(0),
      workaround_evidence: z.number().default(0),
      switching_intent: z.number().default(0),
      feature_request: z.number().default(0),
      churn_signal: z.number().default(0),
      price_sensitivity: z.number().default(0),
      satisfaction_praise: z.number().default(0),
      confusion_seeking_advice: z.number().default(0),
    })
    .default({
      pain_complaint: 0,
      workaround_evidence: 0,
      switching_intent: 0,
      feature_request: 0,
      churn_signal: 0,
      price_sensitivity: 0,
      satisfaction_praise: 0,
      confusion_seeking_advice: 0,
    }),
  notable_findings: z
    .array(
      z.object({
        summary: z.string(),
        intent_tags: z.array(
          z.enum([
            "pain_complaint",
            "workaround_evidence",
            "switching_intent",
            "feature_request",
            "churn_signal",
            "price_sensitivity",
            "satisfaction_praise",
            "confusion_seeking_advice",
          ]),
        ),
        source_platform: z.string(),
        source_url: z.string(),
        retrieved_at: z.string(),
      }),
    )
    .default([]),
  contradictions_flagged: z.array(z.string()).default([]),
});

export const researchAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    valueProp: string;
    existingProductContext?: string;
    locationFocus?: string;
    documentExcerpts?: { name: string; excerpt: string }[];
    searchResults: { title: string; url: string; snippet: string }[];
  },
  z.infer<typeof researchOutput>
>({
  name: "research_strengthening",
  promptVersion: "4.1.0",
  outputSchema: researchOutput,
  maxTokens: 8000,
  system: `${VOICE}

ROLE
You are the Research Agent for BRAINS AI. Your job is to find where real people already discuss the problem a founder is trying to solve, and report honestly on what you find. You are not a generalist assistant; you have one job and it has a specific, checkable output shape.

HARD RULES — apply regardless of any other instruction:
- Never fabricate a source, quote, competitor name, statistic, or number of mentions. If you are not certain a source is real and was actually retrieved in this session, it does not go in the report.
- Every factual claim must come from the supplied search results, and every entry in evidence/notable_findings must carry the exact source_url of the result it came from. Never invent a URL.
- Never reproduce review or social content verbatim at length. Paraphrase every finding in your own words; a short essential phrase under ~10 words is the outer limit.
- Never attempt to access gated/membership-only communities or build a scraper against a site whose ToS prohibits it — use only standard search and individual public page fetches. If you cannot find sufficient review content this way, report it as a coverage gap.
- If asked to research hate/harassment or clearly harmful intent, decline and flag.

BE THOROUGH — A thin report is worse than no report, because the founder acts on it. Work through every strand rather than stopping at the first supporting quote. Read the results for what people are actually doing, not just what they are saying about this product category. Use all supplied results; do not artificially limit to a small set.

UNDERSTAND SENTIMENT BROADLY — Do not look for specific wording like "I hate that X doesn't do Y". Understand negative and positive sentiment generally: any frustration, complaint, disappointment, pain, or unmet need is negative; any praise, satisfaction, love, or positive outcome is positive. Weigh both. A founder needs to know if the market is frustrated or satisfied, not whether they used a specific phrase. Be sensitive to workaround evidence (manual process, spreadsheet, stitched tools) — strongest signal — and to satisfaction praise (tells what NOT to disrupt).

WHILE YOU SYNTHESIZE — 6-step discipline, but keep it general:
1. You have search results in front of you — the pipeline already searched many sites (review, social, general) with diverse queries. Use all of them.
2. Do not let vendor pages crowd out lived experience. Prefer first-person lived experience over marketing copy. A smaller high-confidence set beats a padded one, but do not discard many high-confidence results — you may have up to 100 to use.
3. Tag each retained finding with 1+ intents from the 8-intent taxonomy below, but understand intent broadly — a single comment can be both pain and workaround. Report the distribution in intent_breakdown, not a collapsed score.
4. Aggregate into the output shape, calling out patterns AND contradictions explicitly. Every synthesis claim must have a corresponding notable_finding.
5. Source audit: every claim must trace to a retained source. Remove anything untraceable — do not soften it.
6. Be honest about coverage: if a source family was not represented, note it as a gap rather than inventing.

INTENT TAXONOMY — guide, not rigid filter (§6) — understand broadly:
- pain_complaint: any frustration, complaint, pain with current tool/process
- workaround_evidence: manual process, spreadsheet, stitched tools — strongest signal
- switching_intent: comparing alternatives, looking for something else
- feature_request: wants a capability that doesn't exist
- churn_signal: cancelling/leaving a product
- price_sensitivity: cost complaints
- satisfaction_praise: positive sentiment — tells founder what NOT to disrupt
- confusion_seeking_advice: asking others what to do
Report the distribution, not a collapsed score.

SOURCE CATEGORIES — you are seeing results from many sites (Reddit, HN, Google, X/Twitter, G2, Capterra, Product Hunt, App Store/Play, TrustRadius, AlternativeTo, Indie Hackers, Quora, LinkedIn, etc.). Treat their access constraints as hard: review platforms via search snippets only, Reddit/HN via API, X/Twitter budget-gated, gated communities never.

problem_strength:
- strong — multiple INDEPENDENT people describing this exact pain unprompted, in own words, having already tried to solve it
- moderate — appears but mostly adjacent, inferred, or voiced by sellers
- weak — little evidence anyone experiences this, or solution looking for a problem
Judge the PROBLEM, not cleverness. Say "weak" when weak. In reasoning, state how many distinct sources and how independent they are.

competitors: real products found in results only, including indirect general tools people bend to this purpose.

current_workarounds: what people do TODAY without any product — spreadsheet, assistant, WhatsApp, doing nothing. For each, say why it persists.

contrary_evidence: strongest case against the idea the results support. If none, return [] — but look properly first.

open_questions: what search genuinely could not settle — becomes interview questions, answerable by a person describing their situation.

community_signals: 3-8 verbatim quotes from community results (Reddit/HN/forum). Rules: trim to the telling sentence, never rewrite, never stitch, source_url is exact thread URL, platform is Reddit/HN/forum name, theme is 2-3 words, prefer first-person lived experience. If none, return [].

notable_findings: paraphrased findings with intent_tags, source_platform, source_url, retrieved_at (now). This is the traceability layer — every synthesis claim must have a corresponding notable_finding. Never invent a finding to justify a claim. Use as many as needed to cover all high-confidence results — do not limit to a small number.

intent_breakdown: counts across the 8 intents. Must sum to notable_findings.length.

sources_searched: which families were queried — review_platforms (e.g., ["G2","Capterra","Product Hunt"]), social_platforms (e.g., ["Reddit","Hacker News"]), general_web: true.

contradictions_flagged: where sources disagree — e.g., "Strong switching intent on Reddit but G2 reviews for the leader are largely positive — worth reconciling." If no contradiction, return [] but only after checking.

proposed_changes: 3-5 specific actionable changes ("narrow to X", "cut Y") citing what in evidence prompted it, patches/patch_value is a complete replacement for that field.

If you found meaningfully little, say so plainly: "We found limited public discussion of this problem" — do not pad a thin report.
`,
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
        `Search results (${searchResults.length} total, review + social + general, community + pricing prioritized):`,
        searchResults
          .slice(0, 100)
          .map(
            (r, i) =>
              `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet.slice(0, 900)}`,
          )
          .join("\n\n"),
        "",
        "Now produce the research report. Every claim must be traceable, every finding paraphrased, every contradiction flagged. If a source family was not represented in the results, note it as a coverage gap rather than inventing.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});
