"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the marketing footer on screens that are meant to behave like the
 * product rather than like a page.
 *
 * The research brief fills the viewport exactly and is not supposed to
 * scroll: its panel scrolls internally instead. A footer below it would add
 * height the layout has already spent, which puts the whole screen a few
 * hundred pixels past the fold and reintroduces the page scroll the design
 * exists to avoid.
 *
 * A client wrapper rather than a second root layout. Next supports multiple
 * root layouts through route groups, but only with no `app/layout.tsx` at
 * all, so adopting them means moving every existing route into a group to
 * change one screen. The footer is static markup and stays a server
 * component: it is passed through as children rather than imported here, so
 * nothing about it becomes client-side.
 */
const APP_LIKE = [/^\/research(\/|$)/];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (APP_LIKE.some((pattern) => pattern.test(pathname))) return null;
  return <>{children}</>;
}
