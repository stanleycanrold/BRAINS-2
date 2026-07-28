import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";

export const runtime = "nodejs";

const bodySchema = z.object({
  proposal_id: z.string(),
  status: z.enum(["accepted", "rejected", "edited"]),
  edited_text: z.string().optional(),
});

/**
 * Accept / reject / edit a Decision Gate improvement proposal (PRD §4.4).
 *
 * Same interaction as the research-stage proposals, applied to the gate's
 * output. Unlike research, accepting here does NOT rewrite the current
 * version's fields — this version is a finished, decided record. The patch is
 * carried into the NEW version when the founder chooses Rework, so history
 * stays intact and the next round still starts sharpened.
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
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { proposal_id, status, edited_text } = parsed.data;

    const state = await updateCurrentState(idea.versionId, (s) => {
      if (!s.decision_gate) return s;

      return {
        ...s,
        decision_gate: {
          ...s.decision_gate,
          improvement_proposal: s.decision_gate.improvement_proposal.map((p) =>
            p.id === proposal_id
              ? {
                  ...p,
                  status,
                  edited_text:
                    status === "edited" ? (edited_text ?? null) : null,
                  // An edited proposal must carry the founder's wording into
                  // the fork, not the model's original phrasing.
                  patch_value:
                    status === "edited" && edited_text
                      ? edited_text
                      : p.patch_value,
                }
              : p,
          ),
        },
      };
    });

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/report/proposals]`, err);
    return NextResponse.json(
      { error: "We couldn't save that decision." },
      { status: 500 },
    );
  }
}
