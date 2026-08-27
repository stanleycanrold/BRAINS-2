import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard Copy — BRAINS (Preview)" };

// No auth — isolated preview copy
export default function DashboardCopyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
