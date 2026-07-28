import "server-only";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { updateCurrentState } from "@/lib/data/ideas";
import { computeConfirmationRate } from "@/lib/domain/types";

/**
 * Rebuilds a round's responses in idea-state from the response table.
 *
 * The table is the source of truth; idea-state holds a copy because every
 * agent reads from that one object. Two places writing the same facts is how
 * they drift, so anything that changes a response - logging one, approving
 * one, overturning the screen - calls this rather than editing the copy by
 * hand. The confirmation rate is recomputed here for the same reason.
 */
export async function syncResponsesToState(versionId: string): Promise<void> {
  const rows = await db
    .select()
    .from(schema.validationResponses)
    .where(eq(schema.validationResponses.ideaStateVersionId, versionId))
    .orderBy(asc(schema.validationResponses.createdAt));

  await updateCurrentState(versionId, (state) => {
    const responses = rows.map((r) => ({
      id: r.id,
      confirmed: r.confirmed,
      notes: r.notes,
      source: r.source,
      channel: r.channel,
      track: r.track,
      expert_id: r.expertId,
      expert_name: null,
      confidence: r.confidence,
      review_status: r.reviewStatus,
      quality_flags: r.qualityFlags ?? [],
      created_at: r.createdAt.toISOString(),
    }));

    return {
      ...state,
      validation: {
        ...state.validation,
        responses,
        confirmation_rate: computeConfirmationRate(responses),
      },
    };
  });
}
