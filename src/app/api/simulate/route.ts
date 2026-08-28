import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createIdea } from "@/lib/data/ideas";
import { describeIdeaProblem } from "@/lib/domain/limits";
import { generateSimulationWorkspace } from "@/lib/simulation/simulation-data";
import type { FullWorkspaceData } from "@/lib/domain/empirical-types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/simulate - explicit simulation mode for preview/education.
 * 
 * This endpoint explicitly generates SIMULATED data for preview/educational purposes.
 * All returned data carries `isSimulation: true` flags so the UI can clearly mark it.
 * 
 * Unlike the real validation pipeline, this does NOT run live search or research.
 * It generates realistic-looking sample data based on the provided problem/ICP.
 * 
 * Use case: Founder wants to see what a completed validation looks like before
 * committing to running the real pipeline, or for demo/educational purposes.
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

    // Fold the composer's structured fields into one description
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

    // Create the idea record
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

    // Generate explicit simulation data (not real research)
    const simulationData = generateSimulationWorkspace(
      coreProblem || ideaTitle,
      targetIcp,
      `Solving: ${coreProblem || ideaTitle}`,
      user.name || "Demo Founder"
    );

    // Override with the composer's title
    simulationData.meta.name = `Simulation: ${ideaTitle}`;
    simulationData.meta.tagline = `Simulated validation for: ${coreProblem || ideaTitle}`;

    // Construct FullWorkspaceData directly from simulation data
    // (bypassing projectWorkspace which expects real DB data)
    const workspace: FullWorkspaceData = {
      meta: {
        ...simulationData.meta,
        isSimulation: true,
      } as any,
      respondents: simulationData.respondents,
      quotes: simulationData.quotes,
      competitors: simulationData.competitors,
      hypotheses: simulationData.hypotheses,
      socialMentions: simulationData.socialMentions,
    };

    // Override with the composer's title
    workspace.meta.name = `Simulation: ${ideaTitle}`;
    workspace.meta.tagline = `Simulated validation for: ${coreProblem || ideaTitle}`;

    return NextResponse.json({ 
      ...workspace, 
      isSimulation: true,
      simulationNote: "This is simulated data for preview purposes only. No live research was conducted. Run the real validation to get real data."
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/simulate]", err);
    return NextResponse.json(
      { error: "We couldn't generate that simulation. Try again." },
      { status: 500 },
    );
  }
}