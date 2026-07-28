import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Design system §3.12 and §1.7.
 *
 * Second-person invitation with the relevant action inline — never a dead end,
 * and deliberately never a decorative illustration (§Part 6 anti-patterns).
 */
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-dashed border-line px-6 py-10 text-center",
        className,
      )}
    >
      <p className="type-display-m text-primary">{title}</p>
      {children ? (
        <div className="type-body-l mx-auto mt-2 max-w-prose text-secondary">
          {children}
        </div>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Design system §3.13 — per-component skeletons matching the real shape. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded-[6px]", className)}
      {...props}
    />
  );
}
