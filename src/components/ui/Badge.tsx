import * as React from "react";
import { cn } from "@/lib/cn";
import type { IdeaStatus } from "@/lib/domain/types";

/**
 * Design system §3.4 - status badges.
 *
 * Pill (999px radius, one of only two places a filled/full pill is allowed).
 * Always word + color together, never color alone (§Part 5 accessibility).
 */

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "caution"
  | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-neutral-subtle text-secondary",
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-subtle text-success",
  caution: "bg-caution-subtle text-caution",
  danger: "bg-danger-subtle text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot = false,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  /** A small leading dot. Reinforces the tone without relying on color alone. */
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "type-caption inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current opacity-70"
        />
      ) : null}
      {children}
    </span>
  );
}

/** Status label + tone mapping, per §3.4. Single source of truth. */
export const STATUS_META: Record<
  IdeaStatus,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: "Draft", tone: "neutral" },
  researching: { label: "Researching", tone: "neutral" },
  validating_normal: { label: "Validating", tone: "brand" },
  validating_fast: { label: "Validating - Fast Track", tone: "brand" },
  gate_review: { label: "Gate Review", tone: "caution" },
  passed: { label: "Passed", tone: "success" },
  needs_rework: { label: "Needs Rework", tone: "caution" },
  killed: { label: "Killed", tone: "danger" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: IdeaStatus;
  className?: string;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}
