import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createIdea, getIdea } from "@/lib/data/ideas";
import { describeIdeaProblem } from "@/lib/domain/limits";
import { runResearchPipeline } from "@/lib/agents/orchestrator";
import { projectWorkspace } from "@/lib/studio/projection";

export const runtime = "nodejs";
// Research fans out across product fetch, extraction and a live search pass.
export const maxDuration = 300;

/**
 * POST /api/validate-idea - adapter for the empirical Idea Composer.
 *
 * The composer collects a title, ICP, core problem and target price and wants
 * back a ready-to-browse FullWorkspaceData. We map that onto the real engine:
 * create the idea (append-safe), kick the Step-2 research pipeline, then
 * project whatever the engine holds into the studio shape. Nothing is
 * fabricated - a workspace with no respondents yet simply shows zeros.
 */

const bodySchema = z.object({
  ideaTitle: z.string().min(1).max(200),
  targetIcp: z.string().max(500).default(""),
  coreProblem: z.string().max(4000).default(""),
  targetPrice: z.number().nonnegative().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "A few details are missing from the idea." },
        { status: 400 },
      );
    }

    const { ideaTitle, targetIcp, coreProblem, targetPrice } = parsed.data;

    // Fold the composer's structured fields into one description the engine
    // already knows how to research. Price is evidence for the pricing agents.
    const description = [
      ideaTitle,
      coreProblem ? `Problem: ${coreProblem}` : "",
      targetIcp ? `Target customer: ${targetIcp}` : "",
      targetPrice
        ? `Intended pricing: around $${targetPrice} per month.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const problem = describeIdeaProblem(description);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const idea = await createIdea({
      userId: user.id,
      stageAtEntry: "idea_only",
      rawSubmission: {
        description,
        target_audience: targetIcp || "Not specified yet",
        product_link: null,
        location_focus: "",
        attachments: [],
      },
    });

    // Best-effort research pass so the workspace opens with competitors and
    // evidence. A failure here must not lose the idea - the record already
    // exists and the founder can re-run research from the studio later.
    let current = idea;
    try {
      await runResearchPipeline({
        versionId: idea.versionId,
        state: idea.state,
      });
      const refreshed = await getIdea(idea.id, user.id);
      if (refreshed) current = refreshed;
    } catch (researchErr) {
      console.error("[POST /api/validate-idea] research pass failed", researchErr);
    }

    const workspace = await projectWorkspace(current, {
      ownerName: user.name,
    });
    // The composer's own title is more specific than the engine's placeholder.
    workspace.meta.name = ideaTitle;

    return NextResponse.json(workspace, { status: 201 });
  } catch (err) {
    console.error("[POST /api/validate-idea]", err);
    return NextResponse.json(
      { error: "We couldn't start that validation. Try again." },
      { status: 500 },
    );
  }
}
