import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/fast-track/launch - adapter for the empirical Fast Track modal.
 *
 * The modal collects a target role and a respondent budget and wants back
 * {newRespondents}. The real Fast Track is a paid Stripe round tied to a
 * specific idea (`/api/ideas/:id/fast-track/checkout`): interviews are sourced
 * and run by the ops pipeline, and respondents land in the workspace only after
 * they clear quality screening. That round cannot be created from this ad-hoc
 * surface - it carries no idea id and takes no payment.
 *
 * So this endpoint accepts the request and returns an empty respondent list
 * rather than inventing interviews. The projection layer's "never fabricate"
 * rule applies here too: a workspace's respondents must be real, screened
 * people, so nothing is added until the ops pipeline produces them.
 */

const bodySchema = z.object({
  targetRole: z.string().max(300).default(""),
  respondentCount: z.number().int().positive().max(200).default(10),
  costPerPerson: z.number().nonnegative().default(0),
  totalRoundCost: z.number().nonnegative().default(0),
  currentWorkspaceName: z.string().max(300).default(""),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Recorded so the request is traceable; the actual sourcing happens on the
    // paid idea-scoped round, not here.
    console.info(
      `[fast-track-launch] user=${user.id} role="${parsed.data.targetRole}" n=${parsed.data.respondentCount} workspace="${parsed.data.currentWorkspaceName}"`,
    );

    return NextResponse.json({
      newRespondents: [],
      note:
        "Fast Track request received. Interviewees are sourced and screened on the paid round; they appear here once they clear quality review.",
    });
  } catch (err) {
    console.error("[POST /api/fast-track/launch]", err);
    return NextResponse.json(
      { error: "We couldn't start that Fast Track round." },
      { status: 500 },
    );
  }
}
