import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";

export const runtime = "nodejs";

const bodySchema = z.object({ script: z.string().max(20000) });

/** PATCH the interview script. Agent-drafted, but the founder's to edit. */
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

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid script." }, { status: 400 });
    }

    const state = await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      validation: { ...s.validation, script: parsed.data.script },
    }));

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[PATCH /api/ideas/${id}/script]`, err);
    return NextResponse.json(
      { error: "We couldn't save your script." },
      { status: 500 },
    );
  }
}
