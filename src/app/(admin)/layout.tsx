export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

/**
 * Admin portal layout - reviewer + admin tools.
 * Gates access to users with ADMIN role.
 * Day one: ADMIN = REVIEWER + FREELANCER abilities.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN", "/dashboard");

  return <>{children}</>;
}