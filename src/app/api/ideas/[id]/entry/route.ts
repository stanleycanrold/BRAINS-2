import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { stageAtEntrySchema } from "@/lib/domain/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  description: z.string().trim().min(20).max(5000),
  target_audience: z.string().trim().max(500),
  location_focus: z.string().trim().max(200),
  product_link: z.string().trim().max(2000).nullable(),
  stage_at_entry: stageAtEntrySchema,
});

/**
 * PATCH /ideas/:id/entry - edit the idea itself, after it was first written.
 *
 * There was no way to do this. The entry screen only existed at /ideas/new, so
 * a typo, a wrong audience or a location left blank was permanent for the life
 * of the idea - the founder's only recourse was starting over and losing the
 * history.
 *
 * Patches the current version in place rather than forking. A fork records
 * that the idea *changed*, which is a claim about the thinking; correcting how
 * it was written down is not that. Reworking into a genuinely different idea
 * is what /rounds and the gate's rework path are for, and both remain the way
 * to do it.
 *
 * What this deliberately does not touch: `structured`, which the extraction
 * agent derives, and the research report. Both are downstream of this text and
 * are now stale, which the UI says plainly rather than silently re-running
 * work the founder did not ask for.
 */
export async function PATCH(
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
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Give us a little more to work with.",
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const state = await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      raw_submission: {
        ...s.raw_submission,
        description: input.description,
        target_audience: input.target_audience,
        location_focus: input.location_focus,
        product_link: input.product_link || null,
      },
      stage_at_entry: input.stage_at_entry,
      updated_at: new Date().toISOString(),
    }));

    // No separate write to `ideas` here: updateCurrentState already syncs the
    // denormalised title and summary the sidebar and dashboard read from, and
    // a second update would race its own.
    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[PATCH /api/ideas/${id}/entry]`, err);
    return NextResponse.json(
      { error: "We couldn't save that." },
      { status: 500 },
    );
  }
}
