import { z } from "zod";
// Value import, but not a cycle: response-visibility imports only the TYPE
// back from here, which erases at compile time.
import { founderVisible } from "@/lib/domain/response-visibility";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The idea-state record - PRD §5.
 *
 * This is the shared context object every agent in the pipeline reads from and
 * writes back to, rather than holding private state. It is stored versioned
 * and append-only (PRD §10 "no data loss"): nothing is ever overwritten.
 *
 * These zod schemas are the single source of truth. Agents validate their
 * output against the relevant slice, the DB stores the whole object as jsonb,
 * and the UI renders from the inferred TypeScript types.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Enums ──────────────────────────────────────────────────────────────────

export const ideaStatusSchema = z.enum([
  "draft",
  "researching",
  "validating_normal",
  "validating_fast",
  "gate_review",
  "passed",
  "needs_rework",
  "killed",
]);
export type IdeaStatus = z.infer<typeof ideaStatusSchema>;

export const stageAtEntrySchema = z.enum([
  "idea_only",
  "mvp_built",
  "live_with_users",
]);
export type StageAtEntry = z.infer<typeof stageAtEntrySchema>;

export const STAGE_LABELS: Record<StageAtEntry, string> = {
  idea_only: "Idea only",
  mvp_built: "MVP built, no users",
  live_with_users: "Live with users",
};

export const trackSchema = z.enum(["normal", "fast"]);
export type Track = z.infer<typeof trackSchema>;

export const channelSchema = z.enum(["interview", "survey", "social"]);
export type Channel = z.infer<typeof channelSchema>;

export const CHANNEL_LABELS: Record<Channel, string> = {
  interview: "Interview",
  survey: "Survey",
  social: "Social reply",
};

export const confirmedSchema = z.enum(["yes", "no", "unsure"]);
export type Confirmed = z.infer<typeof confirmedSchema>;

export const problemStrengthSchema = z.enum(["weak", "moderate", "strong"]);
export type ProblemStrength = z.infer<typeof problemStrengthSchema>;

export const signalSchema = z.enum(["go_ahead", "rethink"]);
export type Signal = z.infer<typeof signalSchema>;

export const proposalStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "edited",
]);
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

export const userDecisionSchema = z.enum(["proceed", "rework", "kill"]);
export type UserDecision = z.infer<typeof userDecisionSchema>;

export const draftStatusSchema = z.enum([
  "drafted",
  "edited",
  "posted",
  "reply_logged",
]);
export type DraftStatus = z.infer<typeof draftStatusSchema>;

export const fastTrackOrderStatusSchema = z.enum([
  "pending_sourcing",
  "scheduling",
  "in_progress",
  "completed",
]);
export type FastTrackOrderStatus = z.infer<typeof fastTrackOrderStatusSchema>;

export const nicheTierSchema = z.enum([
  "general_consumer",
  "vertical_b2b",
  "highly_specialized",
]);
export type NicheTier = z.infer<typeof nicheTierSchema>;

export const NICHE_TIER_LABELS: Record<NicheTier, string> = {
  general_consumer: "General consumer",
  vertical_b2b: "Vertical B2B / SaaS",
  highly_specialized: "Highly specialized",
};

// ── Sub-objects ────────────────────────────────────────────────────────────

export const rawSubmissionSchema = z.object({
  description: z.string(),
  target_audience: z.string(),
  product_link: z.string().nullable().default(null),
  /**
   * Where the founder wants this validated: a country, a region, or blank for
   * worldwide. Feeds the research agent, which otherwise searches globally and
   * returns evidence from markets the founder does not sell into, and decides
   * where interviewees are hired from.
   */
  location_focus: z.string().default(""),
  /** Names of uploaded supporting docs, with extracted text kept server-side. */
  attachments: z
    .array(
      z.object({
        name: z.string(),
        excerpt: z.string().default(""),
      }),
    )
    .default([]),
});
export type RawSubmission = z.infer<typeof rawSubmissionSchema>;

