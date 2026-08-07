import {
  pgSchema,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { IdeaState } from "@/lib/domain/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAINS AI - data model (PRD §7)
 *
 * Everything lives in a dedicated `brains` Postgres schema rather than
 * `public`. The connected database already hosts an earlier application whose
 * tables (`users`, `ideas`, `fast_track_orders`) and enums (`idea_status`,
 * `order_status`, `interview_status`) would collide by name. Namespacing keeps
 * the two entirely independent - this build can be created, migrated or
 * dropped without ever touching the existing data.
 *
 * Two rules govern this schema:
 *
 *  1. `idea_state_versions` is APPEND-ONLY. A rework never mutates a previous
 *     version; it writes a new row with `parent_version_id` set. Full history
 *     is retained permanently, including for killed ideas (PRD §10, §4.4).
 *
 *  2. `agent_run_logs` is not optional instrumentation. Every agent call
 *     records its prompt version, full input, full output and model, because
 *     that corpus is what trains BRAINS' specialist SLMs later - the
 *     "agents now, SLMs later" strategy (PRD §6, §10 auditability).
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const brains = pgSchema("brains");

// Bound so `this` still resolves to the schema when called as bare functions.
const pgTable: typeof brains.table = brains.table.bind(brains);
const pgEnum: typeof brains.enum = brains.enum.bind(brains);

// ── Enums ──────────────────────────────────────────────────────────────────

export const ideaStatusEnum = pgEnum("idea_status", [
  "draft",
  "researching",
  "validating_normal",
  "validating_fast",
  "gate_review",
  "passed",
  "needs_rework",
  "killed",
]);

export const reviewStatusEnum = brains.enum("review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const trackEnum = pgEnum("track", ["normal", "fast"]);
export const channelEnum = pgEnum("channel", ["interview", "survey", "social"]);
export const confirmedEnum = pgEnum("confirmed", ["yes", "no", "unsure"]);
export const signalEnum = pgEnum("signal", ["go_ahead", "rethink"]);
export const userDecisionEnum = pgEnum("user_decision", [
  "proceed",
  "rework",
  "kill",
]);
export const draftStatusEnum = pgEnum("draft_status", [
  "drafted",
  "edited",
  "posted",
  "reply_logged",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "refunded",
  "failed",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_sourcing",
  "scheduling",
  "in_progress",
  "completed",
  "cancelled",
]);
export const interviewStatusEnum = pgEnum("interview_status", [
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
]);
export const nicheTierEnum = pgEnum("niche_tier", [
  "general_consumer",
  "vertical_b2b",
  "highly_specialized",
]);
export const problemStrengthEnum = pgEnum("problem_strength", [
  "weak",
  "moderate",
  "strong",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "none",
  "active",
  "cancelled",
  "past_due",
]);

// ── users ──────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Clerk user id - the external identity. */
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull(),
    name: text("name"),
    /** Continued Social Scan subscription (PRD §4.3.3). */
    socialScanStatus: subscriptionStatusEnum("social_scan_status")
      .notNull()
      .default("none"),
    socialScanCustomerId: text("social_scan_customer_id"),
    socialScanSubscriptionId: text("social_scan_subscription_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_clerk_id_idx").on(t.clerkId)],
);

// ── ideas ──────────────────────────────────────────────────────────────────

