import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { estimateFastTrack, formatMoney } from "@/lib/pricing";
import { fastTrackPaymentsEnabled, getStripe } from "@/lib/stripe";
import { originFor } from "@/lib/app-url";

export const runtime = "nodejs";

const bodySchema = z.object({
  n: z.number().int().min(1).max(100),
  location_preference: z.string().max(200).default(""),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    if (!fastTrackPaymentsEnabled()) {
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

    if (!idea.state.research_report) {
      return NextResponse.json(
        {
          error:
            "Finish the research step first - the questions are built from it.",
        },
        { status: 409 },
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Choose how many people you want to reach." },
        { status: 400 },
      );
    }

    const existing = await db
      .select()
      .from(schema.fastTrackOrders)
      .where(
        and(
          eq(schema.fastTrackOrders.ideaStateVersionId, idea.versionId),
          eq(schema.fastTrackOrders.paymentStatus, "paid"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error:
            "This round is already paid for. Redo the validation for another round.",
        },
        { status: 409 },
      );
    }

    const tier = idea.state.structured.niche_tier;
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
        locationPreference: parsed.data.location_preference.trim(),
        paymentStatus: "pending",
        status: "pending_sourcing",
      })
      .returning();

    const recordPendingOrder = () =>
      updateCurrentState(idea.versionId, (state) => ({
        ...state,
        fast_track_order: {
          order_id: order.id,
          n_requested: estimate.nRequested,
          cost_per_interview: estimate.costPerInterviewCents,
          analysis_fee: estimate.analysisFeeCents,
          total_cost: estimate.totalCents,
          currency: estimate.currency,
          location_preference: parsed.data.location_preference.trim(),
          status: "pending_sourcing",
          scheduled_count: 0,
          completed_count: 0,
        },
      }));

    const wisePaymentUrl = process.env.WISE_PAYMENT_URL;
    if (wisePaymentUrl) {
      await recordPendingOrder();
      await db
        .update(schema.fastTrackOrders)
        .set({ paymentRef: "wise" })
        .where(eq(schema.fastTrackOrders.id, order.id));

      return NextResponse.json({
        payment_url: wisePaymentUrl,
        order_id: order.id,
        total: formatMoney(estimate.totalCents, estimate.currency),
      });
    }

    const stripe = getStripe();
    const appUrl = originFor(request);
    const lineItems = [
      {
        quantity: estimate.nRequested,
        price_data: {
          currency: estimate.currency,
          unit_amount: estimate.costPerInterviewCents,
          product_data: {
            name: "Validation responses",
            description: `Sourced and run by BRAINS AI - ${idea.title}`,
          },
        },
      },
      ...(estimate.analysisFeeCents > 0
        ? [
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
          ]
        : []),
    ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      customer_email: user.email || undefined,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        idea_id: id,
        idea_state_version_id: idea.versionId,
        user_id: user.id,
      },
      line_items: lineItems,
      return_url: `${appUrl}/ideas/${id}/validation/fast-track/status?session_id={CHECKOUT_SESSION_ID}`,
    });

    await db
      .update(schema.fastTrackOrders)
      .set({ paymentRef: session.id })
      .where(eq(schema.fastTrackOrders.id, order.id));
    await recordPendingOrder();

    return NextResponse.json({
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
