"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * The `<main>` element, with the mobile gutter applied only where it belongs.
 *
 * That gutter exists to clear the sticky mobile call-to-action bar, which
 * would otherwise cover the last element on a page. It was applied to every
 * route, including the research brief, which sizes itself to exactly the
 * viewport minus the nav. The arithmetic on a phone came out as
 * `72 + (100dvh - 72) + 80`, so the one screen deliberately built not to
 * scroll scrolled by precisely the height of a bar that route never renders.
 *
 * Keyed off the same route list as `ChromeGate`, and kept next to it, because
 * these two are one decision: this screen is a workspace, so it gets none of
 * the page chrome.
 */
const APP_LIKE = [/^\/research(\/|$)/];

export function MainRegion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const appLike = APP_LIKE.some((pattern) => pattern.test(pathname));

  return (
    <main
      id="main"
      className={cn("min-h-0 flex-1", !appLike && "pb-20 md:pb-0")}
    >
      {children}
    </main>
  );
}
