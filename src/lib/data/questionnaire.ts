import "server-only";
import { eq, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { screenResponse } from "@/lib/screening";
import {
  computeConfirmationRate,
  ideaStateSchema,
  type Question,
} from "@/lib/domain/types";

/**
 * Public questionnaire access.
 *
 * Everything here is reachable WITHOUT authentication, so the exposed surface
 * is deliberately tiny: a respondent can read the questions and post one set
 * of answers. Nothing returns the idea, the founder, the research, the score,
 * or any other response - a share link is not a window into the account.
 */

export type PublicQuestionnaire = {
  ideaTitle: string;
  intro: string;
  questions: Question[];
  acceptingResponses: boolean;
};

/**
 * Resolves a public token to its version AND to which link it was.
 *
 * The token decides the track. Previously every public response inherited
 * `state.validation.track`, so once a round went paid the founder's own
 * outreach was indistinguishable from the interviews they'd bought - and the
 * attribution changed retroactively for answers already collected. The link
 * someone answered on is a fact about that response, so it's what we record.
 */
async function resolveToken(token: string) {
  if (!token || token.length < 16) return null;

  const rows = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(
      or(
        eq(schema.ideaStateVersions.shareToken, token),
        eq(schema.ideaStateVersions.panelToken, token),
      ),
    )
    .limit(1);

  const version = rows[0];
  if (!version) return null;

  return {
    version,
    track: (version.panelToken === token ? "fast" : "normal") as
      | "fast"
      | "normal",
  };
}

export async function getPublicQuestionnaire(
  token: string,
): Promise<PublicQuestionnaire | null> {
  const resolved = await resolveToken(token);
  if (!resolved) return null;
  const { version } = resolved;

  const state = ideaStateSchema.parse(version.stateJson);
  const questionnaire = state.validation.questionnaire;
  if (questionnaire.questions.length === 0) return null;

  return {
    // The idea's own title, so a respondent knows what they're answering
    // about - never the problem statement, competitors or score.
    ideaTitle: state.title || "a product idea",
    intro: questionnaire.intro,
    questions: questionnaire.questions,
    acceptingResponses: questionnaire.accepting_responses,
  };
}

export type PublicAnswer = { questionId: string; answer: string };

/**
 * Records a public submission into the SAME unified response pool as
 * interviews and social replies (PRD §7), so the Decision Gate scores across
 * every channel together rather than treating a questionnaire as a lesser
 * source.
 */
export async function submitPublicResponse(params: {
  token: string;
  answers: PublicAnswer[];
  confirmed: "yes" | "no" | "unsure";
  source: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resolved = await resolveToken(params.token);
  if (!resolved) return { ok: false, error: "This link isn't valid." };
  const { version, track } = resolved;

  const state = ideaStateSchema.parse(version.stateJson);
  const questionnaire = state.validation.questionnaire;

  if (!questionnaire.accepting_responses) {
    return { ok: false, error: "This questionnaire is closed." };
  }

  // Answers are folded into readable notes rather than a parallel structure,
  // because the Synthesis Agent reads notes - one shape for every channel
  // means one thing to reason about downstream.
  const byId = new Map(questionnaire.questions.map((q) => [q.id, q]));
  const notes = params.answers
    .filter((a) => a.answer.trim())
    .map((a) => {
      const question = byId.get(a.questionId);
      return question ? `${question.text}\n→ ${a.answer.trim()}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  if (!notes) return { ok: false, error: "Answer at least one question." };

  const [stored] = await db
    .insert(schema.validationResponses)
    .values({
    ideaStateVersionId: version.id,
    // From the link, not the idea's current track - see resolveToken.
    track,
    channel: "survey",
    confirmed: params.confirmed,
    notes,
    source:
      params.source ||
      (track === "fast" ? "Fast Track interview" : "Questionnaire link"),
    })
    .returning();

  const next = {
    ...state,
    validation: {
      ...state.validation,
      responses: [
        ...state.validation.responses,
        {
          // Same id as the stored row, so screening can update both.
          id: stored.id,
          confirmed: params.confirmed,
          notes,
          source:
            params.source ||
            (track === "fast" ? "Fast Track interview" : "Questionnaire link"),
          channel: "survey" as const,
          track,
          expert_id: null,
          expert_name: null,
          confidence: null,
          review_status: "pending" as const,
          quality_flags: [],
          created_at: new Date().toISOString(),
        },
      ],
    },
  };
  next.validation.confirmation_rate = computeConfirmationRate(
    next.validation.responses,
  );
  next.updated_at = new Date().toISOString();

  await db
    .update(schema.ideaStateVersions)
    .set({ stateJson: next, updatedAt: new Date() })
    .where(eq(schema.ideaStateVersions.id, version.id));

  // Screening runs after the response is safely stored, so a model outage
  // can never cost us an answer somebody took the time to write.
  void screenResponse({ responseId: stored.id, versionId: version.id });

  return { ok: true };
}
