import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { formatMoney, marketingFloorPerInterview } from "@/lib/pricing";
import { validationStage } from "@/lib/validation-stage";
import { fastTrackPaymentsEnabled } from "@/lib/stripe";
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

  /**
   * Already committed, so resume rather than re-asking.
   *
   * A paid round goes to the workspace, not to its order status. Paying for
   * interviews buys extra reach; it does not mean giving up the share link,
   * the communities or logging conversations you have yourself. Everything
   * lands in one pool and is scored together, so closing those off would make
   * the paid option worse than the free one. Order progress stays one click
   * away from the top bar.
   */
  const stage = validationStage(idea.state);
  if (stage === "awaiting_payment") {
    redirect(`/ideas/${id}/validation/fast-track/status`);
  }

  if (
    stage === "underway" ||
    stage === "delivered" ||
    idea.state.validation.track === "normal"
  ) {
    redirect(`/ideas/${id}/validation/normal`);
  }

  const floor = await marketingFloorPerInterview();

  return (
    <TrackSelection
      ideaId={id}
      initialState={idea.state}
      floorPerInterview={formatMoney(floor.cents, floor.currency)}
      paymentsEnabled={fastTrackPaymentsEnabled()}
    />
  );
}
