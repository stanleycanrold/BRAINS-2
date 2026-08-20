import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { estimateFastTrack } from "@/lib/pricing";
import { fastTrackPaymentsEnabled } from "@/lib/stripe";
import { validationStage } from "@/lib/validation-stage";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Fast Track checkout" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  if (!fastTrackPaymentsEnabled()) redirect(`/ideas/${id}/validation`);

  // Interviews use the questions built from research, so there's nothing to
  // buy until research has run.
  if (!idea.state.research_report) redirect(`/ideas/${id}/research`);

  // Already paid for this round - there is nothing to buy. The API refuses
  // too (409), but a founder should never reach a payment form for something
  // they already own.
  const stage = validationStage(idea.state);
  if (
    stage === "awaiting_payment" ||
    stage === "underway" ||
    stage === "delivered"
  ) {
    redirect(`/ideas/${id}/validation/fast-track/status`);
  }

  const estimate = await estimateFastTrack({
    tier: idea.state.structured.niche_tier,
    n: idea.state.fast_track_order?.n_requested || 8,
  });

  return (
    <CheckoutView
      ideaId={id}
      state={idea.state}
      initialEstimate={estimate}
    />
  );
}