/**
 * Auto-fetched by the Product Context Agent (PRD §6.0) from a provided product
 * link, then shown back to the founder as an editable summary card. Replaces
 * the manual "rough user count / existing metrics" fields entirely.
 */
export const existingProductContextSchema = z.object({
  source_type: z.enum(["website", "app_store", "none"]).default("none"),
  summary: z.string().default(""),
  rating: z.number().nullable().default(null),
  review_count: z.number().nullable().default(null),
  notable_review_themes: z.array(z.string()).default([]),
  /** False when the link couldn't be fetched - UI falls back to manual entry. */
  fetch_succeeded: z.boolean().default(false),
  /**
   * Why a fetch failed, in words the founder can act on. Empty when no link
   * was given or when it worked.
   *
   * Without this a link we could not read was indistinguishable from no link
   * at all: the founder saw nothing either way and had no reason to suspect
   * the product context was missing from everything downstream.
   */
  fetch_note: z.string().default(""),
  /** True once the founder has reviewed/edited the auto-fetched summary. */
  user_confirmed: z.boolean().default(false),
});
export type ExistingProductContext = z.infer<typeof existingProductContextSchema>;

export const structuredSchema = z.object({
  problem_statement: z.string().default(""),
  icp: z.string().default(""),
  value_prop: z.string().default(""),
  /** Domain/niche, used by the Estimation Agent to pick a pricing tier. */
  niche: z.string().default(""),
  niche_tier: nicheTierSchema.default("general_consumer"),
  existing_product_context: existingProductContextSchema.default({
    source_type: "none",
    summary: "",
    rating: null,
    review_count: null,
    notable_review_themes: [],
    fetch_succeeded: false,
    fetch_note: "",
    user_confirmed: false,
  }),
});
export type Structured = z.infer<typeof structuredSchema>;

export const roundGoalSchema = z.enum(["G1","G2","G3","G4","G5"]);
export type RoundGoal = z.infer<typeof roundGoalSchema>;

export const testingContextSchema = z.object({
  round_goal: z.object({ primary: roundGoalSchema.default("G1"), secondary: roundGoalSchema.nullable().default(null) }).default({ primary: "G1", secondary: null }),
  access: z.object({
    mode: z.enum(["none","web_url","app_store","testflight_apk","prototype_url","physical"]).default("none"),
    urls: z.object({
      web_url: z.string().nullable().default(null),
      app_store_url: z.string().nullable().default(null),
      play_store_url: z.string().nullable().default(null),
      testflight_or_apk_url: z.string().nullable().default(null),
      prototype_url: z.string().nullable().default(null),
      variant_a_url: z.string().nullable().default(null),
      variant_b_url: z.string().nullable().default(null),
    }).default({ web_url: null, app_store_url: null, play_store_url: null, testflight_or_apk_url: null, prototype_url: null, variant_a_url: null, variant_b_url: null }),
    physical: z.object({
      required: z.boolean().default(false),
      location: z.string().nullable().default(null),
      ships_to_tester: z.boolean().nullable().default(null),
      logistics_notes: z.string().nullable().default(null),
    }).default({ required: false, location: null, ships_to_tester: null, logistics_notes: null }),
  }).default({ mode: "none", urls: { web_url: null, app_store_url: null, play_store_url: null, testflight_or_apk_url: null, prototype_url: null, variant_a_url: null, variant_b_url: null }, physical: { required: false, location: null, ships_to_tester: null, logistics_notes: null } }),
  formats: z.array(z.enum(["interview","open_review","guided_task","variant_choice"])).default(["interview"]),
  ongoing: z.boolean().default(false),
  freelancer_requirements: z.object({
    needs_geographic_proximity: z.boolean().default(false),
    device_or_os_requirements: z.string().nullable().default(null),
    special_instructions: z.string().nullable().default(null),
  }).default({ needs_geographic_proximity: false, device_or_os_requirements: null, special_instructions: null }),
  confidence: z.enum(["high","medium","low"]).default("medium"),
  unresolved: z.array(z.string()).default([]),
});
export type TestingContext = z.infer<typeof testingContextSchema>;

