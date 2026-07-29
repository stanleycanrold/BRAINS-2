"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * The Score gauge, byte-for-byte the same component as the app's (design
 * system §3.5) - the design system's own appendix calls this out specifically
 * as the one piece of UI that should appear unchanged on the marketing site,
 * as social proof. A 270° arc, not a full circle, so it reads as an
 * instrument rather than a donut chart. Center number is always Data L /
 * JetBrains Mono, tabular figures, never the display sans.
 */

const SWEEP = 270;
const START_ANGLE = 135;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, sweepDeg: number) {
  const sweep = Math.min(sweepDeg, 359.99);
  const start = polarToCartesian(cx, cy, r, START_ANGLE);
  const end = polarToCartesian(cx, cy, r, START_ANGLE + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
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

  const [animatedValue, setAnimatedValue] = React.useState<number | null>(null);
  const displayed = shouldAnimate ? (animatedValue ?? 0) : target;

  React.useEffect(() => {
    if (!shouldAnimate) return;

    let raf = 0;
    const duration = 600;
    const start = performance.now();
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
          <path d={trackPath} stroke="var(--border-default)" strokeWidth={stroke} strokeLinecap="round" />
          <path d={progressPath} stroke="var(--accent-brand)" strokeWidth={stroke} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-mono font-medium tabular-nums text-primary leading-none",
              font,
            )}
          >
            {Math.round(displayed)}
          </span>
        </div>
      </div>
      {label ? <span className="type-caption mt-2 text-secondary">{label}</span> : null}
    </div>
  );
}
