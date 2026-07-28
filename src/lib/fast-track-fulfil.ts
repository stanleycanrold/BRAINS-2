import "server-only";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db, schema } from "@/lib/db";
import { ideaStateSchema } from "@/lib/domain/types";

/**
 * Marking a Fast Track order paid.
 *
 * Two paths reach this: the Stripe webhook (the authority) and the
 * return-from-checkout reconcile call (which covers webhook lag, and local
 * development where nobody is running `stripe listen`). They must agree
 * exactly — an order marked paid down one path but not the other would either
 * charge a founder without queueing work, or queue work without a payment. So
 * the transition lives here once and both callers use it.
 *
 * Callers are responsible for verifying the payment really happened; this
 * function only performs the transition.
 */
export async function markOrderPaid(
  session: Stripe.Checkout.Session,
  orderId: string,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(schema.fastTrackOrders)
    .where(eq(schema.fastTrackOrders.id, orderId))
    .limit(1);

  const order = rows[0];
  if (!order) return false;

  // Idempotency: Stripe may deliver the event more than once, and the
  // reconcile call may race the webhook.
  if (order.paymentStatus === "paid") return true;

  await db
    .update(schema.fastTrackOrders)
    .set({
      paymentStatus: "paid",
      paidAt: new Date(),
      paymentRef: session.payment_intent
        ? String(session.payment_intent)
        : session.id,
      // Payment verified — only NOW does this become an Ops work item.
      status: "scheduling",
    })
    .where(eq(schema.fastTrackOrders.id, orderId));

  await patchIdeaState(order.ideaStateVersionId, "scheduling");
  return true;
}

/** Mirrors order progress onto the idea-state object the UI reads. */
export async function patchIdeaState(
  versionId: string,
  status: "pending_sourcing" | "scheduling" | "in_progress" | "completed",
) {
  const rows = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.id, versionId))
    .limit(1);

  const version = rows[0];
  if (!version) return;

  const state = ideaStateSchema.parse(version.stateJson);
  if (!state.fast_track_order) return;

  const next = {
    ...state,
    fast_track_order: { ...state.fast_track_order, status },
    updated_at: new Date().toISOString(),
  };

  await db
    .update(schema.ideaStateVersions)
    .set({ stateJson: next, updatedAt: new Date() })
    .where(eq(schema.ideaStateVersions.id, versionId));
}
