import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { estimateFastTrack, formatMoney } from "@/lib/pricing";
import {
  emailFromAddress,
  fastTrackPaymentsEnabled,
  paymentContactEmail,
} from "@/lib/stripe";

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
        { error: "Payment contact is not configured yet." },
        { status: 503 },
      );
    }

    const user = await requireUser();
    if (!user.email) {
      return NextResponse.json(
        { error: "Your account needs an email address before we can send payment details." },
        { status: 400 },
      );
    }
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

    const estimate = await estimateFastTrack({
      tier: idea.state.structured.niche_tier,
      n: parsed.data.n,
    });
    const location = parsed.data.location_preference.trim();
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
        nicheTier: idea.state.structured.niche_tier,
        locationPreference: location,
        paymentStatus: "pending",
        status: "pending_sourcing",
      })
      .returning();

    await updateCurrentState(idea.versionId, (state) => ({
      ...state,
      fast_track_order: {
        order_id: order.id,
        n_requested: estimate.nRequested,
        cost_per_interview: estimate.costPerInterviewCents,
        analysis_fee: estimate.analysisFeeCents,
        total_cost: estimate.totalCents,
        currency: estimate.currency,
        location_preference: location,
        status: "pending_sourcing",
        scheduled_count: 0,
        completed_count: 0,
      },
    }));

    await db
      .update(schema.fastTrackOrders)
      .set({ paymentRef: "contact" })
      .where(eq(schema.fastTrackOrders.id, order.id));

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFromAddress(),
        to: [user.email],
        cc: [paymentContactEmail()],
        subject: `Your BRAINS AI payment details: ${idea.title}`,
        text: [
          "Your BRAINS AI validation round is ready to arrange.",
          "",
          "We will begin after your payment is confirmed.",
          "",
          `Validation idea: ${idea.title}`,
          `People requested: ${estimate.nRequested}`,
          `Location: ${location || "Anywhere"}`,
          `Amount to pay: ${formatMoney(estimate.totalCents, estimate.currency)}`,
          `Order reference: ${order.id}`,
          "",
          `Complete payment here: ${process.env.WISE_PAYMENT_URL}`,
          "",
          "Once payment is complete, reply to this email or send your confirmation so we can begin sourcing responses.",
        ].join("\n"),
      }),
    });

    if (!emailResponse.ok) {
      const details = await emailResponse.text();
      console.error("[Fast Track payment email]", details);
      return NextResponse.json(
        { error: "We saved your request, but could not notify the team. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      submitted: true,
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
            : "We couldn't prepare the payment request.",
      },
      { status: 500 },
    );
  }
}
