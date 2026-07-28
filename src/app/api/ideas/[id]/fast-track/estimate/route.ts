import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { estimateFastTrack } from "@/lib/pricing";

export const runtime = "nodejs";

const bodySchema = z.object({ n: z.number().int().min(1).max(100) });

/** POST /ideas/:id/fast-track/estimate - { n } → itemised cost (PRD §8). */
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
      return NextResponse.json({ error: "Invalid count." }, { status: 400 });
    }

    const estimate = await estimateFastTrack({
      tier: idea.state.structured.niche_tier,
      n: parsed.data.n,
    });

    return NextResponse.json({ estimate });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/fast-track/estimate]`, err);
    return NextResponse.json(
      { error: "We couldn't work out a price." },
      { status: 500 },
    );
  }
}
