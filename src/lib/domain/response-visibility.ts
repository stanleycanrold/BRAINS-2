import type { ValidationResponse } from "@/lib/domain/types";

/**
 * Who is allowed to see a response that has not been approved.
 *
 * A response arrives from a tester and is screened before it reaches the
 * founder. Until an evaluator has approved it, it is not part of the founder's
 * evidence: they do not see it, it does not appear in their report, it does
 * not move their confirmation rate, and it is never in a shared link.
 *
 * The founder was previously shown everything with a badge saying which state
 * each response was in. That put an internal workflow in front of the person
 * paying for the result, and worse, it put rejected answers in front of them -
 * a generated or nonsense submission, displayed as feedback, with a small grey
 * label as the only thing distinguishing it. Reading which responses were
 * thrown out and why is the evaluator's job.
 *
 * Nothing is deleted by this. Every response, in every state, stays readable
 * in full on the ops side, which is the only place a review status is shown at
 * all.
 */

/** The responses a founder is entitled to see. */
export function approvedOnly(
  responses: readonly ValidationResponse[],
): ValidationResponse[] {
  return responses.filter((r) => r.review_status === "approved");
}

/**
 * Responses collected but not yet decided on.
 *
 * Not for founder surfaces - this exists so the ops queue can be sized and so
 * a response cannot sit unscreened forever without anyone noticing. Hiding
 * pending responses from the founder means the only remaining place they can
 * be seen is the reviewer's queue, which makes that queue load-bearing.
 */
export function awaitingReview(
  responses: readonly ValidationResponse[],
): ValidationResponse[] {
  return responses.filter((r) => r.review_status === "pending");
}