export const productModelSchema = z.object({
  what_it_does: z.string().default(""),
  core_flows: z.array(z.string()).default([]),
  key_screens: z.array(z.string()).default([]),
  stated_icp: z.string().default(""),
  candidate_test_surfaces: z.array(z.string()).default([]),
  variant_candidates: z.array(z.string()).default([]),
  confidence: z.enum(["high","medium","low"]).default("low"),
  sources: z.array(z.object({ url: z.string(), fetched_at: z.string() })).default([]),
  fetched_at: z.string().default(""),
});
export type ProductModel = z.infer<typeof productModelSchema>;

export const taskStatusSchema = z.enum(["draft","founder_review","qa","ready","live","done","paused","blocked"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.string(),
  idea_id: z.string(),
  format: z.enum(["interview","open_review","guided_task","variant_choice"]),
  goal: roundGoalSchema,
  spec_version: z.number().default(1),
  status: taskStatusSchema.default("draft"),
  assigned_to: z.string().nullable().default(null),
  qa: z.object({
    automated: z.record(z.string(), z.boolean()).default({}),
    dry_run: z.object({ passed: z.boolean().default(false), tester: z.string().nullable().default(null) }).default({ passed: false, tester: null }),
    founder_preview: z.object({ approved: z.boolean().default(false), at: z.string().nullable().default(null) }).default({ approved: false, at: null }),
  }).default({ automated: {}, dry_run: { passed: false, tester: null }, founder_preview: { approved: false, at: null } }),
  launch_gate: z.record(z.string(), z.boolean()).default({}),
  responses: z.object({ count: z.number().default(0), target: z.number().default(19) }).default({ count: 0, target: 19 }),
});

export const testSpecSchema = z.object({
  version: z.number().default(1),
  estimated_tester_minutes: z.number().default(6),
  variant_choice: z.object({
    variants: z.array(z.object({ id: z.string(), label: z.string(), url: z.string() })).default([]),
    exposure: z.enum(["sequential_randomized","side_by_side"]).default("sequential_randomized"),
    primary_question: z.string().default("Which version would you actually use?"),
    reason_prompt: z.string().default("Why?"),
    per_variant_question: z.string().default("How clear was this version? (1-5)"),
  }).nullable().default(null),
  interview: z.object({
    goal: roundGoalSchema.default("G1"),
    evidence_slots_covered: z.array(z.string()).default([]),
    questions: z.array(z.lazy(() => questionSchema)).default([]),
    adaptive_probes: z.boolean().default(true),
  }).nullable().default(null),
  guided_task: z.object({
    goal: roundGoalSchema.default("G3"),
    tasks: z.array(z.object({ step: z.string(), success_criterion: z.string(), probe: z.string().default("What did you expect to happen?") })).default([]),
  }).nullable().default(null),
  open_review: z.object({
    goal: roundGoalSchema.default("G2"),
    prompts: z.array(z.string()).default([]),
  }).nullable().default(null),
});
export type TestSpec = z.infer<typeof testSpecSchema>;
export type Task = z.infer<typeof taskSchema>;

export const competitorSchema = z.object({
  name: z.string(),
  summary: z.string(),
  source_url: z.string().default(""),
});
export type Competitor = z.infer<typeof competitorSchema>;

/**
 * A proposed change to the idea. Used identically by the Research Agent's
 * "strengthening" proposals (§4.2) and the Decision Gate's improvement
 * proposals (§4.4) - same accept/reject/edit interaction, same component.
 */
