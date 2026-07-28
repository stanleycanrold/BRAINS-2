import { z } from "zod";

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
    user_confirmed: false,
  }),
});
export type Structured = z.infer<typeof structuredSchema>;

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

export const researchReportSchema = z.object({
  problem_strength: problemStrengthSchema.default("moderate"),
  problem_strength_reasoning: z.string().default(""),
  competitors: z.array(competitorSchema).default([]),
  evidence: z.array(evidenceSchema).default([]),
  proposed_changes: z.array(proposalSchema).default([]),
  /** True when the run had no live search available; surfaced in the UI. */
  unsourced: z.boolean().default(false),
  generated_at: z.string().default(""),
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
  research_report: researchReportSchema.nullable().default(null),
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
export function computeConfirmationRate(
  responses: readonly ValidationResponse[],
): number {
  if (responses.length === 0) return 0;
  const confirmed = responses.filter((r) => r.confirmed === "yes").length;
  return confirmed / responses.length;
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
