import { NextResponse } from "next/server";
import { randomUUID, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { runQuestionnaire } from "@/lib/agents/orchestrator";
import { questionKindSchema } from "@/lib/domain/types";

export const runtime = "nodejs";
export const maxDuration = 120;

/** POST - (re)generate the question set from this idea's research. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await requireUser();
    const idea = await getIdea(id, user.id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }

    const state = await runQuestionnaire({
      versionId: idea.versionId,
      state: idea.state,
    });
    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/questions]`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "We couldn't write the questions.",
      },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1).max(1000),
        kind: questionKindSchema,
        // Only meaningful for the choice kinds; capped so a founder can't
        // post an unbounded list into the public questionnaire.
        options: z.array(z.string().max(200)).max(12).default([]),
        intent: z.string().default(""),
        required: z.boolean().default(false),
      }),
    )
    .max(30)
    .optional(),
  intro: z.string().max(2000).optional(),
  accepting_responses: z.boolean().optional(),
  /** Mint or rotate the public link. */
  share: z.boolean().optional(),
});

/**
 * PATCH - edit the questions, the intro, or the share link.
 *
 * The founder has the final say on wording. The agent's version is a starting
 * point: they know their audience's language better than a model does, and a
 * question that sounds like a survey gets survey-quality answers.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await requireUser();
    const idea = await getIdea(id, user.id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Those questions don't look right - check and try again." },
        { status: 400 },
      );
    }
    const body = parsed.data;

    let token = idea.state.validation.questionnaire.share_token;

    if (body.share && !token) {
      // 32 hex chars of CSPRNG. The link is the only credential a respondent
      // presents, so it has to be unguessable rather than merely unique.
      token = randomBytes(16).toString("hex");
      await db
        .update(schema.ideaStateVersions)
        .set({ shareToken: token })
        .where(eq(schema.ideaStateVersions.id, idea.versionId));
    }

    const state = await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      validation: {
        ...s.validation,
        questionnaire: {
          ...s.validation.questionnaire,
          questions: body.questions
            ? body.questions.map((q) => ({
                ...q,
                id: q.id || randomUUID(),
                options: q.options ?? [],
              }))
            : s.validation.questionnaire.questions,
          intro: body.intro ?? s.validation.questionnaire.intro,
          accepting_responses:
            body.accepting_responses ??
            s.validation.questionnaire.accepting_responses,
          share_token: token,
        },
      },
    }));

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[PATCH /api/ideas/${id}/questions]`, err);
    return NextResponse.json(
      { error: "We couldn't save those questions." },
      { status: 500 },
    );
  }
}