export const proposalSchema = z.object({
  id: z.string(),
  text: z.string(),
  reasoning: z.string(),
  /** Which structured field this patches when accepted. */
  patches: z
    .enum(["problem_statement", "icp", "value_prop", "none"])
    .default("none"),
  /** The value written into `patches` on accept. */
  patch_value: z.string().default(""),
  status: proposalStatusSchema.default("pending"),
  /** Present when the founder edited the proposal before accepting. */
  edited_text: z.string().nullable().default(null),
});
export type Proposal = z.infer<typeof proposalSchema>;

/** Every factual claim in a research report must carry a source (PRD §4.2). */
export const evidenceSchema = z.object({
  claim: z.string(),
  source_url: z.string(),
  source_title: z.string().default(""),
});
export type Evidence = z.infer<typeof evidenceSchema>;

/**
 * A verbatim thing a real person said in a community thread, captured during
 * research. Direct quotes with their exact source rather than paraphrase, so
 * the founder can open the thread and read the context themselves.
 */
export const communitySignalSchema = z.object({
  quote: z.string(),
  platform: z.string().default(""),
  source_url: z.string().default(""),
  source_title: z.string().default(""),
  theme: z.string().default(""),
});
export type CommunitySignal = z.infer<typeof communitySignalSchema>;

export const researchReportSchema = z.object({
  problem_strength: problemStrengthSchema.default("moderate"),
  problem_strength_reasoning: z.string().default(""),
  competitors: z.array(competitorSchema).default([]),
  evidence: z.array(evidenceSchema).default([]),
  /** What people do instead today. Usually the real competition. */
  current_workarounds: z
    .array(
      z.object({
        description: z.string(),
        why_it_persists: z.string().default(""),
        source_url: z.string().default(""),
      }),
    )
    .default([]),
  /** Kept separate so it cannot be folded into a flattering narrative. */
  contrary_evidence: z
    .array(
      z.object({ claim: z.string(), source_url: z.string().default("") }),
    )
    .default([]),
  /** What search could not settle. Feeds the interview questions. */
  open_questions: z.array(z.string()).default([]),
  /**
   * Verbatim community quotes found during research - the lived-experience
   * voice of the market, each with its exact thread so it can be checked.
   */
  community_signals: z.array(communitySignalSchema).default([]),
  proposed_changes: z.array(proposalSchema).default([]),
  /** True when the run had no live search available; surfaced in the UI. */
  unsourced: z.boolean().default(false),
  generated_at: z.string().default(""),
  // ── PRD §7 additions — thorough research extensions (all optional for back-compat) ──
  /** Which source families were actually queried, for the coverage gate. */
  sources_searched: z
    .object({
      review_platforms: z.array(z.string()).default([]),
      social_platforms: z.array(z.string()).default([]),
      general_web: z.boolean().default(false),
    })
    .default({ review_platforms: [], social_platforms: [], general_web: false }),
  /** Distribution across the 8 intent categories (§6). Founder sees shape, not collapsed sentiment. */
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
  /** Paraphrased findings with intent tags, source, and retrieval time — traceability first. */
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
  /** Where sources disagree — required, not edge-case. Hiding contradiction is worse than an ugly report. */
  contradictions_flagged: z.array(z.string()).default([]),
});
export type ResearchReport = z.infer<typeof researchReportSchema>;

export const communitySchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.string().default(""),
  url: z.string().default(""),
  why_relevant: z.string().default(""),
  example_thread_url: z.string().default(""),
  example_thread_title: z.string().default(""),
});
export type Community = z.infer<typeof communitySchema>;

export const responseSchema = z.object({
  id: z.string(),
  confirmed: confirmedSchema,
  notes: z.string().default(""),
  source: z.string().default(""),
  channel: channelSchema,
  track: trackSchema.default("normal"),
  expert_id: z.string().nullable().default(null),
  expert_name: z.string().nullable().default(null),
  /** Fast Track expert interviews carry a confidence weight (PRD §4.3.2.7). */
  confidence: z.number().nullable().default(null),
  /**
   * Quality screening verdict. `rejected` responses never reach the score.
   * See the response_quality agent.
   */
  review_status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  quality_flags: z.array(z.string()).default([]),
  created_at: z.string().default(""),
});
export type ValidationResponse = z.infer<typeof responseSchema>;

