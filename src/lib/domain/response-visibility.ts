import type { ValidationResponse } from "@/lib/domain/types";

/**
 * Which responses a founder is entitled to see, and which count.
 *
 * Two rules, and only one of them is conditional.
 *
 * Rejected responses are never shown to a founder, ever. A generated or
 * nonsense submission displayed as feedback with a small grey label as the
 * only thing marking it is worse than not showing it: it is noise presented
 * as evidence. Which responses were thrown out, and why, is the evaluator's
 * business, and every one of them stays readable in full at /ops/review.
 *
 * Pending responses depend on whether anyone is actually reviewing. The
 * strict rule - a response counts once a human has passed it - is the right
 * one, and it is what HOLD_PENDING_FOR_REVIEW turns on. But it is only honest
 * when the queue is staffed: with nobody working it, holding a response back
 * does not mean "not yet verified", it means "lost". Two SafeSpark answers
 * sat pending for hours after a screening run failed silently, and under the
 * strict rule the founder would simply have had nine responses where eleven
 * came in, with no way to find out.
 *
 * So while this is false, a collected response is shown and counted, and the
 * reviewer's job is to remove the bad ones rather than to admit the good
 * ones. Flip it the day someone is working the queue - it is the only change
 * needed, because every surface reads through here.
 */
export const HOLD_PENDING_FOR_REVIEW = false;

/** The responses a founder is entitled to see, and that move their numbers. */
export function founderVisible(
  responses: readonly ValidationResponse[],
): ValidationResponse[] {
  return responses.filter((r) =>
    HOLD_PENDING_FOR_REVIEW
      ? r.review_status === "approved"
      : r.review_status !== "rejected",
  );
}

/**
 * Responses collected but not yet decided on.
 *
 * For ops, not for founder surfaces. Sizes the review queue, and is the only
 * way to notice a response nobody has looked at - which matters most when
 * HOLD_PENDING_FOR_REVIEW is on and pending means invisible.
 */
export function awaitingReview(
  responses: readonly ValidationResponse[],
): ValidationResponse[] {
  return responses.filter((r) => r.review_status === "pending");
}
