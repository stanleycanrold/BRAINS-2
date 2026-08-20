import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { estimateFastTrack, formatMoney } from "@/lib/pricing";
import { fastTrackPaymentsEnabled, paymentContactEmail } from "@/lib/stripe";

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

    const subject = encodeURIComponent(`BRAINS AI payment for ${idea.title}`);
    const message = encodeURIComponent(
      [
        "Hi, I would like to complete payment for my BRAINS AI validation round.",
        "",
        `Idea: ${idea.title}`,
        `People requested: ${estimate.nRequested}`,
        `Location: ${location || "Anywhere"}`,
        `Total: ${formatMoney(estimate.totalCents, estimate.currency)}`,
        `Order reference: ${order.id}`,
        "",
        "Please send me the payment link and next steps.",
      ].join("\n"),
    );

    return NextResponse.json({
      contact_url: `mailto:${paymentContactEmail()}?subject=${subject}&body=${message}`,
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
