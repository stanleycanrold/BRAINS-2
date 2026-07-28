"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/client-state";

/**
 * Design system §3.5 - the Score gauge. The product's signature element.
 *
 * A 270° arc, not a full circle: the gap reads as a gauge (an instrument),
 * not a donut chart. The centre number is ALWAYS Data L / JetBrains Mono with
 * tabular figures, in every context it appears - never the display sans.
 *
 * Motion budget (§1.6) is spent once, on the report reveal: the large variant
 * animates 0 → score over 600ms on load; the small variant used on dashboard
 * cards is static, so a grid of cards doesn't turn into a fireworks display.
 * `prefers-reduced-motion` snaps it instantly.
 */

const SWEEP = 270; // degrees
const START_ANGLE = 135; // bottom-left, sweeping clockwise to bottom-right

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, sweepDeg: number) {
  // Guard: a 360° arc can't be expressed as a single A command.
  const sweep = Math.min(sweepDeg, 359.99);
  const start = polarToCartesian(cx, cy, r, START_ANGLE);
  const end = polarToCartesian(cx, cy, r, START_ANGLE + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export interface ScoreGaugeProps {
  /** 0–100. */
  score: number;
  size?: "sm" | "md" | "lg";
  /** Animate 0 → score on mount. Reserved for the report page reveal. */
  animate?: boolean;
  /** Small caption under the number, e.g. "Validation score". */
  label?: string;
  className?: string;
}

const DIMENSIONS = {
  sm: { box: 44, stroke: 4, font: "text-[13px]" },
  md: { box: 96, stroke: 7, font: "text-[28px]" },
  lg: { box: 176, stroke: 10, font: "text-[48px]" },
} as const;

export function ScoreGauge({
  score,
  size = "lg",
  animate = false,
  label,
  className,
}: ScoreGaugeProps) {
  const target = Math.max(0, Math.min(100, Math.round(score)));
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const shouldAnimate = animate && !reducedMotion;

  // Only the in-flight animation is state. When we're not animating the gauge
  // renders `target` directly, so there's no effect writing state on mount and
  // no first frame showing the wrong number.
  const [animatedValue, setAnimatedValue] = React.useState<number | null>(null);
  const displayed = shouldAnimate ? (animatedValue ?? 0) : target;

  React.useEffect(() => {
    if (!shouldAnimate) return;

    let raf = 0;
    const duration = 600;
    const start = performance.now();
    // ease-out cubic - decelerates into the final value, like a needle settling
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setAnimatedValue(target * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, shouldAnimate]);

  const { box, stroke, font } = DIMENSIONS[size];
  const cx = box / 2;
  const cy = box / 2;
  const r = (box - stroke) / 2;
  const fraction = Math.max(0, Math.min(1, displayed / 100));

  const trackPath = arcPath(cx, cy, r, SWEEP);
  const progressPath = arcPath(cx, cy, r, Math.max(SWEEP * fraction, 0.01));

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      role="img"
      aria-label={`Validation score ${target} out of 100`}
    >
      <div className="relative" style={{ width: box, height: box }}>
        <svg
          width={box}
          height={box}
          viewBox={`0 0 ${box} ${box}`}
          fill="none"
          aria-hidden="true"
          className="block"
        >
          <path
            d={trackPath}
            stroke="var(--border-default)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <path
            d={progressPath}
            stroke="var(--accent-brand)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              // Data L, always - never the display sans, in any context.
              "font-mono font-medium tabular-nums text-primary leading-none",
              font,
            )}
          >
            {Math.round(displayed)}
          </span>
        </div>
      </div>
      {label ? (
        <span className="type-caption mt-2 text-secondary">{label}</span>
      ) : null}
    </div>
  );
}
