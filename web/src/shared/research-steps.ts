/**
 * What the research pass narrates while it runs, for both applications.
 *
 * Shared for the same reason the signal wording is: a visitor watches these
 * lines on the marketing site, signs up, and watches them again inside the
 * product. Two copies would drift, and the drift would be visible to the one
 * person it matters to.
 *
 * ─── What these are honest about ─────────────────────────────────────────
 *
 * The first step is real: it is complete the moment extraction writes the
 * problem statement, which the client can see. The rest advance on a timer,
 * because the pipeline does not report progress between the five search
 * queries and the single research call that follows them.
 *
 * That is acceptable only because each line describes work the run genuinely
 * does, in the order it does it. It would not be acceptable to invent stages
 * that do not exist, or to show a percentage, which implies a measurement
 * nobody is taking. If finer progress is ever wanted, the fix is for the
 * pipeline to write a stage marker to the idea record as it goes, and for
 * this list to follow that instead of a clock.
 */
export const RESEARCH_STEPS = [
  "Reading what you wrote…",
  "Sharpening the problem statement…",
  "Searching for people describing this problem…",
  "Looking at what already exists…",
  "Working out what would make this sharper…",
] as const;

/**
 * How long each timed step is shown. Roughly a fifth of a typical run, which
 * measured between forty and seventy seconds end to end.
 */
export const RESEARCH_STEP_MS = 12_000;
