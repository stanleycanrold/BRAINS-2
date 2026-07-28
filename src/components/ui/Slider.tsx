"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Design system §3.2 - the Fast Track N selector.
 *
 * Track in the default border colour, filled portion in the brand, white
 * handle. The live estimate updates next to it in real time; there is
 * deliberately no separate "calculate" step.
 *
 * Built on a native range input so keyboard, touch and screen-reader support
 * come for free - the visuals are layered underneath it.
 */
export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  ariaLabel,
  className,
  disabled,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex h-6 w-full items-center", className)}>
      {/* Track */}
      <div className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-line" />
      {/* Filled portion */}
      <div
        className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-brand"
        style={{ width: `${pct}%` }}
      />
      {/* Handle */}
      <div
        className={cn(
          "pointer-events-none absolute size-5 -translate-x-1/2 rounded-full",
          "border-2 border-brand bg-raised shadow-[var(--shadow-raised)]",
          disabled && "opacity-50",
        )}
        style={{ left: `calc(${pct}% )`, marginLeft: `${(0.5 - pct / 100) * 20}px` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-x-0 h-6 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}
