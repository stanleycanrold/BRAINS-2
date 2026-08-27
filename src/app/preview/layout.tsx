import type { Metadata } from "next";

export const metadata: Metadata = { title: "Preview — BRAINS Dashboard Studio" };

// No auth gate — isolated design preview, does not touch (studio) or (app) layouts
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
