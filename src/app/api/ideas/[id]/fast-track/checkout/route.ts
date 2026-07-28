import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { estimateFastTrack, formatMoney } from "@/lib/pricing";
import { getStripe, paymentsEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

const bodySchema = z.object({ n: z.number().int().min(1).max(100) });

/**
 * POST /ideas/:id/fast-track/order — create the order, then a Checkout Session.
 *
 * Ordering matters here and is a PRD requirement (§10 payment safety):
 * the order row is written FIRST with payment_status `pending` and status
 * `pending_sourcing`, and nothing downstream treats it as actionable until the
 * webhook verifies payment. No expert is contacted, and no cost incurred, on
 * the strength of a redirect the client could have faked.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    if (!paymentsEnabled()) {
      return NextResponse.json(
        { error: "Payments aren't configured yet." },
        { status: 503 },
      );
    }

    const user = await requireUser();
    const idea = await getIdea(id, user.id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }

    /**
     * Interviews run against the questions generated from THIS idea's
     * research. Without a completed research pass there is no problem
     * statement to build questions from, so an order here would buy
     * interviews with nothing to ask.
     */
    if (!idea.state.research_report) {
      return NextResponse.json(
        {
          error:
            "Finish the research step first — the interview questions are built from it.",
        },
        { status: 409 },
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Choose how many interviews you want." },
        { status: 400 },
      );
    }

    const tier = idea.state.structured.niche_tier;
    // Priced server-side from pricing_config — never from a client-supplied
    // amount, which would let anyone name their own price.
    const estimate = await estimateFastTrack({ tier, n: parsed.data.n });

    const [order] = await db
      .insert(schema.fastTrackOrders)
      .values({
        ideaStateVersionId: idea.versionId,
        userId: user.id,
        nRequested: estimate.nRequested,
        costPerInterviewCents: estimate.costPerInterviewCents,
        analysisFeeCents: estimate.analysisFeeCents,
        totalCostCents: estimate.totalCents,
        currency: estimate.currency,
        nicheTier: tier,
        paymentStatus: "pending",
        status: "pending_sourcing",
      })
      .returning();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      /**
       * Embedded, not redirect.
       *
       * The founder stays inside the product through payment, which matters
       * at this point in the flow — they've just spent time on questions and
       * a hand-off to a different domain is where people reconsider. Stripe
       * still renders and owns the card fields inside the iframe, so no card
       * data touches our servers and PCI scope stays SAQ-A. Building our own
       * form with the Payment Element would buy visual control we don't need
       * and take on obligations we'd rather not.
       */
      ui_mode: "embedded_page",
      customer_email: user.email || undefined,
      client_reference_id: order.id,
      // The webhook trusts this metadata, not the client.
      metadata: {
        order_id: order.id,
        idea_id: id,
        idea_state_version_id: idea.versionId,
        user_id: user.id,
      },
      line_items: [
        {
          quantity: estimate.nRequested,
          price_data: {
            currency: estimate.currency,
            unit_amount: estimate.costPerInterviewCents,
            product_data: {
              name: "Fast Track interview",
              description: `Sourced and run by BRAINS AI — ${idea.title}`,
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: estimate.currency,
            unit_amount: estimate.analysisFeeCents,
            product_data: {
              name: "Analysis & synthesis",
              description:
                "Cross-channel synthesis, scoring, and your validation report",
            },
          },
        },
      ],
      // Embedded mode uses a single return_url instead of success/cancel.
      return_url: `${appUrl}/ideas/${id}/validation/fast-track/status?session_id={CHECKOUT_SESSION_ID}`,
    });

    await db
      .update(schema.fastTrackOrders)
      .set({ paymentRef: session.id })
      .where(eq(schema.fastTrackOrders.id, order.id));

    // Reflect the pending order on the idea so the UI can show the tracker
    // even if the founder abandons the Stripe page and comes back.
    await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      status: "validating_fast",
      validation: { ...s.validation, track: "fast" },
      fast_track_order: {
        order_id: order.id,
        n_requested: estimate.nRequested,
        cost_per_interview: estimate.costPerInterviewCents,
        analysis_fee: estimate.analysisFeeCents,
        total_cost: estimate.totalCents,
        currency: estimate.currency,
        status: "pending_sourcing",
        scheduled_count: 0,
        completed_count: 0,
      },
    }));

    return NextResponse.json({
      // The client secret mounts the embedded form; there is no URL to visit.
      client_secret: session.client_secret,
      order_id: order.id,
      total: formatMoney(estimate.totalCents, estimate.currency),
    });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/fast-track/checkout]`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "We couldn't start checkout. You haven't been charged.",
      },
      { status: 500 },
    );
  }
}
