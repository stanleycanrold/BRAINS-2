import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  ideaStateSchema,
  type IdeaState,
  type ResearchReport,
} from "@/lib/domain/types";
import { countSources, countSourcesAcross } from "@/lib/domain/research-sources";

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
 *
 * THE RULE, because this drifted three times before it was written down:
 * everything the founder sees in their own report belongs here too, minus the
 * three exclusions above and minus anything interactive. Adding a field to the
 * research report, the synthesis or the decision gate means adding it here in
 * the same change. A shared report that quietly omits the competitors or the
 * engine's suggestions is not a smaller report - it is a weaker case, and it
 * is the surface a client judges the product on.
 *
 * Deliberately excluded, and the only things excluded: the founder's identity,
 * a response's `source`, the expert behind a paid interview, and every control
 * that would mutate something.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type JourneyRound = {
  versionNumber: number;
  note: string;
  status: IdeaState["status"];
  /** The founder's own words. Theirs to share, so included in full. */
  description: string;
  targetAudience: string;
  locationFocus: string;
  problemStatement: string;
  icp: string;
  /**
   * Where the research said these people gather. Public communities with
   * public URLs, so nothing here identifies an individual.
   */
  communities: {
    name: string;
    platform: string;
    url: string;
    whyRelevant: string;
  }[];
  /** What changed from the previous round, computed rather than stored. */
  changedFromPrevious: { field: string; from: string; to: string }[];
  research: {
    problemStrength: string;
    reasoning: string;
    /** Claim plus where it came from. Sources here are public URLs already. */
    evidence: { claim: string; sourceUrl: string; sourceTitle: string }[];
    contraryEvidence: { claim: string; sourceUrl: string }[];
    workarounds: { description: string; whyItPersists: string }[];
    /** Who already solves this, and the gap they leave. */
    competitors: { name: string; summary: string; sourceUrl: string }[];
    /** Distinct URLs cited anywhere in this round's report. */
    sourceCount: number;
    /** What desk research could not settle. These became the questions. */
    openQuestions: string[];
    /**
     * What the engine proposed sharpening after reading the market, and what
     * the founder did with each. Showing this is the difference between a
     * report that summarises and one that visibly did work.
     */
    proposedChanges: { text: string; reasoning: string; status: string }[];
    unsourced: boolean;
  } | null;
  questions: string[];
  responseCount: number;
  /**
   * Split by how each response was gathered. A client evaluating the engine
   * wants to know which answers we sourced and ran versus which the founder
   * collected themselves - it is the clearest statement of what the paid
   * service actually does.
   */
  responsesByTrack: { managed: number; selfServe: number };
  responsesByChannel: Record<string, number>;
  confirmationRate: number;
  themes: string[];
  objections: string[];
  /** Things worth the founder's attention that are neither theme nor objection. */
  notablePoints: string[];
  narrative: string;
  /** Present only when the founder opted in. Never carries a source. */
  responses: { confirmed: string; notes: string }[];
  score: {
    value: number;
    signal: string;
    reasoning: string;
    riskFactors: { label: string; detail: string; severity: string }[];
    /** What the engine recommended doing next, and the founder's call on it. */
    improvements: { text: string; reasoning: string; status: string }[];
    /**
     * Which part failed, on a round that missed the threshold. Absent on a
     * go-ahead, where the agent records it as not_applicable.
     */
    diagnostic: { verdict: string; explanation: string } | null;
  } | null;
  createdAt: string;
};

/**
 * The bottom line, computed once so the page can lead with it.
 *
 * A shared journey is read by somebody deciding whether to care - a
 * co-founder, an advisor, a client - and the conventional research-report
 * advice applies exactly: put the conclusion first and let the evidence
 * support it, rather than making the reader assemble a verdict from a
 * chronology. Everything here is derived from the rounds, never stored, so it
 * cannot drift from what the rounds actually say.
 */
export type JourneyHeadline = {
  score: number | null;
  signal: string | null;
  verdict: string;
  confirmationRate: number;
  /** Across every round, which is the honest denominator for "we asked N people". */
  totalResponses: number;
  totalSources: number;
  roundCount: number;
  /** The strongest findings from the most recent round that has any. */
  keyFindings: string[];
  openConcerns: string[];
};