export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Denormalised for cheap list rendering; mirrors the current version. */
    title: text("title").notNull().default("Untitled idea"),
    summary: text("summary").notNull().default(""),
    currentVersionId: uuid("current_version_id"),
    /**
     * Opaque token for the public read-only journey at /s/[token].
     *
     * Deliberately on the idea rather than on a version, unlike the
     * questionnaire and panel tokens. Those two are per-round jobs: one link
     * collects answers for one set of questions. A shared journey is the
     * opposite - it exists to show every round, how the idea changed between
     * them, and what each one concluded. Hanging it off a version would share
     * whichever round happened to be current and strand the rest.
     *
     * Null until the founder creates one, and set back to null when they
     * revoke it, so a link that has been shared too widely can be killed
     * without deleting anything.
     */
    shareToken: text("share_token").unique(),
    /**
     * Whether the shared view includes what respondents actually wrote.
     *
     * Off by default, and that default is the point. Respondents answered a
     * questionnaire so one founder could research an idea; a public URL is a
     * materially different thing to have agreed to. With this off the journey
     * still shows themes, counts, the score and its reasoning, which is the
     * persuasive part anyway. Identifying fields - the response source, the
     * expert behind a paid interview - are never included either way.
     */
    shareIncludesResponses: boolean("share_includes_responses")
      .notNull()
      .default(false),
    /** Archived rather than deleted when killed (PRD §4.5). */
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ideas_user_id_idx").on(t.userId),
    index("ideas_share_token_idx").on(t.shareToken),
  ],
);

// ── idea_state_versions - append-only ──────────────────────────────────────

export const ideaStateVersions = pgTable(
  "idea_state_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    parentVersionId: uuid("parent_version_id"),
    status: ideaStatusEnum("status").notNull().default("draft"),
    /** One-line description of what changed, for the history timeline. */
    versionNote: text("version_note").notNull().default(""),
    /** The full idea-state object from PRD §5. */
    stateJson: jsonb("state_json").$type<IdeaState>().notNull(),
    /**
     * Opaque token for the public questionnaire link. Indexed because the
     * public route looks a version up by this alone - it is the only thing an
     * unauthenticated respondent presents.
     */
    shareToken: text("share_token").unique(),
    /**
     * A SEPARATE token for the interviews we run on a paid round.
     *
     * Two links rather than one so the founder can tell their own outreach
     * apart from what they paid for: the token a response arrives on decides
     * whether it counts as `normal` or `fast`, rather than every response
     * inheriting the idea's current track. Issued only once a round is paid.
     */
    panelToken: text("panel_token").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("isv_idea_id_idx").on(t.ideaId),
    index("isv_idea_version_idx").on(t.ideaId, t.versionNumber),
    index("isv_share_token_idx").on(t.shareToken),
    index("isv_panel_token_idx").on(t.panelToken),
  ],
);

// ── research_reports ───────────────────────────────────────────────────────

export const researchReports = pgTable(
  "research_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaStateVersionId: uuid("idea_state_version_id")
      .notNull()
      .references(() => ideaStateVersions.id, { onDelete: "cascade" }),
    problemStrength: problemStrengthEnum("problem_strength")
      .notNull()
      .default("moderate"),
    competitorsJson: jsonb("competitors_json").notNull().default([]),
    proposedChangesJson: jsonb("proposed_changes_json").notNull().default([]),
    evidenceJson: jsonb("evidence_json").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("rr_version_idx").on(t.ideaStateVersionId)],
);

// ── validation_responses - the unified pool ────────────────────────────────

/**
 * Every response lands here regardless of origin: a self-run interview, a Fast
 * Track expert interview, a survey submission, or a logged social-media reply.
 * The Decision Gate always synthesises across every channel together, never
 * per-channel (PRD §4.3, §7).
 */
export const validationResponses = pgTable(
  "validation_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaStateVersionId: uuid("idea_state_version_id")
      .notNull()
      .references(() => ideaStateVersions.id, { onDelete: "cascade" }),
    track: trackEnum("track").notNull().default("normal"),
    channel: channelEnum("channel").notNull(),
    confirmed: confirmedEnum("confirmed").notNull(),
    notes: text("notes").notNull().default(""),
    source: text("source").notNull().default(""),
    expertId: uuid("expert_id").references(() => experts.id, {
      onDelete: "set null",
    }),
    /** Expert interviews carry a confidence weight (PRD §4.3.2 step 7). */
    confidence: real("confidence"),
    /**
     * Quality screening (see the response_quality agent).
     *
     * `pending` responses do not count toward the score. Nothing is deleted:
     * a rejected response stays readable so a human can disagree with the
     * machine, and so we can see later what the screen was getting wrong.
     */
    reviewStatus: reviewStatusEnum("review_status").notNull().default("pending"),
    qualityFlags: jsonb("quality_flags").$type<string[]>().notNull().default([]),
    qualityReasoning: text("quality_reasoning").notNull().default(""),
    qualityConfidence: real("quality_confidence"),
    /** Set when a human accepts or overturns the machine's verdict. */
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("vr_version_idx").on(t.ideaStateVersionId)],
);

