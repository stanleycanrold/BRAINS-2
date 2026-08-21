import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/AuthLayout";
import { destinationAfterAuth } from "@/lib/auth-redirect";

/**
 * Two things can arrive from the marketing site, and they are not the same.
 *
 * `?claim=` is a research run that has already happened. The visitor watched
 * it finish and read the brief before deciding to sign up, so the run is
 * handed to their new account and they land back on it.
 *
 * `?draft=` is only the text they typed, from a composer on a page that did
 * not run anything. That seeds the entry screen instead.
 *
 * Clerk owns the redirect once signup completes, so whichever it is has to be
 * handed over as the destination rather than left in this page's URL, where
 * it would be dropped the moment Clerk navigates.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; claim?: string; workspace?: string }>;
}) {
  const { draft, claim, workspace } = await searchParams;

  return (
    <AuthLayout
      title="Find out if your idea holds up"
      subtitle="Research, real signal, and a score with the reasoning behind it."
    >
      <SignUp forceRedirectUrl={destinationAfterAuth({ draft, claim, workspace })} />
    </AuthLayout>
  );
}
