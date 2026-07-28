import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createIdea } from "@/lib/data/ideas";
import { stageAtEntrySchema } from "@/lib/domain/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  description: z.string().min(40),
  target_audience: z.string().min(1),
  stage_at_entry: stageAtEntrySchema,
  product_link: z.string().nullable().default(null),
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

    const idea = await createIdea({
      userId: user.id,
      stageAtEntry: parsed.data.stage_at_entry,
      rawSubmission: {
        description: parsed.data.description,
        target_audience: parsed.data.target_audience,
        product_link: parsed.data.product_link,
        attachments: [],
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
