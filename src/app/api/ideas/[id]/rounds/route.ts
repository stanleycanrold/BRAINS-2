import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { forkVersion, getIdea } from "@/lib/data/ideas";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** Where the new round resumes: fresh research, or straight to validation. */
  resume_at: z.enum(["research", "validation"]).default("research"),
  note: z.string().max(200).optional(),
});

/**
 * POST /ideas/:id/rounds - start another round on an idea that already ended.
 *
 * Separate from `/decision` on purpose, even though both fork a version.
 * `/decision` is the founder answering the gate: it writes a `decision_gates`
 * row recording whether they agreed with the score, which is a metric the PRD
 * tracks. Reusing it here would log a second, fictional decision against a
 * gate that was already answered, quietly corrupting the agreement rate.
 *
 * This is the missing half of "nothing becomes unreachable once you continue".
 * Reaching a verdict closed the loop entirely: the report's three buttons all
 * disable once `decided`, so a founder who passed and then wanted to sharpen
 * had no way forward except starting a new idea and losing the history. The
 * rework loop was always meant to be unbounded and available whatever the
 * score - this is the route that makes that true after a decision as well as
 * before one.
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

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { resume_at, note } = parsed.data;

    const forked = await forkVersion({
      ideaId: id,
      userId: user.id,
      note: note?.trim() || `Round ${idea.versionNumber + 1}`,
      // No patches: this is the founder choosing to go again, not the gate
      // proposing changes. They edit the idea in the round they just opened.
      patches: {},
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
    console.error(`[POST /api/ideas/${id}/rounds]`, err);
    return NextResponse.json(
      { error: "We couldn't start a new round." },
      { status: 500 },
    );
  }
}
