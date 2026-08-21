import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/components/AuthLayout";
import { destinationAfterAuth } from "@/lib/auth-redirect";

/**
 * Sign-in carries `?claim=` for the same reason sign-up does.
 *
 * The marketing site only ever links to sign-up, but Clerk's own "already
 * have an account?" link moves people here mid-flow, and a returning founder
 * who has just watched a research pass finish would otherwise lose it on the
 * way through.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; claim?: string; workspace?: string }>;
}) {
  const { draft, claim, workspace } = await searchParams;

  return (
    <AuthLayout title="Welcome back" subtitle="Pick up where you left off.">
      <SignIn forceRedirectUrl={destinationAfterAuth({ draft, claim, workspace })} />
    </AuthLayout>
  );
}
