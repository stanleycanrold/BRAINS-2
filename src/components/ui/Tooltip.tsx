"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Design system §3.10.
 *
 * The one element that deliberately does NOT invert with the theme - a tooltip
 * should always read as an overlay sitting above the interface, so it keeps a
 * dark background in both themes. 400ms hover delay so it never fires while
 * someone is simply moving the pointer across the screen.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  delay,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  /**
   * `right` exists for the collapsed nav rail: a 56px column has no room for
   * a centred tooltip above or below an icon, so the label was rendering
   * clipped against the rail's own edge. Placing it beside the icon puts it
   * over the canvas, where there's space for it.
   */
  side?: "top" | "bottom" | "right";
  /** Shorter in nav contexts, where the label IS the affordance. */
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = React.useId();

  // A rail icon with no label needs its tooltip almost immediately - waiting
  // 400ms there reads as the UI being unresponsive rather than considerate.
  const openDelay = delay ?? (side === "right" ? 120 : 400);

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), openDelay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (!content) return <>{children}</>;

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={() => setVisible(true)}
      onBlur={hide}
    >
      <span aria-describedby={visible ? id : undefined} className="inline-flex">
        {children}
      </span>
      {visible ? (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "type-caption pointer-events-none absolute z-50 w-max max-w-[260px]",
            "rounded-[6px] bg-[#14181f] px-2.5 py-1.5 text-white shadow-[var(--shadow-overlay)]",
            side === "right"
              ? "top-1/2 left-[calc(100%+10px)] -translate-y-1/2 text-left"
              : cn(
                  "left-1/2 -translate-x-1/2 text-center",
                  side === "top"
                    ? "bottom-[calc(100%+6px)]"
                    : "top-[calc(100%+6px)]",
                ),
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
