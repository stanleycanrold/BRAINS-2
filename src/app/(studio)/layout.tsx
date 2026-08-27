import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { workspaceAccess } from "@/lib/auth";

/**
 * Full-bleed layout for the empirical studio. Unlike the (app) group it does
 * not render the AppShell sidebar - the studio brings its own Navbar - but it
 * keeps the same resource-level auth gate: nothing renders before sign-in.
 */
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId && !(await workspaceAccess())) redirect("/sign-in");

  return <>{children}</>;
}
