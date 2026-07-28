"use client";

import { cn } from "@/lib/cn";
import { MIN_RESPONSES } from "@/lib/domain/types";

/**
 * How much a given number of interviews is actually worth.
 *
 * The bands here are not decorative — they mirror what the Decision Gate does
 * with the result. Below MIN_RESPONSES the gate raises sample size as a
 * high-severity risk and discounts the score, so the meter says so plainly
 * rather than implying any number is fine. Diversity and depth still matter;
 * this only speaks to volume, which is the one thing the founder is choosing
 * here.
 */

export type SignalBand = {
  label: string;
  detail: string;
  /** 0–4, drives how many segments light up. */
  filled: number;
  tone: "weak" | "fair" | "good" | "strong";
};

export function bandFor(n: number): SignalBand {
  if (n < MIN_RESPONSES) {
    return {
      label: "Thin",
      detail: `Below ${MIN_RESPONSES}, a couple of strong opinions can swing the result. Your report will carry a small-sample warning and the score gets discounted for it.`,
      filled: 1,
      tone: "weak",
    };
  }
  if (n < 20) {
    return {
      label: "Reasonable",
      detail:
        "Enough to see patterns rather than anecdotes. A clear result here is worth acting on; a borderline one still deserves another round.",
      filled: 2,
      tone: "fair",
    };
  }
  if (n < 30) {
    return {
      label: "Strong",
      detail:
        "Enough that themes hold up on their own and one outlier can't distort the picture. Most decisions are safe on this.",
      filled: 3,
      tone: "good",
    };
  }
  return {
    label: "Very strong",
    detail:
      "Beyond this you'll mostly hear the same things again. Worth it when the decision is expensive to get wrong, otherwise spend the difference elsewhere.",
    filled: 4,
    tone: "strong",
  };
}

const TONE_BAR: Record<SignalBand["tone"], string> = {
  weak: "bg-caution",
  fair: "bg-brand",
  good: "bg-brand",
  strong: "bg-success",
};

const TONE_TEXT: Record<SignalBand["tone"], string> = {
  weak: "text-caution",
  fair: "text-brand",
  good: "text-brand",
  strong: "text-success",
};

export function SignalStrength({
  n,
  className,
}: {
  n: number;
  className?: string;
}) {
  const band = bandFor(n);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="type-caption text-tertiary uppercase">
          Signal strength
        </span>
        <span className={cn("type-body-m font-medium", TONE_TEXT[band.tone])}>
          {band.label}
        </span>
      </div>

      <div
        className="mt-2 flex gap-1"
        role="meter"
        aria-valuenow={band.filled}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Signal strength: ${band.label}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-200",
              i < band.filled ? TONE_BAR[band.tone] : "bg-line",
            )}
          />
        ))}
      </div>

      <p className="type-body-m mt-2.5 text-secondary">{band.detail}</p>
    </div>
  );
}
