import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/components/AuthLayout";

export default function SignInPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Pick up where you left off."
    >
      <SignIn />
    </AuthLayout>
  );
}
