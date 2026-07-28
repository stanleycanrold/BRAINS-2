"use client";

import * as React from "react";
import { useMediaQuery } from "@/lib/client-state";

/**
 * Types a phrase out, pauses, deletes it, moves to the next.
 *
 * Used for the composer's placeholder, where it does a job a static line
 * cannot: it shows several examples of what a good idea looks like in the
 * space of one, without adding anything around the box for someone to read.
 *
 * Anyone who has asked for reduced motion gets the first phrase, static. A
 * placeholder that never stops moving is exactly the kind of thing that
 * setting exists to turn off.
 */
export function useTypewriter(
  phrases: string[],
  { enabled = true }: { enabled?: boolean } = {},
): string {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [index, setIndex] = React.useState(0);
  const [length, setLength] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);

  const active = enabled && !reducedMotion && phrases.length > 0;
  const phrase = phrases[index % phrases.length] ?? "";

  React.useEffect(() => {
    if (!active) return;

    // Deleting is faster than typing, and the pause at the end of a phrase is
    // long enough to actually read it.
    const atEnd = !deleting && length === phrase.length;
    const atStart = deleting && length === 0;
    const delay = atEnd ? 2200 : atStart ? 350 : deleting ? 18 : 42;

    const timer = setTimeout(() => {
      if (atEnd) {
        setDeleting(true);
      } else if (atStart) {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      } else {
        setLength((n) => n + (deleting ? -1 : 1));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [active, deleting, length, phrase, phrases.length]);

  if (!active) return phrases[0] ?? "";
  return phrase.slice(0, length);
}
