import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";

export const runtime = "nodejs";

const bodySchema = z.object({
  problem_statement: z.string().min(1).max(2000).optional(),
  icp: z.string().min(1).max(1000).optional(),
  value_prop: z.string().min(1).max(1000).optional(),
});

/**
 * PATCH the structured fields the Extraction Agent inferred.
 *
 * The founder gets the final say on how their idea is framed. Everything
 * downstream — signal scanning, the interview script, the confirmation rate,
 * the score — is computed from these three fields, so letting them correct a
 * misread here is far cheaper than discovering it after a validation round.
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

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "That doesn't look right — check the text and try again." },
        { status: 400 },
      );
    }

    const state = await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      structured: {
        ...s.structured,
        ...(parsed.data.problem_statement !== undefined && {
          problem_statement: parsed.data.problem_statement,
        }),
        ...(parsed.data.icp !== undefined && { icp: parsed.data.icp }),
        ...(parsed.data.value_prop !== undefined && {
          value_prop: parsed.data.value_prop,
        }),
      },
    }));

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[PATCH /api/ideas/${id}/structured]`, err);
    return NextResponse.json(
      { error: "We couldn't save that change." },
      { status: 500 },
    );
  }
}
