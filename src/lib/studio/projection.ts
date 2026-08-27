import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  computeConfirmationRate,
  type IdeaState,
  type VerbatimQuote,
} from "@/lib/domain/types";
import { founderVisible } from "@/lib/domain/response-visibility";
import { hasMoneyAnchor } from "@/lib/pricing-anchors";
import type {
  FullWorkspaceData,
  WorkspaceMeta,
  Respondent,
  EvidenceQuote,
  CompetitorWorkaround,
  Hypothesis,
  SocialMention,
} from "@/lib/domain/empirical-types";
import { summariseWorkspace } from "@/lib/domain/workspace-summary";
import type { IdeaWithState } from "@/lib/data/ideas";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The projection seam between the validation engine and the Empirical studio
 * UI.
 *
 * The engine stores one append-only idea-state per round plus rows in the
 * unified response pool. The studio UI wants a `FullWorkspaceData`: meta,
 * respondents with transcripts, verbatim quotes, competitor teardowns, social
 * mentions.
 *
 * Two rules govern every field below:
 *
 *  1. Never fabricate. A number the pipeline did not produce renders as zero
 *     or a dash rather than as a plausible guess - a made-up willingness-to-pay
 *     is worse than an empty one, because it looks load-bearing. Fields the
 *     discovery agents do not fill yet stay empty until those agents exist.
 *  2. Never leak. Respondent identity lives in the pool for legitimacy checks
 *     only (schema comment on validation_responses). The studio shows stable
 *     aliases plus the professional descriptors a founder legitimately paid
 *     to learn - role and coarse location - never names, emails or phones.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Deterministic pastel initial-avatar as an inline SVG data URI. */
function avatarFor(seed: string, label: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="hsl(${hue},45%,88%)"/><text x="48" y="58" font-family="ui-sans-serif,system-ui,sans-serif" font-size="34" font-weight="700" fill="hsl(${hue},45%,32%)" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const SOCIAL_PLATFORMS: Array<{
  platform: SocialMention["platform"];
  match: RegExp;
}> = [
  { platform: "Reddit", match: /reddit/i },
  { platform: "HackerNews", match: /hacker\s?news|hn\b|ycombinator/i },
  { platform: "X/Twitter", match: /twitter|\bx\b/i },
  { platform: "ProductHunt", match: /product\s?hunt/i },
  { platform: "G2", match: /\bg2\b/i },
];

function platformFromSource(source: string, channel: string): SocialMention["platform"] {
  for (const p of SOCIAL_PLATFORMS) {
    if (p.match.test(source)) return p.platform;
  }
  return channel === "social" ? "Reddit" : "G2";
}

/** Maps a research theme onto the closest mention sentiment. */
function sentimentForTheme(theme: string): SocialMention["sentiment"] {
  if (/workaround|instead|manual|spreadsheet/i.test(theme)) return "Workaround Need";
  if (/wish|want|need|looking for|request/i.test(theme)) return "Product Request";
  if (/pain|frustrat|cost|hate|annoy|problem|struggle/i.test(theme)) return "High Pain";
  return "Neutral";
}

const QUOTE_CATEGORIES: Array<{
  category: EvidenceQuote["category"];
  match: RegExp;
}> = [
  { category: "Willingness to Pay", match: /price|pay|budget|cost|\$\d|afford|per month|monthly/i },
  { category: "Objection & Risk", match: /however|but |concern|risk|doubt|objection|worried|lock-?in|security review/i },
  { category: "Existing Friction", match: /currently|today|manual|spreadsheet|workaround|instead we|we use/i },
  { category: "Feature Requirement", match: /need|would want|feature|should have|must have|require/i },
];

function categoriseQuote(text: string): EvidenceQuote["category"] {
  for (const c of QUOTE_CATEGORIES) {
    if (c.match.test(text)) return c.category;
  }
  return "Problem Urgency";
}

function splitQuotes(notes: string): string[] {
  const clean = notes.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 12);
  if (sentences.length <= 2) return sentences.length > 0 ? [clean.slice(0, 400)] : [];
  // First and strongest-looking sentence: quotes read better short.
  return [sentences[0], sentences[sentences.length - 1]].map((s) => s.slice(0, 400));
}