export type PublicJourney = {
  title: string;
  summary: string;
  currentStatus: IdeaState["status"];
  includesResponses: boolean;
  headline: JourneyHeadline;
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
  /** Kept alongside the shaped rounds so the headline can count sources from
      the same reports the founder's own screens count from. */
  const reports: (ResearchReport | null)[] = [];

  const rounds: JourneyRound[] = versions.map((version) => {
    const state = ideaStateSchema.parse(version.stateJson);
    const research = state.research_report;
    reports.push(research);
    const gate = state.decision_gate;
    const changedFromPrevious = diffRound(previous, state);
    previous = state;

    return {
      versionNumber: version.versionNumber,
      note: version.versionNote,
      status: state.status,
      description: state.raw_submission.description,
      targetAudience: state.raw_submission.target_audience,
      locationFocus: state.raw_submission.location_focus,
      problemStatement: state.structured.problem_statement,
      icp: state.structured.icp,
      communities: state.validation.communities.map((c) => ({
        name: c.name,
        platform: c.platform,
        url: c.url,
        whyRelevant: c.why_relevant,
      })),
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
            competitors: research.competitors.map((c) => ({
              name: c.name,
              summary: c.summary,
              sourceUrl: c.source_url,
            })),
            // Same definition the summary and the dashboard use, so the
            // Research tab cannot contradict the number above it.
            sourceCount: countSources(research),
            openQuestions: research.open_questions,
            proposedChanges: research.proposed_changes.map((p) => ({
              text: p.edited_text || p.text,
              reasoning: p.reasoning,
              status: p.status,
            })),
            unsourced: research.unsourced,
          }
        : null,
      questions: state.validation.questionnaire.questions.map((q) => q.text),
      responseCount: state.validation.responses.length,
      responsesByTrack: {
        managed: state.validation.responses.filter((r) => r.track === "fast")
          .length,
        selfServe: state.validation.responses.filter((r) => r.track !== "fast")
          .length,
      },
      responsesByChannel: state.validation.responses.reduce<
        Record<string, number>
      >((acc, r) => {
        acc[r.channel] = (acc[r.channel] ?? 0) + 1;
        return acc;
      }, {}),
      confirmationRate: state.validation.confirmation_rate,
      themes: state.validation.synthesis_summary.themes,
      objections: state.validation.synthesis_summary.objections,
      notablePoints: state.validation.synthesis_summary.notable_points,
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
            improvements: gate.improvement_proposal.map((p) => ({
              text: p.edited_text || p.text,
              reasoning: p.reasoning,
              status: p.status,
            })),
            diagnostic:
              gate.diagnostic && gate.diagnostic.verdict !== "not_applicable"
                ? {
                    verdict: gate.diagnostic.verdict,
                    explanation: gate.diagnostic.explanation,
                  }
                : null,
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
    headline: summarise(rounds, reports),
    rounds,
    startedAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}

/**
 * Reduces the rounds to the one paragraph a reader needs before anything else.
 *
 * `scored` is the latest round that actually reached a verdict, which is not
 * always the last round: opening a new round resets its evidence, so the most
 * recent round is frequently empty and reading the headline off it would show
 * a live idea as having concluded nothing.
 */
function summarise(
  rounds: JourneyRound[],
  reports: (ResearchReport | null)[],
): JourneyHeadline {
  const scored = [...rounds].reverse().find((r) => r.score !== null);
  const withFindings = [...rounds].reverse().find((r) => r.themes.length > 0);
  const withConcerns = [...rounds]
    .reverse()
    .find((r) => r.objections.length > 0 || (r.score?.riskFactors.length ?? 0) > 0);

  const totalResponses = rounds.reduce((n, r) => n + r.responseCount, 0);
  /**
   * Distinct URLs across every round, from the one definition in
   * research-sources. This counted evidence items and nothing else, so a run
   * that read two pages and drew four competitor entries out of them reported
   * zero sources here while the dashboard reported four. Summing per-round
   * counts would have been wrong too: a rework re-reads the same pages.
   */
  const totalSources = countSourcesAcross(reports);

  return {
    score: scored?.score?.value ?? null,
    signal: scored?.score?.signal ?? null,
    verdict: scored?.score?.reasoning ?? "",
    confirmationRate: scored?.confirmationRate ?? 0,
    totalResponses,
    totalSources,
    roundCount: rounds.length,
    keyFindings: withFindings?.themes.slice(0, 4) ?? [],
    openConcerns: [
      ...(withConcerns?.objections ?? []),
      ...(withConcerns?.score?.riskFactors.map((r) => r.label) ?? []),
    ].slice(0, 4),
  };
}
