import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";
import { StatusView } from "./StatusView";
import { wisePaymentLink } from "@/lib/stripe";

export const metadata: Metadata = { title: "Fast Track status" };

export default async function FastTrackStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
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
        paidAt: order.paidAt?.toISOString() ?? null,
      }}
      scheduled={interviews.filter((i) => i.scheduledAt !== null).length}
      completed={interviews.filter((i) => i.status === "completed").length}
      paymentLink={wisePaymentLink()}
    />
  );
}
