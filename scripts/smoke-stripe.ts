/**
 * Verifies the Stripe integration against the live test account: creates a
 * real Checkout Session with the same line items the app builds, then expires
 * it so nothing is left dangling.
 *
 *   npm run smoke:stripe
 */
import { getStripe, isLiveMode, paymentsEnabled } from "../src/lib/stripe";
import { estimateFastTrack, formatMoney } from "../src/lib/pricing";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  check("payments configured", paymentsEnabled());
  check("running against TEST mode", !isLiveMode(), isLiveMode() ? "LIVE KEY!" : "test");
  if (!paymentsEnabled()) process.exit(1);

  const stripe = getStripe();

  // `balance.retrieve()` takes no identifier, so it verifies the key without
  // the "which account?" ambiguity that made /v1/accounts/ fail.
  const balance = await stripe.balance.retrieve();
  check("key authenticates", Array.isArray(balance.available));
  check("Stripe agrees this is test mode", balance.livemode === false);

  console.log("\nPricing from pricing_config:");
  for (const tier of [
    "general_consumer",
    "vertical_b2b",
    "highly_specialized",
  ] as const) {
    const e = await estimateFastTrack({ tier, n: 8 });
    console.log(
      `  ${tier.padEnd(20)} 8 × ${formatMoney(e.costPerInterviewCents)} + ${formatMoney(
        e.analysisFeeCents,
      )} = ${formatMoney(e.totalCents)}`,
    );
    check(`${tier} total is the sum of its parts`,
      e.totalCents === e.interviewsSubtotalCents + e.analysisFeeCents);
  }

  console.log("\nCreating a Checkout Session (same shape the app builds):");
  const estimate = await estimateFastTrack({ tier: "vertical_b2b", n: 5 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: "smoke-test",
    metadata: { order_id: "smoke-test" },
    line_items: [
      {
        quantity: estimate.nRequested,
        price_data: {
          currency: estimate.currency,
          unit_amount: estimate.costPerInterviewCents,
          product_data: { name: "Fast Track interview" },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: estimate.currency,
          unit_amount: estimate.analysisFeeCents,
          product_data: { name: "Analysis & synthesis" },
        },
      },
    ],
    // Must match the app: payment happens in-app via embedded checkout, so
    // there is no hosted URL - a client_secret mounts the form instead. If
    // this drifts from the route, the smoke test stops testing the real thing.
    ui_mode: "embedded_page",
    return_url:
      "http://localhost:3001/ideas/x/validation/fast-track/status?session_id={CHECKOUT_SESSION_ID}",
  });

  check("session created", Boolean(session.id), session.id);
  check("embedded client_secret returned", Boolean(session.client_secret));
  check("no hosted redirect - payment stays in-app", !session.url);
  check(
    "Stripe total matches our estimate",
    session.amount_total === estimate.totalCents,
    `stripe=${session.amount_total} ours=${estimate.totalCents}`,
  );
  check("starts unpaid", session.payment_status === "unpaid");

  // Don't leave a live session hanging around in the dashboard.
  await stripe.checkout.sessions.expire(session.id);
  console.log("  cleaned up (session expired)");

  const hook = process.env.STRIPE_WEBHOOK_SECRET;
  console.log(
    hook
      ? "\n  webhook secret present - payment confirmation will work"
      : "\n  NOTE: STRIPE_WEBHOOK_SECRET not set. Payment still confirms on\n" +
        "        return from checkout - the reconcile route verifies the\n" +
        "        session against Stripe directly. For confirmation that\n" +
        "        survives a closed tab, run:\n" +
        "          stripe listen --forward-to localhost:3001/api/webhooks/stripe",
  );

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILED`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\nSTRIPE SMOKE FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
