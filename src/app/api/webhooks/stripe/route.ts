import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { markOrderPaid } from "@/lib/fast-track-fulfil";
import { getStripe, paymentsEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe webhook - the ONLY thing that may mark an order paid (PRD §10).
 *
 * Two rules this endpoint exists to enforce:
 *
 *  1. Every payload is signature-verified against STRIPE_WEBHOOK_SECRET.
 *     Without that check anyone who knows the URL could POST a fabricated
 *     "payment succeeded" and get interviews for free.
 *
 *  2. It is idempotent. Stripe retries on any non-2xx and can deliver the same
 *     event more than once, so an already-paid order is left alone rather than
 *     re-processed.
 *
 * This route is deliberately excluded from auth - Stripe cannot sign in, and
 * the signature IS the authentication.
 */
export async function POST(request: Request) {
  if (!paymentsEnabled()) {
    return NextResponse.json({ error: "Payments not configured." }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Refuse rather than trust an unverified payload. Failing closed here is
    // the whole point of the endpoint.
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // The raw body is required - any parsing or re-serialising breaks the HMAC.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          await handlePaidSession(session);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded":
        await handlePaidSession(event.data.object);
        break;

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await markOrderFailed(event.data.object);
        break;

      default:
        // Unhandled types are acknowledged so Stripe stops retrying them.
        break;
    }
  } catch (err) {
    // A 500 tells Stripe to retry, which is what we want for a transient
    // database failure - the event is not lost.
    console.error(`[stripe webhook] handling ${event.type} failed`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaidSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.error("[stripe webhook] session without order_id", session.id);
    return;
  }

  // Shared with the return-from-checkout reconcile path so the two can't
  // disagree about what "paid" means - see fast-track-fulfil.
  const done = await markOrderPaid(session, orderId);
  if (!done) console.error("[stripe webhook] unknown order", orderId);
}

async function markOrderFailed(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const rows = await db
    .select()
    .from(schema.fastTrackOrders)
    .where(eq(schema.fastTrackOrders.id, orderId))
    .limit(1);

  // Never downgrade an order that already paid - a later `expired` event for a
  // superseded session must not undo a successful payment.
  if (!rows[0] || rows[0].paymentStatus === "paid") return;

  await db
    .update(schema.fastTrackOrders)
    .set({ paymentStatus: "failed" })
    .where(eq(schema.fastTrackOrders.id, orderId));
}
