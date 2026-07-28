import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { estimateFastTrack } from "@/lib/pricing";
import { TrackSelection } from "./TrackSelection";

export const metadata: Metadata = { title: "Validation" };

export default async function ValidationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  // Already committed to a track — resume the workspace rather than re-asking.
  if (idea.state.validation.track === "normal") {
    redirect(`/ideas/${id}/validation/normal`);
  }

  const estimate = await estimateFastTrack({
    tier: idea.state.structured.niche_tier,
    n: 8,
  });

  return (
    <TrackSelection
      ideaId={id}
      initialState={idea.state}
      initialEstimate={estimate}
      paymentsEnabled={Boolean(process.env.STRIPE_SECRET_KEY)}
    />
  );
}