export const synthesisSummarySchema = z.object({
  themes: z.array(z.string()).default([]),
  /** Paraphrased, never verbatim-scraped at length (PRD §4.4). */
  notable_points: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  narrative: z.string().default(""),
});
export type SynthesisSummary = z.infer<typeof synthesisSummarySchema>;

/**
 * A verbatim quote the quote-extraction agent pulled out of one response.
 *
 * Verbatim means the respondent's own words, trimmed but never rewritten -
 * the whole point of a quote is that a founder can trust it was actually
 * said. `why_it_matters` is the agent's one line on what makes this one
 * worth reading; `question_id` ties it back to the question that drew it.
 */
export const QUOTE_CATEGORIES = [
  "Problem Urgency",
  "Willingness to Pay",
  "Existing Friction",
  "Feature Requirement",
  "Objection & Risk",
] as const;
export const quoteCategorySchema = z.enum(QUOTE_CATEGORIES);

export const verbatimQuoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  response_id: z.string().default(""),
  question_id: z.string().nullable().default(null),
  category: quoteCategorySchema.default("Problem Urgency"),
  why_it_matters: z.string().default(""),
  created_at: z.string().default(""),
});
export type VerbatimQuote = z.infer<typeof verbatimQuoteSchema>;

/**
 * A falsifiable assumption about the business, generated from research and
 * then judged against what respondents actually said. Status and confidence
 * only ever move with evidence - the evaluation agent re-reads the pool and
 * updates them at the decision gate.
 */
export const hypothesisCategorySchema = z.enum([
  "Problem",
  "Pricing",
  "Go-To-Market",
  "Tech Feasibility",
]);
export type HypothesisCategory = z.infer<typeof hypothesisCategorySchema>;

export const hypothesisStatusSchema = z.enum([
  "Testing",
  "Validated",
  "Partially Validated",
  "Disproven",
]);
export type HypothesisStatus = z.infer<typeof hypothesisStatusSchema>;

export const hypothesisSchema = z.object({
  id: z.string(),
  statement: z.string(),
  category: hypothesisCategorySchema.default("Problem"),
  /** Which well the hypothesis came from: the research pass or live feedback. */
  basis: z.enum(["research", "feedback"]).default("research"),
  status: hypothesisStatusSchema.default("Testing"),
  /** 0-100, how strongly current evidence supports the statement. */
  confidence: z.number().default(0),
  /** Short evidence pointers FOR the statement. */
  supporting: z.array(z.string()).default([]),
  /** Short evidence pointers AGAINST it. Kept visible, never netted away. */
  counter: z.array(z.string()).default([]),
  /** What validation so far says, in one line. Empty while untested. */
  takeaway: z.string().default(""),
  /** The observable outcome that would confirm it. Shown as test method. */
  testable_expectation: z.string().default(""),
  generated_at: z.string().default(""),
});
export type Hypothesis = z.infer<typeof hypothesisSchema>;

/**
 * An empirical willingness-to-pay estimate, grounded in money people already
 * spend (competitor prices, current workarounds' cost, stated budgets) rather
 * than in what they say they would pay. When no money anchor exists the agent
 * must say so - `model: "anchor_missing"` - instead of inventing a number.
 * All amounts are whole currency units, matching what the studio displays.
 */
export const pricingIntelligenceSchema = z.object({
  wtp_point: z.number().default(0),
  wtp_range_low: z.number().default(0),
  wtp_range_high: z.number().default(0),
  currency: z.string().default("usd"),
  basis: z
    .enum(["competitor_price", "current_spend", "stated_budget", "none"])
    .default("none"),
  reasoning: z.string().default(""),
  model: z.enum(["anchored", "anchor_missing"]).default("anchor_missing"),
  generated_at: z.string().default(""),
});
export type PricingIntelligence = z.infer<typeof pricingIntelligenceSchema>;

