"use client";

import * as React from "react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/** Design system §3.2 — 18px, brand fill + white check when selected. */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-[18px] cursor-pointer appearance-none rounded-[4px] border-[1.5px] border-line bg-raised transition-colors duration-[120ms] checked:border-brand checked:bg-brand disabled:cursor-not-allowed disabled:opacity-50"
        />
        <CheckIcon
          size={12}
          weight="bold"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-on-accent opacity-0 peer-checked:opacity-100"
        />
      </span>
      <label
        htmlFor={inputId}
        className={cn(
          "type-body-m cursor-pointer text-primary select-none",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {label}
        {description ? (
          <span className="mt-0.5 block text-secondary">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

/** Design system §3.2 — brand fill on, border colour off. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex items-start justify-between gap-6">
      <label htmlFor={inputId} className="type-body-m cursor-pointer text-primary">
        {label}
        {description ? (
          <span className="mt-0.5 block text-secondary">{description}</span>
        ) : null}
      </label>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-[120ms] ease-out",
          checked ? "bg-brand" : "bg-line",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-raised shadow-[var(--shadow-raised)] transition-[left] duration-[120ms] ease-out",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

/** Radio group rendered as stacked cards — used where options need explanation. */
export function RadioCardGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: readonly { value: T; label: string; description?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid gap-2", className)}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-start gap-3 rounded-[8px] border p-3 text-left transition-colors duration-[120ms]",
              selected
                ? "border-brand bg-brand-subtle"
                : "border-line bg-raised hover:bg-wash-hover",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]",
                selected ? "border-brand" : "border-line",
              )}
            >
              {selected ? (
                <span className="size-2.5 rounded-full bg-brand" />
              ) : null}
            </span>
            <span className="type-body-m">
              <span className="font-medium text-primary">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-secondary">
                  {option.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
