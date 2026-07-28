import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import {
  runPostDrafting,
  runCommentDrafting,
} from "@/lib/agents/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300;

const generateSchema = z.object({ kind: z.enum(["post", "comment"]) });

const markSchema = z.object({
  draft_id: z.string(),
  kind: z.enum(["post", "comment"]),
  edited_text: z.string().optional(),
  status: z.enum(["edited", "posted"]),
});

/** POST — generate drafts for this idea's communities (PRD §6.8 / §6.9). */
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

    const parsed = generateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const state =
      parsed.data.kind === "post"
        ? await runPostDrafting({ versionId: idea.versionId, state: idea.state })
        : await runCommentDrafting({
            versionId: idea.versionId,
            state: idea.state,
          });

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/social/drafts]`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "We couldn't write drafts.",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH — save an edit, or mark a draft as posted.
 *
 * "Posted" is the founder telling us they published it themselves. BRAINS
 * never publishes anything, on any tier — this endpoint records an action
 * that already happened elsewhere.
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

    const parsed = markSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { draft_id, kind, edited_text, status } = parsed.data;

    const state = await updateCurrentState(idea.versionId, (s) => {
      const patch = <T extends { id: string; status: string; edited_text: string | null }>(
        list: T[],
      ): T[] =>
        list.map((d) =>
          d.id === draft_id
            ? {
                ...d,
                status,
                edited_text: edited_text ?? d.edited_text,
              }
            : d,
        );

      return {
        ...s,
        social_engagement: {
          drafted_posts:
            kind === "post"
              ? patch(s.social_engagement.drafted_posts)
              : s.social_engagement.drafted_posts,
          drafted_comments:
            kind === "comment"
              ? patch(s.social_engagement.drafted_comments)
              : s.social_engagement.drafted_comments,
        },
      };
    });

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[PATCH /api/ideas/${id}/social/drafts]`, err);
    return NextResponse.json(
      { error: "We couldn't save that draft." },
      { status: 500 },
    );
  }
}
