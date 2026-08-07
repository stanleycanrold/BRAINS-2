import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createIdea, listIdeas } from "@/lib/data/ideas";
import { describeIdeaProblem } from "@/lib/domain/limits";
import { stageAtEntrySchema } from "@/lib/domain/types";
import {
  descriptionSimilarity,
  DUPLICATE_THRESHOLD,
} from "@/lib/domain/similarity";

export const runtime = "nodejs";

const bodySchema = z.object({
  description: z.string(),
  target_audience: z.string().min(1),
  stage_at_entry: stageAtEntrySchema,
  product_link: z.string().nullable().default(null),
  location_focus: z.string().max(200).default(""),
  /** Set once the founder has been shown a near-duplicate and chosen anyway. */
  allow_duplicate: z.boolean().default(false),
  attachments: z
    .array(
      z.object({
        name: z.string().max(300),
        excerpt: z.string().max(20000).default(""),
      }),
    )
    .max(10)
    .default([]),
});

/**
 * POST /ideas - create an idea from the entry-point submission (PRD §8).
 *
 * The record is written and returned immediately; research runs afterwards on
 * its own endpoint. That ordering is the acceptance criterion from §4.1: no
 * submission is ever lost to a failed agent call.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the form - some details are missing or too short." },
        { status: 400 },
      );
    }

    // The same rule the composer applies, applied where it counts.
    const problem = describeIdeaProblem(parsed.data.description);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    /**
     * Catch an edit that came in as a new idea.
     *
     * Editing the wording and resubmitting through the entry screen produces a
     * second workspace holding the same idea, and the responses then split
     * across the two with nothing saying so. This is a prompt rather than a
     * refusal: it names the existing idea and lets the founder open it, or
     * carry on and create a separate one.
     */
    if (!parsed.data.allow_duplicate) {
      const existing = await listIdeas(user.id);
      const match = existing
        .filter((candidate) => !candidate.archived)
        .map((candidate) => ({
          candidate,
          score: descriptionSimilarity(
            parsed.data.description,
            candidate.state.raw_submission.description,
          ),
        }))
        .sort((a, b) => b.score - a.score)[0];

      if (match && match.score >= DUPLICATE_THRESHOLD) {
        return NextResponse.json(
          {
            duplicate: {
              id: match.candidate.id,
              title: match.candidate.title,
              similarity: Math.round(match.score * 100),
            },
          },
          { status: 409 },
        );
      }
    }

    const idea = await createIdea({
      userId: user.id,
      stageAtEntry: parsed.data.stage_at_entry,
      rawSubmission: {
        description: parsed.data.description,
        target_audience: parsed.data.target_audience,
        product_link: parsed.data.product_link,
        location_focus: parsed.data.location_focus,
        attachments: parsed.data.attachments,
      },
    });

    return NextResponse.json({ id: idea.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/ideas]", err);
    return NextResponse.json(
      { error: "We couldn't save your idea. Try again." },
      { status: 500 },
    );
  }
}
