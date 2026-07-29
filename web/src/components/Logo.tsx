import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The BRAINS AI mark and wordmark, matching the app and the letterhead
 * exactly - this is the one piece of UI that must be pixel-identical across
 * both properties, since it's the strongest brand signal either one carries.
 */

const MARK_TO_TEXT_RATIO = 1.12;

export function Logo({
  size = 18,
  className,
  priority,
}: {
  /** Wordmark font size in px; the mark scales with it. */
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const markSize = Math.round(size * MARK_TO_TEXT_RATIO);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brains-mark.png"
        alt=""
        width={markSize}
        height={markSize}
        priority={priority}
        quality={100}
        className="shrink-0 select-none"
      />
      <span
        style={{ fontSize: size }}
        aria-hidden="true"
        className="font-display leading-none font-bold tracking-[0.18em] text-primary uppercase"
      >
        Brains AI
      </span>
      <span className="sr-only">BRAINS AI</span>
    </span>
  );
}
