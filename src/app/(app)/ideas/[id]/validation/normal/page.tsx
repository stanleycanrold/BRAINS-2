import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { estimateFastTrack, formatMoney } from "@/lib/pricing";
import { paymentsEnabled } from "@/lib/stripe";
import { NormalTrack } from "./NormalTrack";

export const metadata: Metadata = { title: "Gathering signal" };

export default async function NormalTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  // Reached directly without picking a track — send them to choose first.
  if (!idea.state.validation.track) redirect(`/ideas/${id}/validation`);

  // Per-interview rate for the teaser. The full itemised total is shown at
  // checkout, where the founder has chosen a quantity and it means something.
  const entry = await estimateFastTrack({
    tier: idea.state.structured.niche_tier,
    n: 5,
  });

  return (
    <NormalTrack
      ideaId={id}
      initialState={idea.state}
      fastTrackPerInterview={formatMoney(entry.costPerInterviewCents, entry.currency)}
      paymentsEnabled={paymentsEnabled()}
    />
  );
}