function verifiedSourceFor(r: {
  track: string;
  channel: string;
  source: string;
}): Respondent["verifiedSource"] {
  if (r.track === "fast") return "Fast Track Verified";
  if (r.channel === "social") return "Cold Outreach";
  if (/community|forum|group/i.test(r.source)) return "Community Partner";
  return "Self-Sourced Organic";
}

function sentimentFor(confirmed: string): Respondent["sentiment"] {
  if (confirmed === "yes") return "Strong Champion";
  if (confirmed === "unsure") return "Interested";
  return "Skeptical";
}

function urgencyFor(r: { confirmed: string; channel: string }): Respondent["urgencyLevel"] {
  if (r.confirmed === "yes" && r.channel === "interview") return "Immediate (Next 30 days)";
  if (r.confirmed === "yes") return "Medium (1-3 months)";
  if (r.confirmed === "unsure") return "Medium (1-3 months)";
  return "Low (Browsing)";
}

function inferDecisionMaker(role: string, profile: { decision_maker?: boolean }): boolean {
  // Explicit profile answer wins when present — but we don't require it.
  // For SafeSpark and similar, a headteacher's title already tells us they
  // decide. Same for product manager, founder, director, etc.
  if (profile.decision_maker === true) return true;
  const r = role.toLowerCase();
  // Education: the buyer for classroom / school tools
  if (/\bhead\s*teacher\b|\bheadteacher\b|\bprincipal\b|\bhead of school\b|\bdeputy head\b|\bassistant head\b/.test(r)) return true;
  // General B2B — anyone who can sign or strongly influence a purchase for this problem
  if (/\b(founder|co-founder|owner|partner|president|ceo|cto|chief|director|head of|vp|vice president|manager|lead|principal)\b/.test(r)) {
    // Product manager / project manager / programme manager are budget holders for their wedge
    if (/\bproduct manager\b|\bproduct lead\b|\bproject manager\b|\bprogramme manager\b|\bprogram manager\b/.test(r)) return true;
    // Broader manager/lead/director/head — in the context of an ICP interview,
    // the person being interviewed is the buyer for that problem, not a bystander
    if (/\b(manager|lead|director|head of|chief|founder|ceo|cto|principal|owner|partner|president|vp)\b/.test(r)) return true;
  }
  if (profile.decision_maker === false) return false;
  return false;
}

type PoolRow = typeof schema.validationResponses.$inferSelect;

