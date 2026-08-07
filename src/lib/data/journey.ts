import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { ideaStateSchema, type IdeaState } from "@/lib/domain/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The public journey - a whole idea, every round, read-only, no account.
 *
 * This is the one surface that shows the work across cycles rather than
 * within one, which is why its token lives on `ideas` and not on a version.
 *
 * Everything here is reachable WITHOUT authentication, so the shape returned
 * is built by allow-list rather than by omission: a field is present because
 * something here deliberately put it there. That is the opposite of returning
 * a row and trusting every caller to strip it, which is how these pages leak.
 *
 * Three things are never included, at any setting:
 *
 *  · Who the founder is. No user id, no email, no account link.
 *  · Where a response came from. `source` on a response is often a person, a
 *    handle, or a private thread.
 *  · Which expert ran a paid interview. They contracted with us, not with the
 *    internet.
 *
 * Response text itself is opt-in per idea and off by default. Respondents
 * answered so one founder could research an idea; a public page is a
 * different thing to have agreed to.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type JourneyRound = {
  versionNumber: number;
  note: string;
  status: IdeaState["status"];
  problemStatement: string;
  icp: string;
  /** What changed from the previous round, computed rather than stored. */
  changedFromPrevious: { field: string; from: string; to: string }[];
  research: {
    problemStrength: string;
    reasoning: string;
    /** Claim plus where it came from. Sources here are public URLs already. */
    evidence: { claim: string; sourceUrl: string; sourceTitle: string }[];
    contraryEvidence: { claim: string; sourceUrl: string }[];
    workarounds: { description: string; whyItPersists: string }[];
    unsourced: boolean;
  } | null;
  questions: string[];
  responseCount: number;
  confirmationRate: number;
  themes: string[];
  objections: string[];
  narrative: string;
  /** Present only when the founder opted in. Never carries a source. */
  responses: { confirmed: string; notes: string }[];
  score: {
    value: number;
    signal: string;
    reasoning: string;
    riskFactors: { label: string; detail: string; severity: string }[];
  } | null;
  createdAt: string;
};

export type PublicJourney = {
  title: string;
  summary: string;
  currentStatus: IdeaState["status"];
  includesResponses: boolean;
  rounds: JourneyRound[];
  startedAt: string;
  updatedAt: string;
};

/** Same length and alphabet as the questionnaire tokens. */
function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createShareToken(
  ideaId: string,
  userId: string,
): Promise<string | null> {
  const token = newToken();
  const [row] = await db
    .update(schema.ideas)
    .set({ shareToken: token, updatedAt: new Date() })
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .returning({ shareToken: schema.ideas.shareToken });

  return row?.shareToken ?? null;
}

/**
 * Revoking nulls the token rather than deleting anything. A new share issues
 * a fresh token, so an old link cannot be resurrected by re-enabling sharing.
 */
export async function revokeShareToken(
  ideaId: string,
  userId: string,
): Promise<void> {
  await db
    .update(schema.ideas)
    .set({ shareToken: null, updatedAt: new Date() })
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)));
}

export async function setShareIncludesResponses(
  ideaId: string,
  userId: string,
  include: boolean,
): Promise<void> {
  await db
    .update(schema.ideas)
    .set({ shareIncludesResponses: include, updatedAt: new Date() })
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)));
}

export async function getShareSettings(ideaId: string, userId: string) {
  const [row] = await db
    .select({
      shareToken: schema.ideas.shareToken,
      shareIncludesResponses: schema.ideas.shareIncludesResponses,
    })
    .from(schema.ideas)
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .limit(1);

  return row ?? null;
}

function diffRound(previous: IdeaState | null, current: IdeaState) {
  if (!previous) return [];

  const fields: { key: keyof IdeaState["structured"]; label: string }[] = [
    { key: "problem_statement", label: "Problem" },
    { key: "icp", label: "Who it is for" },
    { key: "value_prop", label: "Value" },
  ];

  return fields
    .map(({ key, label }) => ({
      field: label,
      from: String(previous.structured[key] ?? ""),
      to: String(current.structured[key] ?? ""),
    }))
    .filter((d) => d.from !== d.to && d.to.length > 0);
}

/**
 * Resolves a share token to the whole journey.
 *
 * Guards on token length before touching the database, matching the
 * questionnaire resolver: a one-character token should not become a query.
 */
export async function getPublicJourney(
  token: string,
): Promise<PublicJourney | null> {
  if (!token || token.length < 16) return null;

  const [idea] = await db
    .select()
    .from(schema.ideas)
    .where(eq(schema.ideas.shareToken, token))
    .limit(1);

  if (!idea || idea.archived) return null;

  const versions = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.ideaId, idea.id))
    .orderBy(schema.ideaStateVersions.versionNumber);

  if (versions.length === 0) return null;

  const includeResponses = idea.shareIncludesResponses;
  let previous: IdeaState | null = null;

  const rounds: JourneyRound[] = versions.map((version) => {
    const state = ideaStateSchema.parse(version.stateJson);
    const research = state.research_report;
    const gate = state.decision_gate;
    const changedFromPrevious = diffRound(previous, state);
    previous = state;

    return {
      versionNumber: version.versionNumber,
      note: version.versionNote,
      status: state.status,
      problemStatement: state.structured.problem_statement,
      icp: state.structured.icp,
      changedFromPrevious,
      research: research
        ? {
            problemStrength: research.problem_strength,
            reasoning: research.problem_strength_reasoning,
            evidence: research.evidence.map((e) => ({
              claim: e.claim,
              sourceUrl: e.source_url,
              sourceTitle: e.source_title,
            })),
            contraryEvidence: research.contrary_evidence.map((e) => ({
              claim: e.claim,
              sourceUrl: e.source_url,
            })),
            workarounds: research.current_workarounds.map((w) => ({
              description: w.description,
              whyItPersists: w.why_it_persists,
            })),
            unsourced: research.unsourced,
          }
        : null,
      questions: state.validation.questionnaire.questions.map((q) => q.text),
      responseCount: state.validation.responses.length,
      confirmationRate: state.validation.confirmation_rate,
      themes: state.validation.synthesis_summary.themes,
      objections: state.validation.synthesis_summary.objections,
      narrative: state.validation.synthesis_summary.narrative,
      // Mapped field by field rather than spread, so a field added to a
      // response later cannot appear on a public page by accident.
      responses: includeResponses
        ? state.validation.responses.map((r) => ({
            confirmed: r.confirmed,
            notes: r.notes,
          }))
        : [],
      score: gate?.signal
        ? {
            value: gate.score,
            signal: gate.signal,
            reasoning: gate.reasoning,
            riskFactors: gate.risk_factors.map((r) => ({
              label: r.label,
              detail: r.detail,
              severity: r.severity,
            })),
          }
        : null,
      createdAt: version.createdAt.toISOString(),
    };
  });

  return {
    title: idea.title,
    summary: idea.summary,
    currentStatus: rounds[rounds.length - 1].status,
    includesResponses: includeResponses,
    rounds,
    startedAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}
