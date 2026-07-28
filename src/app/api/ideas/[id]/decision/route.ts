import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  forkVersion,
  getIdea,
  setTerminalStatus,
  updateCurrentState,
} from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";

export const runtime = "nodejs";

const bodySchema = z.object({
  decision: z.enum(["proceed", "rework", "kill"]),
  kill_reason: z.string().max(1000).optional(),
  /** Where a rework resumes - new research, or straight to a fresh round. */
  resume_at: z.enum(["research", "validation"]).default("validation"),
});

/**
 * POST /ideas/:id/decision - the founder's proceed | rework | kill (PRD §8).
 *
 * The rework loop is unbounded and always available, whatever the score. A
 * founder may rework after a `go_ahead` to sharpen before building, exactly as
 * freely as after a `rethink`. Nothing here caps or gates that (PRD §4.5).
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
      return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    }
    const { decision, kill_reason, resume_at } = parsed.data;

    const gate = idea.state.decision_gate;

    // Record the founder's call against the gate for the agreement-rate metric
    // in PRD §11 - did they follow the agent's recommendation or overrule it?
    if (gate?.signal) {
      await db.insert(schema.decisionGates).values({
        ideaStateVersionId: idea.versionId,
        score: gate.score,
        signal: gate.signal,
        reasoning: gate.reasoning,
        riskFactorsJson: gate.risk_factors,
        improvementProposalJson: gate.improvement_proposal,
        diagnosticJson: gate.diagnostic,
        userDecision: decision,
        killReason: kill_reason ?? null,
        decidedAt: new Date(),
      });
    }

    if (decision === "proceed") {
      await setTerminalStatus({
        ideaId: id,
        userId: user.id,
        status: "passed",
      });
      return NextResponse.json({ next: "/dashboard" });
    }

    if (decision === "kill") {
      await setTerminalStatus({
        ideaId: id,
        userId: user.id,
        status: "killed",
        killReason: kill_reason ?? null,
      });
      return NextResponse.json({ next: "/dashboard" });
    }

    // Rework: carry forward every accepted improvement proposal as a patch, so
    // the next round starts from the sharpened idea rather than the original.
    const accepted = (gate?.improvement_proposal ?? []).filter(
      (p) => p.status === "accepted" || p.status === "edited",
    );

    const patches: Record<string, string> = {};
    for (const proposal of accepted) {
      if (proposal.patches !== "none" && proposal.patch_value) {
        patches[proposal.patches] = proposal.patch_value;
      }
    }

    await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      status: "needs_rework",
      decision_gate: s.decision_gate
        ? {
            ...s.decision_gate,
            user_decision: "rework",
            decided_at: new Date().toISOString(),
          }
        : s.decision_gate,
    }));

    const note = accepted.length
      ? `Rework - applied ${accepted.length} ${accepted.length === 1 ? "change" : "changes"}`
      : "Rework - no changes applied";

    const forked = await forkVersion({
      ideaId: id,
      userId: user.id,
      note,
      patches,
      resumeAt: resume_at,
    });

    return NextResponse.json({
      next:
        resume_at === "research"
          ? `/ideas/${id}/research`
          : `/ideas/${id}/validation`,
      version: forked.versionNumber,
    });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/decision]`, err);
    return NextResponse.json(
      { error: "We couldn't record that decision." },
      { status: 500 },
    );
  }
}
