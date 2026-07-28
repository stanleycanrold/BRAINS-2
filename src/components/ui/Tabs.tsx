"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Design system §3.9 - underline style, not pill/boxed.
 *
 * Deliberately distinct from the segmented control and status badges, which
 * are the only two places filled pills appear in the product.
 */

export function TabList({
  children,
  className,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        // No rule under the strip. The active tab's own underline already
        // says which one is selected, and a full-width line on top of that
        // just draws a bar across the workspace.
        "flex gap-6 overflow-x-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

const tabClasses = (active: boolean) =>
  cn(
    "type-body-m relative -mb-px shrink-0 border-b-2 px-0.5 pb-3 font-medium whitespace-nowrap",
    "transition-colors duration-[120ms] ease-out",
    active
      ? "border-brand text-primary"
      : "border-transparent text-secondary hover:text-primary",
  );

export function Tab({
  active,
  onClick,
  children,
  count,
  id,
  controls,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  id?: string;
  controls?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-controls={controls}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={tabClasses(active)}
    >
      {children}
      {typeof count === "number" ? (
        <span
          className={cn(
            "ml-2 rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums",
            active ? "bg-brand-subtle text-brand" : "bg-inset text-secondary",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/** Tab-styled links, for tabs that are real routes rather than local state. */
export function TabLink({
  href,
  active,
  children,
  count,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={tabClasses(active)}
    >
      {children}
      {typeof count === "number" ? (
        <span
          className={cn(
            "ml-2 rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums",
            active ? "bg-brand-subtle text-brand" : "bg-inset text-secondary",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function TabPanel({
  id,
  labelledBy,
  children,
  className,
}: {
  id?: string;
  labelledBy?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      tabIndex={0}
      className={cn("focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}