/**
 * One interview / questionnaire question, generated from the researched idea.
 *
 * Stored structured rather than as a markdown blob so the same set can drive
 * three surfaces at once: the founder's own interviews, a public shareable
 * questionnaire, and the Fast Track interviews we run for them. A blob would
 * have meant three parsers and three chances to drift.
 */
export const questionKindSchema = z.enum([
  /** Free text - where the real signal is. */
  "open",
  /** The one question the confirmation rate is computed from. */
  "confirmation",
  /** Pick exactly one of the founder's options. */
  "single_choice",
  /** Pick any number of the founder's options. */
  "multi_choice",
  /** Short free text, one line. */
  "short_text",
  /** Yes/no or scale, for quick context. */
  "scale",
]);
export type QuestionKind = z.infer<typeof questionKindSchema>;

/** How each kind is described to the founder choosing one. */
export const QUESTION_KIND_LABELS: Record<
  QuestionKind,
  { label: string; hint: string }
> = {
  open: {
    label: "Paragraph",
    hint: "Free text. Where most of the real signal comes from.",
  },
  short_text: {
    label: "Short answer",
    hint: "One line. Good for a role, a tool name or a number.",
  },
  single_choice: {
    label: "Pick one",
    hint: "A list of options, one answer.",
  },
  multi_choice: {
    label: "Pick several",
    hint: "A list of options, any number of answers.",
  },
  scale: {
    label: "Scale of 1 to 5",
    hint: "How strongly they feel about something.",
  },
  confirmation: {
    label: "Scored question",
    hint: "The one question your confirmation rate is computed from.",
  },
};

/** Kinds a founder may pick when adding a question. */
export const SELECTABLE_QUESTION_KINDS: QuestionKind[] = [
  "open",
  "short_text",
  "single_choice",
  "multi_choice",
  "scale",
];

/** Whether this kind carries a list of choices. */
export function kindHasOptions(kind: QuestionKind): boolean {
  return kind === "single_choice" || kind === "multi_choice";
}

export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  kind: questionKindSchema.default("open"),
  /**
   * Choices, for the choice kinds. Ignored by every other kind rather than
   * modelled as a separate question type, so there is still one shape to
   * parse and one to render.
   */
  options: z.array(z.string()).default([]),
  /** Why this question earns its place - shown to the founder, not the respondent. */
  intent: z.string().default(""),
  required: z.boolean().default(false),
});
export type Question = z.infer<typeof questionSchema>;

export const questionnaireSchema = z.object({
  questions: z.array(questionSchema).default([]),
  /** Opaque token for the public link. Null until the founder shares it. */
  share_token: z.string().nullable().default(null),
  /** The link the interviews we run come in on. Null until a round is paid. */
  panel_share_token: z.string().nullable().default(null),
  /** Founder can close the questionnaire without deleting it. */
  accepting_responses: z.boolean().default(true),
  intro: z.string().default(""),
  generated_at: z.string().default(""),
});
export type Questionnaire = z.infer<typeof questionnaireSchema>;

export const validationSchema = z.object({
  track: trackSchema.nullable().default(null),
  communities: z.array(communitySchema).default([]),
  script: z.string().default(""),
  questionnaire: questionnaireSchema.default({
    questions: [],
    share_token: null,
    panel_share_token: null,
    accepting_responses: true,
    intro: "",
    generated_at: "",
  }),
  responses: z.array(responseSchema).default([]),
  confirmation_rate: z.number().default(0),
  /**
   * Quotes the quote-extraction agent pulled from responses, newest last.
   * Verbatim and tied back to the response and question they came from -
   * the evidence the studio's surface is built on.
   */
  verbatim_quotes: z.array(verbatimQuoteSchema).default([]),
  /**
   * Empirical willingness-to-pay, computed only from money anchors. Null
   * until the pricing-intelligence agent has run at least once.
   */
  pricing_intelligence: pricingIntelligenceSchema.nullable().default(null),
  synthesis_summary: synthesisSummarySchema.default({
    themes: [],
    notable_points: [],
    objections: [],
    narrative: "",
  }),
  /** Set when the founder forced analysis below the 10-response soft gate. */
  forced_early_analysis: z.boolean().default(false),
});
export type Validation = z.infer<typeof validationSchema>;

