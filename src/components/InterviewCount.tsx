"use client";

import * as React from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Slider } from "@/components/ui/Slider";
import { SignalStrength } from "@/components/SignalStrength";
import { cn } from "@/lib/cn";

/**
 * How many interviews to run.
 *
 * A slider alone is a guessing game once the range is wide - a founder who
 * knows they want 24 shouldn't have to hunt for it. So the number is a real
 * text field they can type into, with the slider kept as the coarse control
 * and steppers for nudging.
 *
 * Typed input is only clamped on commit (blur / Enter), never mid-keystroke:
 * clamping as they type makes "2" become "3" before they finish typing "24".
 */
export function InterviewCount({
  value,
  onChange,
  min,
  max,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  className?: string;
}) {
  /**
   * `draft` holds the raw text ONLY while the founder is mid-edit; the rest of
   * the time it's null and the field simply shows `value`. Mirroring `value`
   * into state with an effect would re-render twice on every slider tick and
   * briefly show a stale number - this way there is one source of truth and no
   * synchronisation to get wrong.
   */
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? String(value);

  function commit() {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isNaN(parsed)) return;
    onChange(Math.max(min, Math.min(max, parsed)));
  }

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-4">
        <label
          htmlFor="interview-count"
          className="type-caption text-secondary uppercase"
        >
          How many interviews
        </label>
        <span className="type-body-m text-tertiary">
          {min}&ndash;{max}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-[8px] border border-line bg-raised p-1">
          <StepButton
            label="One fewer"
            disabled={atMin}
            onClick={() => onChange(Math.max(min, value - 1))}
          >
            <MinusIcon size={15} weight="bold" aria-hidden="true" />
          </StepButton>

          <input
            id="interview-count"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={shown}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
            }}
            aria-describedby="interview-count-help"
            className={cn(
              "type-data-l w-14 bg-transparent text-center text-[24px] text-primary",
              "focus:outline-none",
            )}
          />

          <StepButton
            label="One more"
            disabled={atMax}
            onClick={() => onChange(Math.min(max, value + 1))}
          >
            <PlusIcon size={15} weight="bold" aria-hidden="true" />
          </StepButton>
        </div>

        <Slider
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          ariaLabel="Number of interviews"
          className="flex-1"
        />
      </div>

      <SignalStrength n={value} className="mt-5" />
      <p id="interview-count-help" className="sr-only">
        Type a number between {min} and {max}, or use the slider.
      </p>
    </div>
  );
}

function StepButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-[6px]",
        "text-secondary transition-colors duration-[120ms]",
        "hover:bg-wash-hover hover:text-primary",
        "disabled:pointer-events-none disabled:opacity-30",
      )}
    >
      {children}
    </button>
  );
}
