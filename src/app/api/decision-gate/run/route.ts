import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { GO_AHEAD_THRESHOLD } from "@/lib/domain/types";

export const runtime = "nodejs";

/**
 * POST /api/decision-gate/run - adapter for the empirical Decision Gate audit.
 *
 * The Overview tab ships the workspace's respondents and wants back a verdict:
 * {signal, score, reasoning, riskFactors, proposals}. The full Decision Gate
 * agent needs persisted responses inside an idea round, which this ad-hoc
 * surface does not have, so we compute the composite here from the numbers the
 * tab actually holds. Nothing is invented: every risk flag below is derived
 * from a real weakness in the supplied sample, and proposals stay empty until
 * an agent can ground them in evidence.
 */

const respondentSchema = z.object({
  id: z.string(),
  painSeverity: z.number().default(0),
  budgetDecisionMaker: z.boolean().default(false),
  willingnessToPay: z.number().default(0),
});

const bodySchema = z.object({
  problemStatement: z.string().default(""),
  icp: z.string().default(""),
  respondents: z.array(respondentSchema).default([]),
  currentScore: z.number().default(0),
});

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { respondents, currentScore } = parsed.data;

    const total = respondents.length;
    const highPain = respondents.filter((r) => r.painSeverity >= 7).length;
    const decisionMakers = respondents.filter((r) => r.budgetDecisionMaker).length;
    const severeRate = total > 0 ? Math.round((highPain / total) * 100) : 0;
    const dmRate = total > 0 ? Math.round((decisionMakers / total) * 100) : 0;
    const avgWtp =
      total > 0
        ? Math.round(respondents.reduce((a, r) => a + r.willingnessToPay, 0) / total)
        : 0;

    // Sample-size factor, capped at 20 screened respondents.
    const sampleFactor = Math.min((total / 20) * 100, 100);
    const computed = Math.round(severeRate * 0.7 + sampleFactor * 0.3);
    const score = currentScore > 0 ? currentScore : computed;

    // Same primary threshold the engine uses: enough confirmed, severe pain.
    const goAhead = severeRate / 100 >= GO_AHEAD_THRESHOLD && total >= 5;

    const reasoning =
      total === 0
        ? "No screened respondents are in this workspace yet, so the gate cannot score real evidence. Run a validation round to collect interviews before auditing."
        : `Audited ${total} screened respondent${total === 1 ? "" : "s"}. ${severeRate}% report severe (7+/10) pain and ${dmRate}% are budget decision makers, with a mean willingness to pay of $${avgWtp}/mo.`;

    const riskFactors: { label: string; detail: string; severity: string }[] = [];
    if (total < 10) {
      riskFactors.push({
        label: "Small sample size",
        detail: `Only ${total} respondents screened. Below ~10 interviews the confirmation rate is unstable and can swing on a single reply.`,
        severity: "caution",
      });
    }
    if (severeRate < 50 && total > 0) {
      riskFactors.push({
        label: "Weak pain intensity",
        detail: `Only ${severeRate}% rate the pain 7/10 or higher. The problem reads as real but not urgent enough to drive a purchase.`,
        severity: "high",
      });
    }
    if (dmRate < 40 && total > 0) {
      riskFactors.push({
        label: "Low budget-holder share",
        detail: `Just ${dmRate}% of respondents control budget. Sales may stall with users who feel the pain but cannot buy.`,
        severity: "caution",
      });
    }

    return NextResponse.json({
      signal: goAhead ? "go_ahead" : "rethink",
      score,
      reasoning,
      riskFactors,
      proposals: [],
    });
  } catch (err) {
    console.error("[POST /api/decision-gate/run]", err);
    return NextResponse.json(
      { error: "The decision gate could not run right now." },
      { status: 500 },
    );
  }
}
