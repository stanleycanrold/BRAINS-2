import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { getStripe, paymentsEnabled } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/fast-track-fulfil";

export const runtime = "nodejs";

const bodySchema = z.object({ session_id: z.string().min(8) });

/**
 * Confirms a return from embedded checkout by asking Stripe directly.
 *
 * The webhook remains the authority and the only thing that can mark an order
 * paid in the general case — but a webhook can take seconds to arrive, or be
 * missing entirely in local development where nobody is running `stripe
 * listen`. Without this the founder returns from a successful payment and
 * stares at "awaiting confirmation".
 *
 * This is safe because it never trusts the client's claim: it takes only a
 * session id, asks Stripe what actually happened, and verifies the session
 * belongs to an order owned by this user.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    if (!paymentsEnabled()) {
      return NextResponse.json({ paid: false });
    }

    const user = await requireUser();
    const idea = await getIdea(id, user.id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session." }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.retrieve(
      parsed.data.session_id,
    );

    const orderId = session.metadata?.order_id;
    if (!orderId) return NextResponse.json({ paid: false });

    const rows = await db
      .select()
      .from(schema.fastTrackOrders)
      .where(eq(schema.fastTrackOrders.id, orderId))
      .limit(1);

    const order = rows[0];
    // Ownership check: a session id alone must never be enough to move
    // somebody else's order.
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ paid: false });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ paid: true });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ paid: false });
    }

    // Same transition the webhook performs — see fast-track-fulfil.
    await markOrderPaid(session, orderId);

    return NextResponse.json({ paid: true });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/fast-track/reconcile]`, err);
    return NextResponse.json({ paid: false });
  }
}
