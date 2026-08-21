import { NextResponse } from "next/server";
import { z } from "zod";
import { getFounderWorkspace } from "@/lib/data/journey";
import { updateCurrentState } from "@/lib/data/ideas";
import { questionKindSchema } from "@/lib/domain/types";

export const runtime = "nodejs";

const questionSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1).max(1000),
  kind: questionKindSchema,
  options: z.array(z.string().max(200)).max(12),
  intent: z.string(),
  required: z.boolean(),
});

const bodySchema = z.object({
  questions: z.array(questionSchema).max(30),
  intro: z.string().max(2000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const workspace = await getFounderWorkspace(token);
  return workspace
    ? NextResponse.json(workspace)
    : NextResponse.json({ error: "Workspace not found." }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const workspace = await getFounderWorkspace(token);
  if (!workspace) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  if (workspace.permission !== "edit") return NextResponse.json({ error: "This workspace is read-only." }, { status: 403 });
  if (workspace.questionsLocked) return NextResponse.json({ error: "Questions are locked once validation has started." }, { status: 409 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Those questions don't look right." }, { status: 400 });

  const state = await updateCurrentState(workspace.versionId, (current) => ({
    ...current,
    validation: {
      ...current.validation,
      questionnaire: {
        ...current.validation.questionnaire,
        questions: parsed.data.questions,
        intro: parsed.data.intro,
      },
    },
  }));
  return NextResponse.json({ questions: state.validation.questionnaire.questions, intro: state.validation.questionnaire.intro });
}