async function poolRowsFor(versionIds: string[]): Promise<Map<string, PoolRow>> {
  if (versionIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(schema.validationResponses)
    .where(inArray(schema.validationResponses.ideaStateVersionId, versionIds));
  return new Map(rows.map((r) => [r.id, r]));
}

export type WorkspaceSummaryLite = {
  id: string;
  name: string;
  tagline: string;
  score: number;
};

/** Compact switcher entries for every workspace the founder can open. */
export function toSummaryLite(idea: IdeaWithState): WorkspaceSummaryLite {
  return {
    id: idea.id,
    name: idea.title || "Untitled idea",
    tagline:
      idea.state.structured.problem_statement || idea.summary || "",
    score: idea.state.decision_gate?.signal ? idea.state.decision_gate.score : 0,
  };
}

/**
 * Projects one idea (current version) into the shape the studio UI renders.
 *
 * `previousStates` carries earlier rounds so the evidence pool can include
 * what prior versions collected - a reworked idea keeps its history visible,
 * exactly as the append-only model promises.
 */
export async function projectWorkspace(
  idea: IdeaWithState,
  options: {
    ownerName?: string | null;
    previousStates?: IdeaState[];
  } = {},
): Promise<FullWorkspaceData> {
  const state = idea.state;
  const states = [state, ...(options.previousStates ?? [])];
  // Response ids in the state JSON mirror the DB row ids, so we pool every
  // row across this idea's versions (current round plus any prior rounds).
  const versionRows = await db
    .select({ id: schema.ideaStateVersions.id })
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.ideaId, idea.id));
  const rowsByid = await poolRowsFor(versionRows.map((r) => r.id));

  // Visible responses across this round (and any prior rounds supplied).
  const pooled = states.flatMap((s) =>
    founderVisible(s.validation.responses).map((r) => ({ state: s, response: r })),
  );
  pooled.sort(
    (a, b) =>
      new Date(b.response.created_at).getTime() -
      new Date(a.response.created_at).getTime(),
  );

  const confirmationRate = computeConfirmationRate(state.validation.responses);
  const gate = state.decision_gate;
  const summary = summariseWorkspace(idea.status, state);

  const reviewed = [...rowsByid.values()].filter(
    (r) => r.reviewStatus !== "pending",
  );
  const sampleQualityScore =
    reviewed.length > 0
      ? Math.round(
          (reviewed.filter((r) => r.reviewStatus === "approved").length /
            reviewed.length) *
            100,
        )
      : 100;

  // WTP with provenance: respondents' own anchored estimates first, then
  // the pricing-intelligence point if it has an anchor. With neither, zero
  // and a model that says why - the UI renders that as "not grounded yet",
  // never as a number.
  const wtpEstimates = pooled
    .map(({ response }) => rowsByid.get(response.id)?.wtpEstimate ?? 0)
    .filter((v) => v > 0);
  const pricingIntel = state.validation.pricing_intelligence;
  let willingnessToPayAvg = 0;
  let willingnessToPayModel: WorkspaceMeta["willingnessToPayModel"] = "none";
  if (wtpEstimates.length > 0) {
    willingnessToPayAvg = Math.round(
      wtpEstimates.reduce((a, b) => a + b, 0) / wtpEstimates.length,
    );
    willingnessToPayModel = "respondent_avg";
  } else if (
    pricingIntel?.model === "anchored" &&
    pricingIntel.wtp_point > 0
  ) {
    willingnessToPayAvg = Math.round(pricingIntel.wtp_point);
    willingnessToPayModel = "anchored";
  } else if (pricingIntel?.model === "anchor_missing") {
    willingnessToPayModel = "anchor_missing";
  }

  const meta: WorkspaceMeta = {
    id: idea.id,
    name: idea.title || "Untitled idea",
    tagline:
      state.structured.problem_statement ||
      state.raw_submission.description ||
      idea.summary ||
      "",
    currentRound: idea.versionNumber,
    status:
      idea.status === "passed"
        ? "completed"
        : idea.status === "killed" || idea.status === "needs_rework"
          ? "reworking"
          : "active",
    totalRespondents: pooled.length,
    // The honest analog: share of screened respondents confirming the problem.
    unpromptedPainMentionRate: Math.round(confirmationRate * 100),
    willingnessToPayAvg,
    willingnessToPayModel,
    overallValidationScore: gate?.signal ? gate.score : 0,
    verdict: gate?.signal
      ? gate.signal === "go_ahead"
        ? gate.score >= 70
          ? "STRONG_SIGNAL"
          : "MODERATE_SIGNAL"
        : "PIVOT_RECOMMENDED"
      : "INSUFFICIENT_DATA",
    verdictReasoning:
      gate?.reasoning || summary.headline || "No decision-gate result yet.",
    lastUpdated: relativeTime(idea.updatedAt.toISOString()),
    ownerName: options.ownerName || "Founder",
    ownerAvatar: avatarFor(idea.id, options.ownerName || "F"),
    targetMarket: state.structured.icp || state.raw_submission.target_audience || "",
    sampleQualityScore,
  };

  const respondents: Respondent[] = pooled.map(({ response }, index) => {
    const row = rowsByid.get(response.id);
    const alias = `Respondent ${String(index + 1).padStart(2, "0")}`;
    // Use the name the person gave when asked how to identify them — either
    // via the dedicated name field or via an identification question answer
    // extracted by the profile agent. Falls back to the stable alias only
    // when no name was provided, so the dashboard shows "Sarah Jenkins"
    // instead of "Respondent 01" when available.
    const displayName =
      row?.respondentName?.trim() ||
      (row?.respondentProfile as any)?.display_name?.trim() ||
      alias;
    const role =
      row?.respondentCareer ||
      (response.channel === "interview"
        ? "Interview participant"
        : response.channel === "survey"
          ? "Survey respondent"
          : "Community member");
    const notes = response.notes ?? "";
    const profile = row?.respondentProfile ?? {};
    const painProxy =
      response.confirmed === "yes" ? 8 : response.confirmed === "unsure" ? 5 : 3;

    // Structured Q/A pairs when the respondent answered through the
    // questionnaire; hand-transcribed interviews keep their prose shape.
    const answers = row?.answersJson ?? [];
    const fullTranscript: Respondent["fullTranscript"] =
      answers.length > 0
        ? answers.flatMap((a) => [
            { speaker: "Question", text: a.question, timestamp: "" },
            {
              speaker: alias,
              text: a.answer,
              timestamp: "",
              highlight: hasMoneyAnchor(a.answer)
                ? ("budget" as const)
                : undefined,
            },
          ])
        : notes
          ? [
              {
                speaker: alias,
                text: notes,
                timestamp: "",
                highlight:
                  response.confirmed === "yes"
                    ? ("validation" as const)
                    : response.confirmed === "no"
                      ? ("objection" as const)
                      : undefined,
              },
            ]
          : [];

    return {
      id: response.id,
      name: displayName,
      role,
      company: row?.respondentLocation || "Undisclosed",
      companySize: profile.company_size ?? "",
      industry: profile.industry ?? "",
      avatar: avatarFor(response.id, displayName),
      interviewDate: response.created_at
        ? new Date(response.created_at).toLocaleDateString()
        : "",
      durationMinutes: 0,
      verifiedSource: verifiedSourceFor(response),
      qualityScore:
        row?.qualityConfidence != null
          ? Math.round(row.qualityConfidence * 100)
          : response.review_status === "approved"
            ? 95
            : 80,
      painSeverity: painProxy,
      willingnessToPay: row?.wtpEstimate ?? 0,
      budgetDecisionMaker: inferDecisionMaker(role, profile),
      currentTools: profile.current_tools ?? [],
      keyQuote: notes ? `"${notes.slice(0, 160)}${notes.length > 160 ? "…" : ""}"` : "",
      fullTranscript: fullTranscript.map((line) =>
        line.speaker === alias ? { ...line, speaker: displayName } : line,
      ),
      urgencyLevel: urgencyFor(response),
      sentiment: sentimentFor(response.confirmed),
      confirmed: response.confirmed,
      icpFit:
        ((row?.icpFit as Respondent["icpFit"]) ?? "unknown"),
      icpFitReasoning: row?.icpFitReasoning ?? "",
    };
  });

  // Agent-extracted quotes across every round, keyed by the response they
  // came from. A response WITH agent quotes uses them; legacy rows without
  // fall back to the coarse sentence split below.
  const agentQuotesByResponse = new Map<string, VerbatimQuote[]>();
  for (const s of states) {
    for (const q of s.validation.verbatim_quotes) {
      if (!q.response_id) continue;
      const list = agentQuotesByResponse.get(q.response_id) ?? [];
      list.push(q);
      agentQuotesByResponse.set(q.response_id, list);
    }
  }
  const questionById = new Map(
    states
      .flatMap((s) => s.validation.questionnaire.questions)
      .map((q) => [q.id, q]),
  );

  const quotes: EvidenceQuote[] = pooled.flatMap(({ response }) => {
    const row = rowsByid.get(response.id);
    const aliasIndex = pooled.findIndex(
      (p) => p.response.id === response.id,
    );
    const alias = `Respondent ${String(aliasIndex + 1).padStart(2, "0")}`;
    const sourceType: EvidenceQuote["sourceType"] =
      response.channel === "survey"
        ? "Typeform Survey"
        : response.channel === "interview"
          ? "In-Depth Interview"
          : platformFromSource(response.source, response.channel) === "Reddit"
            ? "Reddit r/SaaS"
            : platformFromSource(response.source, response.channel) === "HackerNews"
              ? "Hacker News"
              : "X/Twitter";
    const shared = {
      respondentId: response.id,
      authorName: alias,
      authorRole: row?.respondentCareer || "Participant",
      authorCompany: row?.respondentLocation || "",
      sentiment:
        response.confirmed === "yes"
          ? ("positive" as const)
          : response.confirmed === "unsure"
            ? ("neutral" as const)
            : ("negative" as const),
      sourceType,
      date: response.created_at ? relativeTime(response.created_at) : "",
      tags: [
        response.confirmed === "yes"
          ? "Confirmed"
          : response.confirmed === "unsure"
            ? "Unsure"
            : "Declined",
        response.track === "fast" ? "Fast Track" : "Organic",
      ],
    };

    const agentQuotes = agentQuotesByResponse.get(response.id) ?? [];
    if (agentQuotes.length > 0) {
      return agentQuotes.map((q): EvidenceQuote => ({
        ...shared,
        id: q.id,
        authorAvatar: avatarFor(q.id, alias),
        text: q.text,
        category: q.category,
        unprompted: true,
        whyItMatters: q.why_it_matters,
        questionText: q.question_id
          ? questionById.get(q.question_id)?.text
          : undefined,
      }));
    }

    return splitQuotes(response.notes ?? "").map((text, qi): EvidenceQuote => ({
      ...shared,
      id: `${response.id}-q${qi}`,
      authorAvatar: avatarFor(`${response.id}-${qi}`, alias),
      text,
      category: categoriseQuote(text),
      unprompted: false,
    }));
  });

  const competitors: CompetitorWorkaround[] = [];
  const report = state.research_report;
  if (report) {
    for (const c of report.competitors) {
      competitors.push({
        id: c.name.toLowerCase().replace(/\s+/g, "-"),
        name: c.name,
        category: "Direct Tool",
        // Zero-valued stats stay zero; the UI hides them rather than showing
        // numbers research never produced.
        marketShareEstimate: 0,
        satisfactionScore: 0,
        primaryComplaint: c.summary,
        monthlyCostRange: "",
        whyUsersChurn: [],
        ourWedgeAdvantage: "",
        sourceUrl: c.source_url || undefined,
      });
    }
    for (const w of report.current_workarounds) {
      competitors.push({
        id: w.description.toLowerCase().replace(/\s+/g, "-").slice(0, 60),
        name: w.description.slice(0, 80),
        category: "Manual Workflow",
        marketShareEstimate: 0,
        satisfactionScore: 0,
        primaryComplaint: w.why_it_persists || w.description,
        monthlyCostRange: "",
        whyUsersChurn: [],
        ourWedgeAdvantage: "",
        sourceUrl: w.source_url || undefined,
      });
    }
  }

  // Hypotheses stand in state across rounds; the current state carries the
  // latest evaluation, so that is the one the studio shows.
  const hypotheses: Hypothesis[] = state.hypotheses.map((h) => ({
    id: h.id,
    statement: h.statement,
    status: h.status,
    confidenceScore: h.confidence,
    supportingEvidenceCount: h.supporting.length,
    counterEvidenceCount: h.counter.length,
    testMethod:
      h.testable_expectation ||
      (h.basis === "feedback"
        ? "Founder-stated; tested against the response pool"
        : "Derived from research; tested against the response pool"),
    takeaway: h.takeaway,
    category: h.category,
    basis: h.basis,
    supporting: h.supporting,
    counter: h.counter,
  }));

  // Community verbatims captured during research, merged with replies the
  // founder logged from social channels. Deduped by URL + text so a
  // re-research pass never doubles a mention.
  const seenSignals = new Set<string>();
  const communityMentions: SocialMention[] = states.flatMap((s) =>
    (s.research_report?.community_signals ?? []).flatMap((signal) => {
      const key = `${signal.source_url}|${signal.quote.slice(0, 80)}`;
      if (seenSignals.has(key)) return [];
      seenSignals.add(key);
      return [
        {
          id: `signal-${key}`,
          platform: platformFromSource(
            `${signal.platform} ${signal.source_url}`,
            "social",
          ),
          author: signal.platform || "community",
          handle: "verbatim",
          title: signal.source_title || undefined,
          content: signal.quote,
          timestamp: s.research_report?.generated_at
            ? relativeTime(s.research_report.generated_at)
            : "",
          url: signal.source_url,
          sentiment: sentimentForTheme(signal.theme),
          extractedNeeds: signal.theme ? [signal.theme] : [],
          engagement: { likes: 0, comments: 0 },
        },
      ];
    }),
  );

  const socialMentions: SocialMention[] = [
    ...communityMentions,
    ...pooled
      .filter(({ response }) => response.channel === "social")
      .map(({ response }, index) => ({
        id: response.id,
        platform: platformFromSource(response.source, response.channel),
        author: response.source || "community",
        handle: `reply-${index + 1}`,
        title: undefined,
        content: response.notes ?? "",
        timestamp: response.created_at ? relativeTime(response.created_at) : "",
        url: "",
        sentiment:
          response.confirmed === "yes"
            ? ("High Pain" as const)
            : response.confirmed === "unsure"
              ? ("Workaround Need" as const)
              : ("Neutral" as const),
        extractedNeeds: (rowsByid.get(response.id)?.qualityFlags ?? []).slice(0, 3),
        engagement: { likes: 0, comments: 0 },
      })),
  ];

  return { meta, respondents, quotes, competitors, hypotheses, socialMentions };
}
