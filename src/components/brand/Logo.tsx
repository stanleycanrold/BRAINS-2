import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The BRAINS AI mark and wordmark, matching the company letterhead exactly.
 *
 * The mark is the network/web glyph; the wordmark is set in the display face
 * with the wide tracking used on the letterhead. The mark keeps its own blue
 * (`--brand-mark`) rather than the darker UI accent - it is artwork, not a UI
 * element, and is the one place that distinction is made.
 */

export function LogoMark({
  size = 28,
  className,
  priority,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brains-mark.png"
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 select-none", className)}
      // Rendered well above its display size, so it stays crisp on any DPR.
      quality={100}
    />
  );
}

export function Wordmark({
  size = 15,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{ fontSize: size }}
      className={cn(
        "font-display leading-none font-bold tracking-[0.18em] text-primary uppercase",
        className,
      )}
    >
      Brains AI
    </span>
  );
}

/**
 * The lockup, as it appears on the company letterhead: mark and wordmark at
 * matched height.
 *
 * `size` is the WORDMARK's font size, and the mark is derived from it, so the
 * two can never drift apart. The 1.12 factor is optical, not mathematical - a
 * circular mark set to exactly the cap height reads as smaller than the
 * letterforms beside it, so it gets a small compensating bump.
 */
const MARK_TO_TEXT_RATIO = 1.12;

export function Logo({
  size = 17,
  showWordmark = true,
  className,
  priority,
}: {
  /** Wordmark font size in px; the mark scales with it. */
  size?: number;
  showWordmark?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const markSize = Math.round(size * MARK_TO_TEXT_RATIO);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={markSize} priority={priority} />
      {showWordmark ? <Wordmark size={size} aria-hidden="true" /> : null}
      <span className="sr-only">BRAINS AI</span>
    </span>
  );
}
