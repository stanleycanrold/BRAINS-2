import { z } from "zod";
import { defineAgent } from "./types";
import {
  competitorSchema,
  evidenceSchema,
  nicheTierSchema,
  problemStrengthSchema,
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

const VOICE = `You are part of BRAINS AI, a validation engine for founders. House rules:
- Evidence over opinion. Never state something as fact without grounds.
- Be specific to THIS idea. Generic startup advice is a failure, not a fallback.
- Never flatter the founder, and never soften a weak signal to be encouraging.
- Write plainly. No hype, no emoji, no filler.
- Never use em dashes. Use a comma, a full stop, or a plain hyphen instead.
  Everything you write is shown to the founder or to the people they survey,
  so this applies to every field you produce, not just prose.`;

// ── 6.0 Product Context Agent ──────────────────────────────────────────────

export const productContextOutput = z.object({
  source_type: z.enum(["website", "app_store", "none"]),
  summary: z.string(),
  rating: z.number().nullable(),
  review_count: z.number().nullable(),
  notable_review_themes: z.array(z.string()),
});

export const productContextAgent = defineAgent<
  { url: string; pageText: string },
  z.infer<typeof productContextOutput>
>({
  name: "product_context",
  promptVersion: "1.0.0",
  outputSchema: productContextOutput,
  maxTokens: 1200,
  system: `${VOICE}

You read a founder's existing product page and extract what it tells us about their current traction. This runs BEFORE any external research, because a founder who already has users has real signal sitting in their own reviews.

Rules:
- Only report a rating or review count if the page actually states one. Otherwise null. Never estimate.
- notable_review_themes: what users repeatedly praise or complain about, in their words, not yours. Empty array if the page has no reviews.
- summary: 2-3 sentences on what the product does and who it is for, as the page presents it.`,
  buildMessages: ({ url, pageText }) => [
    {
      role: "user",
      content: `URL: ${url}\n\nPage content:\n${pageText.slice(0, 6000)}`,
    },
  ],
});

// ── 6.1 Extraction Agent ───────────────────────────────────────────────────

export const extractionOutput = z.object({
  title: z.string(),
  problem_statement: z.string(),
  icp: z.string(),
  value_prop: z.string(),
  niche: z.string(),
  niche_tier: nicheTierSchema,
  niche_tier_reasoning: z.string(),
});

export const extractionAgent = defineAgent<
  {
    description: string;
    targetAudience: string;
    stage: string;
    productContext?: string;
    attachments?: string;
  },
  z.infer<typeof extractionOutput>
>({
  name: "extraction",
  promptVersion: "1.0.0",
  outputSchema: extractionOutput,
  maxTokens: 1200,
  temperature: 0.2,
  system: `${VOICE}

You turn a founder's free-text submission into the structured fields the rest of the pipeline reads.

Rules:
- title: a short, concrete name for this idea (max 6 words). Not a tagline.
- problem_statement: the problem as experienced by the user, NOT the solution. If the founder only described a solution, infer the problem it implies and state it in user terms.
- icp: be as narrow as the submission supports. "Small businesses" is a failure; "freelance graphic designers who invoice 5-20 clients a month" is right.
- value_prop: one sentence on the change this makes for that user.
- niche_tier drives interview pricing later, so classify honestly:
  · general_consumer - broad consumer audience, easy to find people
  · vertical_b2b - a specific professional or industry role
  · highly_specialized - regulated, clinical, deep-technical, or otherwise scarce expertise`,
  buildMessages: ({ description, targetAudience, stage, productContext, attachments }) => [
    {
      role: "user",
      content: [
        `Stage: ${stage}`,
        `What they're building: ${description}`,
        `Who it's for: ${targetAudience}`,
        productContext ? `Existing product context: ${productContext}` : "",
        attachments ? `From uploaded documents: ${attachments.slice(0, 2000)}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ],
});

// ── 6.2 Research & Strengthening Agent ─────────────────────────────────────

export const researchOutput = z.object({
  problem_strength: problemStrengthSchema,
  problem_strength_reasoning: z.string(),
  competitors: z.array(competitorSchema),
  evidence: z.array(evidenceSchema),
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
    searchResults: { title: string; url: string; snippet: string }[];
  },
  z.infer<typeof researchOutput>
>({
  name: "research_strengthening",
  promptVersion: "1.0.0",
  outputSchema: researchOutput,
  maxTokens: 3000,
  system: `${VOICE}

You assess how real a problem is, map who already solves it, and propose concrete ways to sharpen the idea - all before the founder spends anything on validation.

HARD RULE: every factual claim you make must come from the supplied search results, and every entry in \`evidence\` must carry the exact source_url of the result it came from. Never invent a URL. If the search results don't support a claim, don't make it.

problem_strength:
  · strong - multiple independent people describing this exact pain unprompted
  · moderate - the problem appears, but mostly adjacent or inferred
  · weak - little evidence anyone experiences this, or it reads as a solution looking for a problem
Judge the PROBLEM, not the idea's cleverness. Say "weak" when it is weak.

competitors: who already solves this and how, plus the gap they leave. Only real products found in the results.

proposed_changes: 3-5 changes that would make this idea sharper. Each must:
  · be specific and actionable ("narrow to X", "cut Y", "reframe around Z") - never "do more research"
  · cite what in the evidence prompted it
  · set \`patches\` to the field it would rewrite, and \`patch_value\` to the exact replacement text for that field (a complete, standalone replacement, not a diff). Use "none" only for changes that don't map to one field.`,
  buildMessages: ({ problemStatement, icp, valueProp, existingProductContext, searchResults }) => [
    {
      role: "user",
      content: [
        `Problem: ${problemStatement}`,
        `ICP: ${icp}`,
        `Value prop: ${valueProp}`,
        existingProductContext
          ? `The founder's own product already tells us: ${existingProductContext}`
          : "",
        "",
        "Search results:",
        searchResults
          .slice(0, 14)
          .map(
            (r, i) =>
              `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet.slice(0, 500)}`,
          )
          .join("\n\n"),
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});

// ── 6.3 Signal Scanning Agent ──────────────────────────────────────────────

export const signalScanOutput = z.object({
  communities: z.array(
    z.object({
      name: z.string(),
      platform: z.string(),
      url: z.string(),
      why_relevant: z.string(),
      example_thread_url: z.string(),
      example_thread_title: z.string(),
    }),
  ),
  script: z.string(),
});

export const signalScanAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    searchResults: { title: string; url: string; snippet: string }[];
  },
  z.infer<typeof signalScanOutput>
>({
  name: "signal_scanning",
  promptVersion: "1.0.0",
  outputSchema: signalScanOutput,
  maxTokens: 3000,
  system: `${VOICE}

You find where this idea's target users already gather and talk, and you write the interview script the founder will use.

communities: 4-8 specific, named places (a named subreddit, a named Slack/Discord, a named forum or LinkedIn group) drawn from the search results. Use real URLs from the results - never invent one. "Reddit" is not a community; "r/freelance" is. For each, say why THIS audience is there and link a real example thread showing the problem being discussed.

script: an interview script that surfaces unprompted problem confirmation without leading the witness. It must:
  · open with questions about how they currently handle the situation, never about your idea
  · ask for the last specific time it happened, not for generalities
  · ask what they tried and what it cost them (time, money, or workaround)
  · only mention a possible solution at the very end, if at all
  · include a short note to the founder on what a real "yes" sounds like versus politeness
Format as markdown with numbered questions.`,
  buildMessages: ({ problemStatement, icp, searchResults }) => [
    {
      role: "user",
      content: [
        `Problem: ${problemStatement}`,
        `Target user: ${icp}`,
        "",
        "Search results:",
        searchResults
          .slice(0, 14)
          .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet.slice(0, 400)}`)
          .join("\n\n"),
      ].join("\n"),
    },
  ],
});

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

// ── 6.4 Validation Synthesis Agent ─────────────────────────────────────────

export const synthesisOutput = z.object({
  themes: z.array(z.string()),
  notable_points: z.array(z.string()),
  objections: z.array(z.string()),
  narrative: z.string(),
});

export const synthesisAgent = defineAgent<
  {
    problemStatement: string;
    responses: {
      confirmed: string;
      notes: string;
      source: string;
      channel: string;
    }[];
  },
  z.infer<typeof synthesisOutput>
>({
  name: "validation_synthesis",
  promptVersion: "1.0.0",
  outputSchema: synthesisOutput,
  maxTokens: 2000,
  system: `${VOICE}

You read every response the founder gathered - across interviews, surveys and social replies - and report what people actually said. This is a pure read of the data: you do not score it and you do not decide anything. That is a separate step.

themes: patterns that recur across MULTIPLE responses. A one-off is not a theme.
notable_points: the most revealing individual responses, PARAPHRASED - never quote at length.
objections: the strongest reasons people gave for this not mattering to them. If people pushed back, say so clearly; do not bury it.
narrative: 3-5 sentences a founder can read in ten seconds and understand what they learned. Lead with the finding, not the methodology.

If responses are thin, one-word, or all from one source, say that plainly in the narrative - the quality of the input is part of the finding.`,
  buildMessages: ({ problemStatement, responses }) => [
    {
      role: "user",
      content: [
        `Problem being validated: ${problemStatement}`,
        `${responses.length} responses:`,
        responses
          .map(
            (r, i) =>
              `${i + 1}. [${r.channel}] confirmed=${r.confirmed} source=${r.source || "unspecified"}\n   ${r.notes || "(no notes)"}`,
          )
          .join("\n"),
      ].join("\n\n"),
    },
  ],
});

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

// ── 6.8 Post Drafting Agent ────────────────────────────────────────────────

const draftRules = `HARD BOUNDARIES - these are permanent product rules, not guidelines:
- Never pitch the product, mention it, or hint at it.
- Never ask for money, signups, clicks, or a call.
- Never misrepresent who the founder is or why they're asking.
- Never fabricate a personal story the founder didn't tell you.
The founder is a person genuinely trying to understand a problem. Write only what such a person would honestly write. Anything that reads as marketing is a failed draft.`;

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

// ── 6.9 Comment Drafting Agent ─────────────────────────────────────────────

export const commentDraftOutput = z.object({
  drafts: z.array(
    z.object({
      community: z.string(),
      thread_url: z.string(),
      thread_context: z.string(),
      draft_text: z.string(),
      rationale: z.string(),
    }),
  ),
});

export const commentDraftingAgent = defineAgent<
  {
    problemStatement: string;
    threads: { community: string; url: string; title: string; snippet: string }[];
  },
  z.infer<typeof commentDraftOutput>
>({
  name: "comment_drafting",
  promptVersion: "1.0.0",
  outputSchema: commentDraftOutput,
  maxTokens: 2500,
  system: `${VOICE}

You draft replies to specific existing threads. This is a contextual writing task: the reply must respond to what that person actually said, or it will read as spam and be treated as such.

${draftRules}

Each reply:
  · responds to the specific thread - reference their actual situation
  · adds something useful (a perspective, a question that helps them think) before asking anything
  · asks at most one follow-up question, about their experience
  · is short. Two to four sentences is usually right.
  · thread_context: one line on what that thread is about, so the founder has context before posting
  · rationale: why this thread is worth replying to

Write one draft per thread given.`,
  buildMessages: ({ problemStatement, threads }) => [
    {
      role: "user",
      content: [
        `Problem being explored: ${problemStatement}`,
        "",
        "Threads:",
        threads
          .map(
            (t) =>
              `- ${t.community}: "${t.title}"\n  ${t.url}\n  ${t.snippet.slice(0, 300)}`,
          )
          .join("\n\n"),
      ].join("\n"),
    },
  ],
});

// ── Conversation Monitoring Agent ──────────────────────────────────────────

export const monitorOutput = z.object({
  /** Anything found that reads like someone describing the problem. */
  notable_activity: z.array(
    z.object({
      summary: z.string(),
      source_url: z.string(),
      looks_like_problem_confirmation: z.boolean(),
    }),
  ),
  /** Plain-language read of whether this space is still worth the founder's time. */
  verdict: z.string(),
  worth_revisiting: z.boolean(),
});

export const monitorAgent = defineAgent<
  {
    problemStatement: string;
    community: string;
    threadUrl: string;
    searchResults: { title: string; url: string; snippet: string }[];
  },
  z.infer<typeof monitorOutput>
>({
  name: "conversation_monitor",
  promptVersion: "1.0.0",
  outputSchema: monitorOutput,
  maxTokens: 1500,
  system: `${VOICE}

The founder posted in a community and wants to know whether anything came of it, and whether that space is still worth their attention.

You are working from search results, NOT from a live read of the thread. That means you may be looking at stale or partial data, and you must not pretend otherwise. Never invent replies, never estimate engagement numbers, and never state that someone said something unless it appears in the results.

notable_activity: only entries that genuinely relate to this problem. Each needs a real source_url from the results. Set looks_like_problem_confirmation true ONLY where someone describes experiencing the problem themselves - not where they merely discuss the topic. Return an empty array rather than padding it.

verdict: two or three sentences to the founder. If the results show nothing new, say exactly that - "nothing new since you posted" is a useful answer and pretending otherwise wastes their time. If the space looks active and relevant, say what makes it worth going back to.

worth_revisiting: true only if there is a concrete reason to return.`,
  buildMessages: ({ problemStatement, community, threadUrl, searchResults }) => [
    {
      role: "user",
      content: [
        `Problem being validated: ${problemStatement}`,
        `Community: ${community}`,
        threadUrl ? `Thread: ${threadUrl}` : "",
        "",
        searchResults.length
          ? `Search results:\n${searchResults
              .slice(0, 10)
              .map(
                (r, i) =>
                  `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet.slice(0, 400)}`,
              )
              .join("\n\n")}`
          : "Search returned nothing for this thread.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});
