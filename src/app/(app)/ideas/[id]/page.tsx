import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";

/**
 * B11 - Idea Detail.
 *
 * Rather than a separate read-only record view, this resumes the founder
 * exactly where the idea actually is. Every past stage stays reachable from
 * the pipeline stepper, which is what makes "nothing becomes unreachable"
 * true in practice - so a duplicate summary screen would add a click without
 * adding information.
 */
export default async function IdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  switch (idea.status) {
    case "draft":
    case "researching":
      redirect(`/ideas/${id}/research`);
    case "validating_normal":
      redirect(`/ideas/${id}/validation/normal`);
    case "validating_fast":
      redirect(`/ideas/${id}/validation`);
    case "gate_review":
    case "passed":
    case "killed":
      redirect(`/ideas/${id}/report`);
    case "needs_rework":
      redirect(`/ideas/${id}/versions`);
  }
}
