import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { sendFastTrackPaymentEmails } from "@/lib/fast-track-email";
import { markOrderPaidManually } from "@/lib/fast-track-fulfil";
import { originFor } from "@/lib/app-url";
import { ideaStateSchema } from "@/lib/domain/types";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await requireUser();
    const idea = await getIdea(id, user.id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }

    const orders = await db
      .select()
      .from(schema.fastTrackOrders)
      .where(
        and(
          eq(schema.fastTrackOrders.ideaStateVersionId, idea.versionId),
          eq(schema.fastTrackOrders.userId, user.id),
        ),
      )
      .orderBy(desc(schema.fastTrackOrders.createdAt))
      .limit(1);

    const order = orders[0];
    if (!order) {
      return NextResponse.json({ error: "No Fast Track order found." }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ paid: true, email_sent: false });
    }

    await markOrderPaidManually(order.id);
    const origin = originFor(_request);
    const [updatedVersion] = await db
      .select()
      .from(schema.ideaStateVersions)
      .where(eq(schema.ideaStateVersions.id, order.ideaStateVersionId))
      .limit(1);
    const updatedState = updatedVersion
      ? ideaStateSchema.parse(updatedVersion.stateJson)
      : idea.state;
    const panelToken = updatedState.validation.questionnaire.panel_share_token;
    const emailSent = await sendFastTrackPaymentEmails({
      customerEmail: user.email,
      ideaTitle: idea.title,
      orderId: order.id,
      nRequested: order.nRequested,
      location: order.locationPreference,
      totalCostCents: order.totalCostCents,
      currency: order.currency,
      questionsEditUrl: `${origin}/ideas/${id}/validation/normal?tab=questions`,
      panelUrl: panelToken ? `${origin}/q/${panelToken}` : null,
      founderWebsite: idea.state.raw_submission.product_link,
    });

    return NextResponse.json({ paid: true, email_sent: emailSent });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/fast-track/payment-done]`, err);
    return NextResponse.json(
      { error: "We couldn't confirm the payment yet. Please try again." },
      { status: 500 },
    );
  }
}