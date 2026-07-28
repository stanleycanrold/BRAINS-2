import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
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
 * or any other response — a share link is not a window into the account.
 */

export type PublicQuestionnaire = {
  ideaTitle: string;
  intro: string;
  questions: Question[];
  acceptingResponses: boolean;
};

export async function getPublicQuestionnaire(
  token: string,
): Promise<PublicQuestionnaire | null> {
  if (!token || token.length < 16) return null;

  const rows = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.shareToken, token))
    .limit(1);

  const version = rows[0];
  if (!version) return null;

  const state = ideaStateSchema.parse(version.stateJson);
  const questionnaire = state.validation.questionnaire;
  if (questionnaire.questions.length === 0) return null;

  return {
    // The idea's own title, so a respondent knows what they're answering
    // about — never the problem statement, competitors or score.
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
  const rows = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.shareToken, params.token))
    .limit(1);

  const version = rows[0];
  if (!version) return { ok: false, error: "This link isn't valid." };

  const state = ideaStateSchema.parse(version.stateJson);
  const questionnaire = state.validation.questionnaire;

  if (!questionnaire.accepting_responses) {
    return { ok: false, error: "This questionnaire is closed." };
  }

  // Answers are folded into readable notes rather than a parallel structure,
  // because the Synthesis Agent reads notes — one shape for every channel
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

  await db.insert(schema.validationResponses).values({
    ideaStateVersionId: version.id,
    track: state.validation.track ?? "normal",
    channel: "survey",
    confirmed: params.confirmed,
    notes,
    source: params.source || "Questionnaire link",
  });

  const next = {
    ...state,
    validation: {
      ...state.validation,
      responses: [
        ...state.validation.responses,
        {
          id: randomUUID(),
          confirmed: params.confirmed,
          notes,
          source: params.source || "Questionnaire link",
          channel: "survey" as const,
          track: state.validation.track ?? ("normal" as const),
          expert_id: null,
          expert_name: null,
          confidence: null,
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

  return { ok: true };
}
