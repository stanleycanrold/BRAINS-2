import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { formatMoney, marketingFloorPerInterview } from "@/lib/pricing";
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

  // Reached directly without picking a track - send them to choose first.
  if (!idea.state.validation.track) redirect(`/ideas/${id}/validation`);

  // The floor across tiers, which is what every marketing surface quotes so
  // the offer never appears at two prices. The real rate for this idea is
  // itemised at checkout.
  const floor = await marketingFloorPerInterview();

  return (
    <NormalTrack
      ideaId={id}
      initialState={idea.state}
      fastTrackPerInterview={formatMoney(floor.cents, floor.currency)}
      paymentsEnabled={paymentsEnabled()}
    />
  );
}
