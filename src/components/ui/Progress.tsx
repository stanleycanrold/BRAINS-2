"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

/**
 * Design system §3.11.
 *
 * The linear bar is the ONE legitimate literal progress bar in the product,
 * because it tracks a real count toward a known total (Fast Track orders).
 * The fraction is always shown as text alongside - never rely on bar length
 * alone.
 */
export function ProgressBar({
  value,
  total,
  label,
  className,
}: {
  value: number;
  total: number;
  label: string;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="type-body-m text-secondary">{label}</span>
        <span className="type-data-m text-primary">
          {value} of {total}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Everywhere else - research agent processing and similar - a narrative status
 * line is used instead, since there is nothing to show a percentage *of* yet
 * (§3.11, §3.13).
 */
export function NarrativeProgress({
  steps,
  activeIndex,
  className,
}: {
  steps: readonly string[];
  activeIndex: number;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)} aria-live="polite">
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li
            key={step}
            className={cn(
              "type-body-l flex items-center gap-3 transition-colors duration-300",
              done && "text-secondary",
              active && "text-primary",
              !done && !active && "text-tertiary",
            )}
          >
            <span className="flex size-5 shrink-0 items-center justify-center">
              {done ? (
                <svg viewBox="0 0 20 20" className="size-5 text-success" aria-hidden="true">
                  <path
                    d="M5 10.5l3.5 3.5L15 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : active ? (
                <Spinner className="size-4 text-brand" />
              ) : (
                <span className="size-1.5 rounded-full bg-current opacity-50" />
              )}
            </span>
            {step}
          </li>
        );
      })}
    </ul>
  );
}
