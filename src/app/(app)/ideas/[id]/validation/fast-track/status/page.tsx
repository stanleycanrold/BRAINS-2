import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { requireUser, workspaceAccess } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { StatusView } from "./StatusView";
import { wisePaymentLink } from "@/lib/stripe";
import { originFromHeaders } from "@/lib/app-url";

export const metadata: Metadata = { title: "Fast Track status" };

export default async function FastTrackStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const sharedAccess = await workspaceAccess();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  const orders = await db
    .select()
    .from(schema.fastTrackOrders)
    .where(eq(schema.fastTrackOrders.ideaStateVersionId, idea.versionId))
    .orderBy(desc(schema.fastTrackOrders.createdAt))
    .limit(1);

  const order = orders[0];
  if (!order) redirect(`/ideas/${id}/validation`);

  const interviews = await db
    .select()
    .from(schema.fastTrackInterviews)
    .where(eq(schema.fastTrackInterviews.fastTrackOrderId, order.id));

  const origin = await originFromHeaders();
  const panelToken = idea.state.validation.questionnaire.panel_share_token;

  return (
    <StatusView
      ideaId={id}
      state={idea.state}
      order={{
        id: order.id,
        nRequested: order.nRequested,
        totalCostCents: order.totalCostCents,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        locationPreference: order.locationPreference,
        customerEmail: order.customerEmail,
        paymentReportedAt: order.paymentReportedAt?.toISOString() ?? null,
        paidAt: order.paidAt?.toISOString() ?? null,
      }}
      canApprovePayment={!sharedAccess || sharedAccess.userId === user.id}
      scheduled={interviews.filter((i) => i.scheduledAt !== null).length}
      completed={interviews.filter((i) => i.status === "completed").length}
      paymentLink={wisePaymentLink()}
      questionsEditUrl={`${origin}/ideas/${id}/validation/normal?tab=questions`}
      panelUrl={panelToken ? `${origin}/q/${panelToken}` : null}
      founderWebsite={idea.state.raw_submission.product_link}
    />
  );
}
