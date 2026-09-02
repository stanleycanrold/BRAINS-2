"use client";

import * as React from "react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

/**
 * Mobile-only sticky CTA (UX guide, Part 11).
 *
 * Desktop leans on the sticky header's Sign up button. A phone header is too
 * small to carry that same weight once it condenses, so the bottom bar picks
 * it up instead - but only after the hero has scrolled past, so it never
 * covers the composer it is trying to send people to.
 */
export function MobileCta({ onContact }: { onContact?: () => void }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-page/95 px-4 py-3 backdrop-blur-md md:hidden",
        "transition-transform duration-200",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <Button
        onClick={onContact}
        variant="primary"
        className="w-full"
        tabIndex={visible ? undefined : -1}
      >
        Contact us
      </Button>
    </div>
  );
}
