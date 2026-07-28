import type { IdeaState } from "@/lib/domain/types";

/**
 * Where this round of validation stands.
 *
 * There is exactly one rule for when the Fast Track offer may be marketed, and
 * it lives here so the dashboard, the questions tab and the validation screen
 * can't disagree. Offering to "start validation" to somebody who is already
 * mid-round reads as though the product isn't paying attention to what they've
 * already done.
 *
 * The offer belongs at the decision point - before a founder has committed to
 * how they'll gather answers, which is also the moment before they'd pay. Once
 * a track is chosen the round is underway and the honest thing to show is its
 * state, not a pitch.
 *
 * A redo restores the offer without any special handling: forkVersion() resets
 * both `validation.track` and `fast_track_order` on the new version, so the
 * next round starts at `not_started` again.
 */
export type ValidationStage =
  /** No track chosen. The decision point - the only place we market. */
  | "not_started"
  /** Founder is gathering answers themselves. */
  | "self_serve"
  /** Fast Track checkout was opened but payment hasn't cleared. */
  | "awaiting_payment"
  /** Paid. We're running the interviews. */
  | "underway"
  /** Fast Track round finished. */
  | "delivered";

export function validationStage(state: IdeaState): ValidationStage {
  const order = state.fast_track_order;

  if (order) {
    // `pending_sourcing` is the status an order carries between opening
    // checkout and payment clearing - it is NOT work in progress.
    switch (order.status) {
      case "pending_sourcing":
        return "awaiting_payment";
      case "completed":
        return "delivered";
      default:
        return "underway";
    }
  }

  return state.validation.track ? "self_serve" : "not_started";
}

/**
 * Whether the Fast Track offer may be shown.
 *
 * Note this is deliberately narrower than "they haven't paid": someone
 * part-way through gathering their own answers hasn't paid either, but they
 * have already answered the question this offer asks.
 */
export function canMarketFastTrack(state: IdeaState): boolean {
  return validationStage(state) === "not_started";
}

/** Whether a round is running - paid or self-serve. */
export function isValidationRunning(state: IdeaState): boolean {
  const stage = validationStage(state);
  return stage === "self_serve" || stage === "underway";
}