// ── social_engagement_posts ────────────────────────────────────────────────

export const socialEngagementPosts = pgTable(
  "social_engagement_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaStateVersionId: uuid("idea_state_version_id")
      .notNull()
      .references(() => ideaStateVersions.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("post"), // "post" | "comment"
    communityName: text("community_name").notNull().default(""),
    communityUrl: text("community_url").notNull().default(""),
    threadUrl: text("thread_url").notNull().default(""),
    title: text("title").notNull().default(""),
    draftedText: text("drafted_text").notNull(),
    editedText: text("edited_text"),
    rationale: text("rationale").notNull().default(""),
    status: draftStatusEnum("status").notNull().default("drafted"),
    /** Set once a reply to this draft is logged into the response pool. */
    validationResponseId: uuid("validation_response_id").references(
      () => validationResponses.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sep_version_idx").on(t.ideaStateVersionId)],
);

// ── experts ────────────────────────────────────────────────────────────────

export const experts = pgTable("experts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  headline: text("headline").notNull().default(""),
  nicheTags: text("niche_tags").array().notNull().default([]),
  contactInfo: text("contact_info").notNull().default(""),
  ratePerInterview: numeric("rate_per_interview", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("0"),
  availabilityNotes: text("availability_notes").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── fast_track_orders ──────────────────────────────────────────────────────

export const fastTrackOrders = pgTable(
  "fast_track_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaStateVersionId: uuid("idea_state_version_id")
      .notNull()
      .references(() => ideaStateVersions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nRequested: integer("n_requested").notNull(),
    /** Money is stored in minor units (cents) - never floats. */
    costPerInterviewCents: integer("cost_per_interview_cents").notNull(),
    analysisFeeCents: integer("analysis_fee_cents").notNull(),
    totalCostCents: integer("total_cost_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    nicheTier: nicheTierEnum("niche_tier").notNull().default("general_consumer"),
    /**
     * Where the founder wants interviewees drawn from, in their own words.
     * Free text rather than a country list: "US healthcare admins" and
     * "anywhere, English-speaking" are both useful answers and neither fits
     * a dropdown. Blank means no preference.
     */
    locationPreference: text("location_preference").notNull().default(""),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    paymentRef: text("payment_ref"),
    /** True when completed via the simulated-payment path (no Stripe key). */
    simulatedPayment: boolean("simulated_payment").notNull().default(false),
    status: orderStatusEnum("status").notNull().default("pending_sourcing"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("fto_version_idx").on(t.ideaStateVersionId),
    index("fto_user_idx").on(t.userId),
    index("fto_status_idx").on(t.status),
  ],
);

// ── fast_track_interviews ──────────────────────────────────────────────────

export const fastTrackInterviews = pgTable(
  "fast_track_interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fastTrackOrderId: uuid("fast_track_order_id")
      .notNull()
      .references(() => fastTrackOrders.id, { onDelete: "cascade" }),
    expertId: uuid("expert_id").references(() => experts.id, {
      onDelete: "set null",
    }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    status: interviewStatusEnum("status").notNull().default("scheduled"),
    notes: text("notes").notNull().default(""),
    validationResponseId: uuid("validation_response_id").references(
      () => validationResponses.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("fti_order_idx").on(t.fastTrackOrderId)],
);

// ── pricing_config ─────────────────────────────────────────────────────────

/**
 * Ops-configurable, never hardcoded - rates change without a deploy (PRD
 * §4.3.2.1). Read by the Estimation Agent at request time.
 */
export const pricingConfig = pgTable("pricing_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  nicheTier: nicheTierEnum("niche_tier").notNull(),
  costPerInterviewCents: integer("cost_per_interview_cents").notNull(),
  analysisFeeBaseCents: integer("analysis_fee_base_cents").notNull(),
  /** Analysis is partly fixed-cost, so it scales mildly rather than 1:1 with N. */
  analysisFeePerUnitCents: integer("analysis_fee_per_unit_cents").notNull(),
  minInterviews: integer("min_interviews").notNull().default(3),
  maxInterviews: integer("max_interviews").notNull().default(25),
  currency: text("currency").notNull().default("usd"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── decision_gates ─────────────────────────────────────────────────────────

export const decisionGates = pgTable(
  "decision_gates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaStateVersionId: uuid("idea_state_version_id")
      .notNull()
      .references(() => ideaStateVersions.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    signal: signalEnum("signal").notNull(),
    reasoning: text("reasoning").notNull().default(""),
    riskFactorsJson: jsonb("risk_factors_json").notNull().default([]),
    improvementProposalJson: jsonb("improvement_proposal_json")
      .notNull()
      .default([]),
    diagnosticJson: jsonb("diagnostic_json").notNull().default({}),
    userDecision: userDecisionEnum("user_decision"),
    killReason: text("kill_reason"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("dg_version_idx").on(t.ideaStateVersionId)],
);

// ── agent_run_logs ─────────────────────────────────────────────────────────

/**
 * Core architecture, not nice-to-have logging (PRD §6, §10). Every agent
 * decision must be traceable to its inputs, and this table is the future SLM
 * training corpus.
 */
export const agentRunLogs = pgTable(
  "agent_run_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaStateVersionId: uuid("idea_state_version_id").references(
      () => ideaStateVersions.id,
      { onDelete: "cascade" },
    ),
    agentName: text("agent_name").notNull(),
    promptVersion: text("prompt_version").notNull(),
    inputJson: jsonb("input_json").notNull(),
    outputJson: jsonb("output_json"),
    modelUsed: text("model_used").notNull(),
    provider: text("provider").notNull(),
    latencyMs: integer("latency_ms").notNull().default(0),
    /** Populated when the run failed, so failures are auditable too. */
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("arl_version_idx").on(t.ideaStateVersionId),
    index("arl_agent_idx").on(t.agentName),
    index("arl_created_idx").on(t.createdAt),
  ],
);

// ── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  ideas: many(ideas),
}));

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  user: one(users, { fields: [ideas.userId], references: [users.id] }),
  versions: many(ideaStateVersions),
}));

export const ideaStateVersionsRelations = relations(
  ideaStateVersions,
  ({ one, many }) => ({
    idea: one(ideas, {
      fields: [ideaStateVersions.ideaId],
      references: [ideas.id],
    }),
    responses: many(validationResponses),
    posts: many(socialEngagementPosts),
    gates: many(decisionGates),
  }),
);

export const validationResponsesRelations = relations(
  validationResponses,
  ({ one }) => ({
    version: one(ideaStateVersions, {
      fields: [validationResponses.ideaStateVersionId],
      references: [ideaStateVersions.id],
    }),
    expert: one(experts, {
      fields: [validationResponses.expertId],
      references: [experts.id],
    }),
  }),
);

export const fastTrackOrdersRelations = relations(
  fastTrackOrders,
  ({ one, many }) => ({
    version: one(ideaStateVersions, {
      fields: [fastTrackOrders.ideaStateVersionId],
      references: [ideaStateVersions.id],
    }),
    interviews: many(fastTrackInterviews),
  }),
);

export const fastTrackInterviewsRelations = relations(
  fastTrackInterviews,
  ({ one }) => ({
    order: one(fastTrackOrders, {
      fields: [fastTrackInterviews.fastTrackOrderId],
      references: [fastTrackOrders.id],
    }),
    expert: one(experts, {
      fields: [fastTrackInterviews.expertId],
      references: [experts.id],
    }),
  }),
);
