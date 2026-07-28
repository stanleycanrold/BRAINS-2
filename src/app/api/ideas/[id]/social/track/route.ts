import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { checkTrackedSpace } from "@/lib/agents/orchestrator";
import { computeConfirmationRate, confirmedSchema } from "@/lib/domain/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.discriminatedUnion("action", [
  /** Founder published it themselves; we record where, so it can be revisited. */
  z.object({
    action: z.literal("mark_posted"),
    draft_id: z.string(),
    posted_url: z.string().max(500).default(""),
  }),
  /** Ask whether anything has happened in that space since. */
  z.object({ action: z.literal("check"), draft_id: z.string() }),
  /** A reply the founder received, into the unified pool. */
  z.object({
    action: z.literal("log_reply"),
    draft_id: z.string(),
    confirmed: confirmedSchema,
    notes: z.string().max(4000),
    source: z.string().max(200).default(""),
  }),
]);

/**
 * Tracking for spaces the founder has posted in.
 *
 * A posted comment is the start of a conversation, not the end of a task - the
 * replies are the actual signal. These actions keep the space, let the founder
 * come back to it, and feed anything that comes of it into the same response
 * pool everything else lands in.
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
    const body = parsed.data;

    if (body.action === "check") {
      const { state, report } = await checkTrackedSpace({
        versionId: idea.versionId,
        state: idea.state,
        draftId: body.draft_id,
      });
      return NextResponse.json({ state, report });
    }

    if (body.action === "mark_posted") {
      const now = new Date().toISOString();
      const state = await updateCurrentState(idea.versionId, (s) => ({
        ...s,
        social_engagement: {
          drafted_posts: s.social_engagement.drafted_posts.map((d) =>
            d.id === body.draft_id
              ? {
                  ...d,
                  status: "posted" as const,
                  posted_at: now,
                  posted_url: body.posted_url || d.posted_url,
                }
              : d,
          ),
          drafted_comments: s.social_engagement.drafted_comments.map((d) =>
            d.id === body.draft_id
              ? {
                  ...d,
                  status: "posted" as const,
                  posted_at: now,
                  posted_url: body.posted_url || d.thread_url,
                }
              : d,
          ),
        },
      }));
      return NextResponse.json({ state });
    }

    // log_reply - a real response from a real person, so it counts.
    await db.insert(schema.validationResponses).values({
      ideaStateVersionId: idea.versionId,
      track: idea.state.validation.track ?? "normal",
      channel: "social",
      confirmed: body.confirmed,
      notes: body.notes,
      source: body.source,
    });

    const state = await updateCurrentState(idea.versionId, (s) => {
      const responses = [
        ...s.validation.responses,
        {
          id: randomUUID(),
          confirmed: body.confirmed,
          notes: body.notes,
          source: body.source,
          channel: "social" as const,
          track: s.validation.track ?? ("normal" as const),
          expert_id: null,
          expert_name: null,
          confidence: null,
          created_at: new Date().toISOString(),
        },
      ];

      const bump = <T extends { id: string; replies_logged: number; status: string }>(
        d: T,
      ) =>
        d.id === body.draft_id
          ? {
              ...d,
              replies_logged: d.replies_logged + 1,
              status: "reply_logged" as const,
            }
          : d;

      return {
        ...s,
        validation: {
          ...s.validation,
          responses,
          confirmation_rate: computeConfirmationRate(responses),
        },
        social_engagement: {
          drafted_posts: s.social_engagement.drafted_posts.map(bump),
          drafted_comments: s.social_engagement.drafted_comments.map(bump),
        },
      };
    });

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/social/track]`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "We couldn't update that.",
      },
      { status: 500 },
    );
  }
}
