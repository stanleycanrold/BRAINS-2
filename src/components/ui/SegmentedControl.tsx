"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Design system §3.2.
 *
 * Pill container with the selected segment filled in the brand colour. This is
 * the only non-status, non-badge use of a filled pill in the entire product —
 * reserved deliberately, so a full-radius pill always means "status or
 * selector" and never decoration.
 *
 * Implemented as a radiogroup so arrow keys move between options, per the
 * WAI-ARIA radio pattern.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
  className,
  ariaLabel,
}: {
  options: readonly { value: T; label: string; hint?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  name: string;
  className?: string;
  ariaLabel: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const dir =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (dir === 0) return;
    e.preventDefault();
    const next = (index + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full flex-col gap-1 rounded-full border border-line bg-inset p-1 sm:flex-row",
        className,
      )}
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            name={name}
            tabIndex={selected || (!value && i === 0) ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(option.value)}
            className={cn(
              "type-body-m flex-1 rounded-full px-4 py-2 font-medium",
              "transition-colors duration-[120ms] ease-out",
              selected
                ? "bg-brand text-on-accent"
                : "text-secondary hover:bg-wash-hover hover:text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
