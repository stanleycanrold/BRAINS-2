/**
 * ═══════════════════════════════════════════════════════════════════════════
 * How a research signal is named, in one place, for both applications.
 *
 * The marketing site and the product are separate Next apps with separate
 * dependencies, so they cannot import each other. They can both import this,
 * which is a plain module with no React, no CSS and no dependencies of any
 * kind - deliberately, so that adding a third surface later costs nothing.
 *
 * These strings had already been copied between the two once. The failure
 * that causes is specific and expensive: a visitor reads one wording before
 * signing up, sees a different wording after, and the only conclusion
 * available to them is that one of the two was marketing.
 *
 * ─── Why these words ──────────────────────────────────────────────────────
 *
 * Research measures ONE thing: how much people publicly discuss this problem.
 * It is not a verdict on the idea, and it must not be named as though it
 * were. The labels therefore describe what was actually found rather than
 * grading the founder.
 *
 * This matters in both directions. Calling a thin result "Weak" overstates
 * what desk research can know - plenty of real, painful, valuable problems
 * are barely discussed online, because people do not post about things that
 * embarrass them, or that sit inside regulated work, or that they simply
 * solve and move on from. And it discourages exactly the founder who most
 * needs the next step, which is talking to people.
 *
 * What it is NOT is softening. "Little public discussion" is a harder,
 * more specific claim than "Weak signal", not a gentler one. The house voice
 * forbids softening a weak signal to be encouraging, and nothing here does:
 * the real verdict belongs to the decision gate at the end of the pipeline,
 * on evidence from actual people, not to stage one.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type ProblemStrength = "weak" | "moderate" | "strong";

/** Semantic only. Each app maps this to its own palette. */
export type SignalTone = "success" | "neutral" | "caution";

export type Signal = {
  /** Short label for a badge or chip. Names the finding, not a grade. */
  label: string;
  /** Even shorter, for tight headers. */
  short: string;
  /** The one-line finding, in plain words. */
  headline: string;
  /**
   * What to do about it, written per verdict rather than shared.
   *
   * A generic next step wastes the most persuasive moment on the page. The
   * weak case in particular has the strongest honest argument for continuing,
   * because interviews are precisely what resolves an absence of public
   * discussion, and saying so is true rather than promotional.
   */
  next: string;
  /** The same point as a fragment, for a one-line bar with no room to argue. */
  nextShort: string;
  tone: SignalTone;
};

/**
 * The labels are written to be worth reading, not merely accurate.
 *
 * An earlier set - "Widely discussed", "Some discussion found", "Little
 * public discussion" - was honest and completely inert. "Some discussion
 * found" in particular states a measurement and implies nothing, which on the
 * screen a founder judges the product by is a wasted line.
 *
 * These say the same three things and each one implies its own next move.
 * "Hidden from search" is the important one: it is exactly what a thin result
 * means, since search is literally what we ran, and it reframes the finding
 * as a limit of the method rather than a verdict on the founder. That is both
 * truer and far more useful than telling someone their idea scored badly.
 */
export const SIGNALS: Record<ProblemStrength, Signal> = {
  strong: {
    label: "Loud in public",
    short: "Loud in public",
    headline: "People are already describing this problem in their own words.",
    next: "That is a good sign, and it is still not proof that anyone will pay. Ten conversations turn public complaint into evidence you can act on.",
    nextShort: "Turn public complaint into evidence.",
    tone: "success",
  },
  moderate: {
    /**
     * "Some signal found" rather than "Quiet, but there", which was the
     * previous attempt and read as a riddle: a founder should not have to
     * work out whether a label is good news. This one states the finding and
     * borrows the product's own word for it, which is also the word used on
     * the report a founder sees after signing up.
     */
    label: "Some signal found",
    short: "Some signal",
    headline: "Some people describe this problem, but it is not loud in public yet.",
    next: "Thin public discussion is common for problems people do not post about. Talking to ten people settles what search could not.",
    nextShort: "Ten conversations settle what search could not.",
    tone: "neutral",
  },
  weak: {
    label: "Hidden from search",
    short: "Hidden from search",
    headline: "Search found few people describing this problem.",
    next: "That is not the same as nobody having it. Plenty of real problems are never posted about, and ten conversations will tell you which of the two this is.",
    nextShort: "Ten conversations will tell you which.",
    tone: "caution",
  },
};
