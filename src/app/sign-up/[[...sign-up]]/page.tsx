import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/AuthLayout";

/**
 * `?draft=` arrives from the marketing site when someone typed their idea into
 * the composer there before having an account.
 *
 * Clerk owns the redirect once signup completes, so the draft has to be handed
 * to it as the destination rather than left in this page's URL, where it would
 * be dropped the moment Clerk navigates. With one, we send them to the entry
 * screen with the idea already in the box. Without one, the usual dashboard
 * redirect applies.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { draft } = await searchParams;
  const trimmed = draft?.trim();

  return (
    <AuthLayout
      title="Find out if your idea holds up"
      subtitle="Research, real signal, and a score with the reasoning behind it."
    >
      <SignUp
        forceRedirectUrl={
          trimmed ? `/ideas/new?draft=${encodeURIComponent(trimmed)}` : undefined
        }
      />
    </AuthLayout>
  );
}
