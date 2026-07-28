import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";

export const runtime = "nodejs";

/** GET /ideas/:id — current idea_state, used by the research poller. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await requireUser();
    const idea = await getIdea(id, user.id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }
    return NextResponse.json({ state: idea.state, status: idea.status });
  } catch (err) {
    console.error(`[GET /api/ideas/${id}]`, err);
    return NextResponse.json(
      { error: "We couldn't load that idea." },
      { status: 500 },
    );
  }
}
