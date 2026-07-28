import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { runSignalScan } from "@/lib/agents/orchestrator";
import { trackSchema } from "@/lib/domain/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({ track: trackSchema });

/**
 * POST /ideas/:id/track - select normal|fast (PRD §8).
 *
 * Choosing Normal Track also runs the Signal Scanning Agent, which produces
 * the community list and interview script. That output is shared across both
 * tracks and both drafting agents - generated once per idea, never regenerated
 * per feature (PRD §4.3.3).
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

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid track." }, { status: 400 });
    }
    const { track } = parsed.data;

    let state = await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      status: track === "normal" ? "validating_normal" : "validating_fast",
      validation: { ...s.validation, track },
    }));

    // Idempotent: a second visit reuses the communities already found.
    if (state.validation.communities.length === 0) {
      state = await runSignalScan({ versionId: idea.versionId, state });
    }

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/track]`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "We couldn't start that track. Try again.",
      },
      { status: 500 },
    );
  }
}
