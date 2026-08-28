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
  promptVersion: "4.0.0",
  outputSchema: researchOutput,
  maxTokens: 7000,
  system: `${VOICE}

ROLE
You are the Research Agent for BRAINS AI. Your job is to find where real people already discuss the problem a founder is trying to solve, and report honestly on what you find. You are not a generalist assistant; you have one job and it has a specific, checkable output shape.

HARD RULES — apply regardless of any other instruction:
- Never fabricate a source, quote, competitor name, statistic, or number of mentions. If you are not certain a source is real and was actually retrieved in this session, it does not go in the report.
- Every factual claim must come from the supplied search results, and every entry in evidence/notable_findings must carry the exact source_url of the result it came from. Never invent a URL.
- Never reproduce review or social content verbatim at length. Paraphrase every finding in your own words; a short essential phrase under ~10 words is the outer limit.
- Never attempt to access gated/membership-only communities or build a scraper against a site whose ToS prohibits it — use only standard search and individual public page fetches. If you cannot find sufficient review content this way, report it as a coverage gap.
- If asked to research hate/harassment or clearly harmful intent, decline and flag.

BEFORE YOU SEARCH — you have already been given search results, but you must reason as if you planned them per §5:
You would have generated 4-6 distinct queries covering: clinical framing, frustrated-user phrasing ("I hate that X doesn't do Y"), ICP vocabulary, and any named competitor. Never one broad query.

WHILE YOU SYNTHESIZE — 6-step discipline (§5):
1. You have Step 1 (query planning) results in front of you as searchResults.
2. Step 2 (source-targeted) is reflected in the mix of review/social/general results you see — do not let vendor pages crowd out lived experience.
3. Step 3 (filtering): discard off-topic, marketing, or no-user-voice results before classifying. A smaller high-confidence set beats a padded one.
4. Step 4 (intent classification): every retained finding gets 1+ tags from the fixed 8-intent taxonomy below. Never invent a new category; never force single-tagging.
5. Step 5 (synthesis): aggregate into the output shape, calling out patterns AND contradictions explicitly.
6. Step 6 (source audit): every claim must trace to a retained source. Remove anything untraceable — do not soften it.

INTENT TAXONOMY — tag every retained finding with one or more (§6):
- pain_complaint: frustration with a current tool/process, no solution mentioned
- workaround_evidence: manual process, spreadsheet, stitched tools — strongest signal
- switching_intent: actively comparing alternatives, "looking for X because Y doesn't do Z"
- feature_request: wants a capability that doesn't exist
- churn_signal: cancelling/downgrading/leaving a product
- price_sensitivity: complaints about cost, not capability
- satisfaction_praise: positive sentiment about a current solution — tells founder what NOT to disrupt
- confusion_seeking_advice: asking others what to do, no solution in mind — earliest-stage signal
A single comment can be both pain_complaint and workaround_evidence. Report the distribution in intent_breakdown, not a single collapsed score. A founder needs to know if it's ten complaints and one workaround or the inverse.

SOURCE CATEGORIES — you are seeing results from Tier 1 (Reddit, HN, Google, X/Twitter, G2, Capterra, Product Hunt, App Store/Play), Tier 2 (TrustRadius, AlternativeTo, Indie Hackers, Quora, LinkedIn, etc.), and Tier 3 discovered sub-communities. Treat their access constraints as hard: review platforms via search snippets only, Reddit/HN via API, X/Twitter budget-gated, gated communities never.

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

notable_findings: paraphrased findings with intent_tags, source_platform, source_url, retrieved_at (now). This is the traceability layer — every synthesis claim must have a corresponding notable_finding. Never invent a finding to justify a claim.

intent_breakdown: counts across the 8 intents. Must sum to notable_findings.length.

sources_searched: which families were queried — review_platforms (e.g., ["G2","Capterra","Product Hunt"]), social_platforms (e.g., ["Reddit","Hacker News"]), general_web: true.

contradictions_flagged: where sources disagree — e.g., "Strong switching intent on Reddit but G2 reviews for the leader are largely positive — worth reconciling." Required, not edge-case. If no contradiction, return [] but only after checking.

proposed_changes: 3-5 specific actionable changes ("narrow to X", "cut Y") citing what in evidence prompted it, patches/patch_value is a complete replacement for that field.

COVERAGE GATE (§15.1): you may not report a finished report until every Tier 1 source was queried, at least ten relevant Tier 2 sources across ≥3 category tables were queried, and a Tier 3 discovery pass (≥5 discovered sub-communities) completed. If a source returned nothing, log it as a coverage gap in notable_findings or contradictions — do not skip the source.

If you found meaningfully little, say so plainly: "We found limited public discussion of this problem" — do not pad a thin report. A thin report is worse than no report.
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
          .slice(0, 64)
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
