/**
 * Who sees which responses, and what the rate is computed over.
 *
 * The rule has two settings and both have to hold, because the wrong one
 * silently changes what a founder is shown and what number they decide on.
 * The invariant that matters in either mode: the confirmation rate is
 * computed over exactly the responses the founder can see. A rate over a set
 * that is not on the page reconciles with nothing, which is how a report came
 * to show 11 responses at 64% above a list that added up to neither.
 */
import {
  founderVisible,
  awaitingReview,
  HOLD_PENDING_FOR_REVIEW,
} from "../src/lib/domain/response-visibility";
import {
  computeConfirmationRate,
  responseSchema,
  type ValidationResponse,
} from "../src/lib/domain/types";

function response(
  id: string,
  confirmed: "yes" | "no" | "unsure",
  review: "approved" | "pending" | "rejected",
): ValidationResponse {
  return responseSchema.parse({
    id,
    confirmed,
    channel: "survey",
    review_status: review,
  });
}

let failures = 0;
function expect(label: string, actual: unknown, wanted: unknown) {
  const ok = actual === wanted;
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} — got ${actual}, want ${wanted}`);
}

/**
 * The real SafeSpark pool: 11 responses, 7 yes / 3 unsure / 1 no, with two
 * left unscreened by a screening run that failed - one of them a yes and one
 * an unsure. Those two are why the two modes give different rates.
 */
const pool: ValidationResponse[] = [
  ...Array.from({ length: 6 }, (_, i) => response(`y${i}`, "yes", "approved")),
  response("u0", "unsure", "approved"),
  response("u1", "unsure", "approved"),
  response("n0", "no", "approved"),
  response("y6", "yes", "pending"),
  response("u2", "unsure", "pending"),
];
// Deliberately not in the pool above: added here so both modes are tested
// against a rejected response, which neither mode ever shows.
const withRejected = [...pool, response("r0", "yes", "rejected")];

console.log(
  `\nResponse visibility (HOLD_PENDING_FOR_REVIEW = ${HOLD_PENDING_FOR_REVIEW})\n`,
);

expect("a rejected response is never visible", founderVisible(withRejected).length, 11);
expect(
  "and never counts",
  founderVisible(withRejected).some((r) => r.review_status === "rejected"),
  false,
);
expect("pending are countable for ops either way", awaitingReview(withRejected).length, 2);

/**
 * The invariant, in whichever mode is configured: the denominator of the rate
 * is the set of responses on the page.
 */
const visible = founderVisible(withRejected);
const confirmedVisible = visible.filter((r) => r.confirmed === "yes").length;
expect(
  "the rate is computed over exactly what the founder sees",
  computeConfirmationRate(withRejected),
  visible.length === 0 ? 0 : confirmedVisible / visible.length,
);

if (HOLD_PENDING_FOR_REVIEW) {
  expect("holding: only approved are shown", visible.length, 9);
  expect("holding: 6 of 9 confirmed", Math.round((confirmedVisible / 9) * 100), 67);
} else {
  expect("not holding: every collected response is shown", visible.length, 11);
  expect(
    "not holding: 7 of 11 confirmed, the figure SafeSpark reported",
    Math.round((confirmedVisible / 11) * 100),
    64,
  );
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
