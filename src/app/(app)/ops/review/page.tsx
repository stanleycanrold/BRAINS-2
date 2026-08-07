import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { isOpsUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { EmptyState } from "@/components/ui/EmptyState";
import { OpsTopBar } from "../OpsTopBar";
import { ReviewQueue, type QueueItem } from "./ReviewQueue";

export const metadata: Metadata = { title: "Response review" };

/**
 * The evaluator's queue: every response, in every state, across every idea.
 *
 * This screen is load-bearing rather than a convenience. Founders are now
 * shown approved responses only - an unreviewed answer is not their evidence
 * and a rejected one never will be - which means a response sitting pending
 * is invisible to the one person who would otherwise have chased it. Two
 * SafeSpark responses did exactly that for hours after a screening run failed
 * silently, and nothing anywhere said so.
 *
 * Pending first, and never paginated away, because the cost of a missed
 * response is a founder deciding on nine answers when eleven came in.
 */
export default async function OpsReviewPage() {
  if (!(await isOpsUser())) redirect("/dashboard");

  const rows = await db
    .select({
      id: schema.validationResponses.id,
      versionId: schema.validationResponses.ideaStateVersionId,
      confirmed: schema.validationResponses.confirmed,
      channel: schema.validationResponses.channel,
      track: schema.validationResponses.track,
      notes: schema.validationResponses.notes,
      source: schema.validationResponses.source,
      reviewStatus: schema.validationResponses.reviewStatus,
      qualityFlags: schema.validationResponses.qualityFlags,
      qualityReasoning: schema.validationResponses.qualityReasoning,
      qualityConfidence: schema.validationResponses.qualityConfidence,
      reviewedBy: schema.validationResponses.reviewedBy,
      createdAt: schema.validationResponses.createdAt,
      ideaId: schema.ideas.id,
      ideaTitle: schema.ideas.title,
    })
    .from(schema.validationResponses)
    .innerJoin(
      schema.ideaStateVersions,
      eq(
        schema.ideaStateVersions.id,
        schema.validationResponses.ideaStateVersionId,
      ),
    )
    .innerJoin(schema.ideas, eq(schema.ideas.id, schema.ideaStateVersions.ideaId))
    .orderBy(desc(schema.validationResponses.createdAt))
    .limit(500);

  const items: QueueItem[] = rows.map((row) => ({
    id: row.id,
    versionId: row.versionId,
    ideaId: row.ideaId,
    ideaTitle: row.ideaTitle,
    confirmed: row.confirmed,
    channel: row.channel,
    track: row.track,
    notes: row.notes,
    source: row.source,
    reviewStatus: row.reviewStatus,
    qualityFlags: row.qualityFlags,
    qualityReasoning: row.qualityReasoning,
    qualityConfidence: row.qualityConfidence,
    reviewedBy: row.reviewedBy,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <>
      <OpsTopBar />

      <header>
        <h1 className="type-display-l text-primary">Response review</h1>
        <p className="type-body-l mt-1 max-w-[70ch] text-secondary">
          Every response, in every state. Founders see only what is approved
          here, so anything left pending is evidence nobody is looking at.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState title="No responses yet" className="mt-8">
          Responses appear here the moment a tester submits one.
        </EmptyState>
      ) : (
        <ReviewQueue items={items} className="mt-8" />
      )}
    </>
  );
}
