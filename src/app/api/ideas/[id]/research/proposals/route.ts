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
 * POST /ideas/:id/research/accept-change (PRD §8).
 *
 * Accepting a proposal patches the idea's structured fields directly, so the
 * next stage works from the sharpened idea. Every decision is stored - it's
 * training signal for "what changes founders actually take" (§4.2).
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
      if (!s.research_report) return s;

      const proposal = s.research_report.proposed_changes.find(
        (p) => p.id === proposal_id,
      );
      if (!proposal) return s;

      const structured = { ...s.structured };
      const isAccept = status === "accepted" || status === "edited";

      // Only an accept writes through to the structured fields. Undo (which
      // arrives as "rejected") deliberately does not revert the field - the
      // founder may have edited it since, and silently overwriting their work
      // would be worse than leaving the patch applied.
      if (isAccept && proposal.patches !== "none" && proposal.patch_value) {
        structured[proposal.patches] = proposal.patch_value;
      }

      return {
        ...s,
        structured,
        research_report: {
          ...s.research_report,
          proposed_changes: s.research_report.proposed_changes.map((p) =>
            p.id === proposal_id
              ? {
                  ...p,
                  status,
                  edited_text: status === "edited" ? (edited_text ?? null) : null,
                }
              : p,
          ),
        },
      };
    });

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/research/proposals]`, err);
    return NextResponse.json(
      { error: "We couldn't save that decision." },
      { status: 500 },
    );
  }
}