export const draftedPostSchema = z.object({
  id: z.string(),
  community: z.string(),
  community_url: z.string().default(""),
  title: z.string().default(""),
  draft_text: z.string(),
  rationale: z.string().default(""),
  status: draftStatusSchema.default("drafted"),
  edited_text: z.string().nullable().default(null),
  created_at: z.string().default(""),
  /**
   * Tracking, set once the founder says they've published.
   *
   * A posted comment is the start of a conversation, not the end of a task -
   * the replies are the actual signal. Keeping the space and the timestamp is
   * what makes it possible to come back to it rather than losing the thread
   * in a browser history somewhere.
   */
  posted_at: z.string().nullable().default(null),
  /** Where it went live. Often only known after posting. */
  posted_url: z.string().default(""),
  last_checked_at: z.string().nullable().default(null),
  /** Replies logged from this thread, each also in the unified pool. */
  replies_logged: z.number().default(0),
});
export type DraftedPost = z.infer<typeof draftedPostSchema>;

export const draftedCommentSchema = draftedPostSchema.extend({
  thread_url: z.string().default(""),
  thread_context: z.string().default(""),
});
export type DraftedComment = z.infer<typeof draftedCommentSchema>;

export const socialEngagementSchema = z.object({
  drafted_posts: z.array(draftedPostSchema).default([]),
  drafted_comments: z.array(draftedCommentSchema).default([]),
});
export type SocialEngagement = z.infer<typeof socialEngagementSchema>;

export const fastTrackOrderStateSchema = z.object({
  order_id: z.string().nullable().default(null),
  n_requested: z.number().default(0),
  cost_per_interview: z.number().default(0),
  analysis_fee: z.number().default(0),
  total_cost: z.number().default(0),
  currency: z.string().default("usd"),
  /** Where interviewees should come from, in the founder's own words. */
  location_preference: z.string().default(""),
  status: fastTrackOrderStatusSchema.default("pending_sourcing"),
  scheduled_count: z.number().default(0),
  completed_count: z.number().default(0),
});
export type FastTrackOrderState = z.infer<typeof fastTrackOrderStateSchema>;

export const riskFactorSchema = z.object({
  label: z.string(),
  detail: z.string(),
  severity: z.enum(["info", "caution", "high"]).default("info"),
});
export type RiskFactor = z.infer<typeof riskFactorSchema>;

export const decisionGateSchema = z.object({
  score: z.number().default(0),
  signal: signalSchema.nullable().default(null),
  reasoning: z.string().default(""),
  risk_factors: z.array(riskFactorSchema).default([]),
  /** Present whenever the result is below threshold (PRD §4.4). */
  diagnostic: z
    .object({
      verdict: z
        .enum([
          "wrong_problem_statement",
          "wrong_audience",
          "genuinely_weak_problem",
          "not_applicable",
        ])
        .default("not_applicable"),
      explanation: z.string().default(""),
    })
    .default({ verdict: "not_applicable", explanation: "" }),
  improvement_proposal: z.array(proposalSchema).default([]),
  user_decision: userDecisionSchema.nullable().default(null),
  kill_reason: z.string().nullable().default(null),
  decided_at: z.string().nullable().default(null),
  generated_at: z.string().default(""),
});
export type DecisionGate = z.infer<typeof decisionGateSchema>;

// ── The full idea-state object ─────────────────────────────────────────────

