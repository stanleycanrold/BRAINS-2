import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { claimAnonIdea } from "@/lib/anon";

/**
 * Where Clerk lands someone who ran their research before making an account.
 *
 * The screen has no UI because it should never be seen: claim, then redirect
 * to the brief. A visitor who has just watched a ninety second research pass
 * and read the report should arrive back at that report owning it, not at an
 * empty dashboard, and certainly not at a fresh composer that runs the whole
 * thing again.
 *
 * Server side and behind `requireUser`, so the account exists before anything
 * changes hands, and the ownership check lives in `claimAnonIdea` rather than
 * in a route parameter.
 *
 * An unclaimable token is not an error worth showing. It means the link was
 * mistyped, or someone else got there first, or the run was already claimed
 * and this is a back button. In every one of those cases the useful thing is
 * the dashboard, not an explanation.
 */
export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await requireUser();

  const ideaId = await claimAnonIdea(token, user.id);
  redirect(ideaId ? `/ideas/${ideaId}/research` : "/dashboard");
}
