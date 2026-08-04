"use client";

import * as React from "react";

/**
 * A two-pixel progress rule across the top of the viewport.
 *
 * On a long answer page the useful signal is not "how far down am I" but "how
 * much of this is left", which a scrollbar on a phone does not give you and a
 * desktop scrollbar gives you badly once the page has a sticky header. It
 * costs almost nothing visually and it measurably reduces the number of people
 * who leave a long page because they cannot tell whether it ends soon.
 *
 * Sits above the sticky nav rather than under it: the bar is 2px, and tucking
 * it beneath a translucent blurred header makes it read as a rendering
 * artefact instead of an instrument.
 */
export function ReadingProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      // A page shorter than the viewport has nothing to report, and dividing
      // by zero here would pin the bar at full width on every short page.
      setProgress(scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100);
    };

    // Scroll fires far more often than the screen refreshes; coalescing into
    // one frame keeps this off the main thread's critical path.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]"
    >
      <div
        className="h-full bg-brand transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