export const ideaStateSchema = z.object({
  idea_id: z.string(),
  version: z.number(),
  parent_version: z.number().nullable().default(null),
  status: ideaStatusSchema,
  stage_at_entry: stageAtEntrySchema,
  /** Short human label, agent-generated from the description. */
  title: z.string().default(""),
  /** What changed in this version, shown on the version-history timeline. */
  version_note: z.string().default(""),
  raw_submission: rawSubmissionSchema,
  structured: structuredSchema,
  testing_context: testingContextSchema.default({} as any),
  product_model: productModelSchema.nullable().default(null),
  test_spec: testSpecSchema.nullable().default(null),
  tasks: z.array(taskSchema).default([]),
  market_scans: z.array(researchReportSchema).default([]),
  onboarding_output: z.object({
    draft_test_spec: z.any().nullable().default(null),
    tier_choice: z.enum(["self_serve","fast_track"]).nullable().default(null),
    share_link: z.object({ url: z.string().nullable().default(null), status: z.enum(["inactive","live","paused"]).default("inactive"), activated_at: z.string().nullable().default(null) }).default({ url: null, status: "inactive", activated_at: null } as any),
  }).default({} as any),
  research_report: researchReportSchema.nullable().default(null),
  /**
   * The assumption ledger. Seeded by the hypothesis agent after research,
   * added to by the founder, and re-judged against responses at the gate.
   */
  hypotheses: z.array(hypothesisSchema).default([]),
  validation: validationSchema,
  social_engagement: socialEngagementSchema,
  fast_track_order: fastTrackOrderStateSchema.nullable().default(null),
  decision_gate: decisionGateSchema.nullable().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});
export type IdeaState = z.infer<typeof ideaStateSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────

/** A blank idea-state, used when creating version 1 of a new idea. */
export function emptyIdeaState(params: {
  ideaId: string;
  stageAtEntry: StageAtEntry;
  rawSubmission: RawSubmission;
  title?: string;
}): IdeaState {
  const now = new Date().toISOString();
  return ideaStateSchema.parse({
    idea_id: params.ideaId,
    version: 1,
    parent_version: null,
    status: "draft",
    stage_at_entry: params.stageAtEntry,
    title: params.title ?? "",
    version_note: "Original submission",
    raw_submission: params.rawSubmission,
    structured: {},
    research_report: null,
    validation: {},
    social_engagement: {},
    fast_track_order: null,
    decision_gate: null,
    created_at: now,
    updated_at: now,
  });
}

/** Confirmation rate across every channel combined (PRD §4.4 threshold rule). */
/**
 * The confirmation rate, over responses that are allowed to count.
 *
 * The denominator is exactly the set of responses the founder can see - see
 * founderVisible, which owns the rule. That is deliberate and not merely
 * convenient: a rate computed over answers that are not on the page cannot be
 * checked against anything, which is how a report came to show 11 responses
 * at 64% while listing a set that added up to neither number.
 */
export function computeConfirmationRate(
  responses: readonly ValidationResponse[],
): number {
  const counted = founderVisible(responses);
  if (counted.length === 0) return 0;
  const confirmed = counted.filter((r) => r.confirmed === "yes").length;
  return confirmed / counted.length;
}

/** The PRD's primary threshold: >= 50% confirmed across all channels. */
export const GO_AHEAD_THRESHOLD = 0.5;

/** Soft gate - below this the Decision Gate flags low sample size as a risk. */
export const MIN_RESPONSES = 10;

export const PIPELINE_STAGES = [
  "entry",
  "research",
  "validate",
  "decide",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Which pipeline stage a given status sits in, for the top-bar stepper. */
export function stageForStatus(status: IdeaStatus): PipelineStage {
  switch (status) {
    case "draft":
      return "entry";
    case "researching":
      return "research";
    case "validating_normal":
    case "validating_fast":
      return "validate";
    case "gate_review":
    case "passed":
    case "needs_rework":
    case "killed":
      return "decide";
  }
}

/** Terminal statuses keep their full report permanently (PRD §4.4). */
export function isTerminal(status: IdeaStatus): boolean {
  return status === "passed" || status === "killed";
}
