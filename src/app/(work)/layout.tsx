export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

/**
 * Freelancer portal layout - mobile-friendly, task-focused.
 * Gates access to users with FREELANCER role (or higher via hierarchy).
 */
export default async function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("FREELANCER", "/dashboard");

  return <>{children}</>;
}