import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { runResearchPipeline } from "@/lib/agents/orchestrator";

export const runtime = "nodejs";
// Research fans out across product fetch, extraction and a live search pass.
export const maxDuration = 300;

/**
 * POST /ideas/:id/research — runs the Step-2 pipeline.
 *
 * The client kicks this off after the entry record exists and polls the idea
 * for the result, so a slow research pass shows progress rather than blocking
 * the submission (PRD §4.1).
 */
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

    // Idempotent: if research already landed, return it rather than paying for
    // a second run (a refresh mid-poll would otherwise re-trigger it).
    if (idea.state.research_report) {
      return NextResponse.json({ state: idea.state });
    }

    const state = await runResearchPipeline({
      versionId: idea.versionId,
      state: idea.state,
    });

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/research]`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Research didn't complete. Your idea is saved — try again.",
      },
      { status: 500 },
    );
  }
}
