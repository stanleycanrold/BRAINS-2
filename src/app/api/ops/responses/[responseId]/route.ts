import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { isOpsUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { syncResponsesToState } from "@/lib/data/responses";

export const runtime = "nodejs";

const bodySchema = z.object({
  review_status: z.enum(["approved", "rejected", "pending"]),
  versionId: z.string().uuid(),
});

/**
 * A human's verdict on a response, which overrides the machine's.
 *
 * Recorded with who decided and when, because "why is this response counting"
 * is a question that gets asked months later. The response itself is never
 * altered or removed - only whether it counts.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ responseId: string }> },
) {
  const { responseId } = await params;

  try {
    if (!(await isOpsUser())) {
      return NextResponse.json({ error: "Not permitted." }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const user = await currentUser();

    await db
      .update(schema.validationResponses)
      .set({
        reviewStatus: parsed.data.review_status,
        reviewedAt: new Date(),
        reviewedBy: user?.emailAddresses[0]?.emailAddress ?? "ops",
      })
      .where(eq(schema.validationResponses.id, responseId));

    await syncResponsesToState(parsed.data.versionId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[PATCH /api/ops/responses/${responseId}]`, err);
    return NextResponse.json({ error: "That did not save." }, { status: 500 });
  }
}
