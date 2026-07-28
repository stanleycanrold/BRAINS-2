import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/AuthLayout";

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Find out if your idea holds up"
      subtitle="Research, real signal, and a score with the reasoning behind it."
    >
      <SignUp />
    </AuthLayout>
  );
}
