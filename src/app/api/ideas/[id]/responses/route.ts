import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import {
  channelSchema,
  computeConfirmationRate,
  confirmedSchema,
} from "@/lib/domain/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  confirmed: confirmedSchema,
  channel: channelSchema,
  notes: z.string().max(4000).default(""),
  source: z.string().max(300).default(""),
});

/**
 * POST /ideas/:id/responses — log a response into the UNIFIED pool (PRD §7).
 *
 * Every response lands here regardless of origin — self-run interview, survey,
 * or a reply logged from social. The Decision Gate always synthesises across
 * channels together rather than per-channel, so there is deliberately one
 * table and one array, not three.
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
      return NextResponse.json(
        { error: "Pick whether they confirmed the problem before saving." },
        { status: 400 },
      );
    }

    const track = idea.state.validation.track ?? "normal";
    const now = new Date().toISOString();

    // Relational row for reporting and cross-idea analysis…
    await db.insert(schema.validationResponses).values({
      ideaStateVersionId: idea.versionId,
      track,
      channel: parsed.data.channel,
      confirmed: parsed.data.confirmed,
      notes: parsed.data.notes,
      source: parsed.data.source,
    });

    // …and into the idea-state object every agent reads from.
    const state = await updateCurrentState(idea.versionId, (s) => {
      const responses = [
        ...s.validation.responses,
        {
          id: randomUUID(),
          confirmed: parsed.data.confirmed,
          notes: parsed.data.notes,
          source: parsed.data.source,
          channel: parsed.data.channel,
          track,
          expert_id: null,
          expert_name: null,
          confidence: null,
          created_at: now,
        },
      ];

      return {
        ...s,
        validation: {
          ...s.validation,
          responses,
          confirmation_rate: computeConfirmationRate(responses),
        },
      };
    });

    return NextResponse.json({ state });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/responses]`, err);
    return NextResponse.json(
      { error: "We couldn't log that response." },
      { status: 500 },
    );
  }
}
