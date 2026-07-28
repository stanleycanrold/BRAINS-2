import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { runDecisionGate } from "@/lib/agents/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({ force: z.boolean().default(false) });

/**
 * POST /ideas/:id/finalize-validation — synthesis, then the gate (PRD §8).
 *
 * `force` records that the founder ran analysis below the 10-response soft
 * gate. It is not a bypass flag that hides anything: it is passed through to
 * the Decision Gate so low sample size is surfaced as a prominent risk factor
 * on the report rather than silently discounted.
 */
export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const { force } = bodySchema.parse(body);

    const state = await runDecisionGate({
      versionId: idea.versionId,
      state: idea.state,
      forcedEarly: force,
    });

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/finalize-validation]`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "We couldn't finish the analysis. Your responses are saved.",
      },
      { status: 500 },
    );
  }
}
