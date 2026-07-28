import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { isOpsUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { screenResponse } from "@/lib/screening";
import { syncResponsesToState } from "@/lib/data/responses";

export const runtime = "nodejs";

const bodySchema = z.object({
  versionId: z.string().uuid(),
  notes: z.string().min(20).max(20000),
  source: z.string().max(200).default(""),
  confirmed: z.enum(["yes", "no", "unsure"]),
});

/**
 * Logs an interview that was conducted manually.
 *
 * Interviewees are hired outside the product for now, so an interview reaches
 * us as something a person typed up. It still goes through the same quality
 * screen as a public submission, and lands `pending` until a human approves
 * it - our own typing is not evidence of a good interview.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  try {
    if (!(await isOpsUser())) {
      return NextResponse.json({ error: "Not permitted." }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Write up the interview and pick an outcome." },
        { status: 400 },
      );
    }

    const [order] = await db
      .select()
      .from(schema.fastTrackOrders)
      .where(eq(schema.fastTrackOrders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // The order decides which round this belongs to, not the client.
    if (order.ideaStateVersionId !== parsed.data.versionId) {
      return NextResponse.json({ error: "Wrong round." }, { status: 409 });
    }

    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "This order has not been paid for." },
        { status: 409 },
      );
    }

    const [stored] = await db
      .insert(schema.validationResponses)
      .values({
        ideaStateVersionId: order.ideaStateVersionId,
        track: "fast",
        channel: "interview",
        confirmed: parsed.data.confirmed,
        notes: parsed.data.notes,
        source: parsed.data.source || "Fast Track interview",
      })
      .returning();

    await screenResponse({
      responseId: stored.id,
      versionId: order.ideaStateVersionId,
    });

    await syncResponsesToState(order.ideaStateVersionId);

    return NextResponse.json({ ok: true, id: stored.id });
  } catch (err) {
    console.error(`[POST /api/ops/orders/${orderId}/interviews]`, err);
    return NextResponse.json({ error: "That did not save." }, { status: 500 });
  }
}
