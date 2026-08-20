import "server-only";
import Stripe from "stripe";

/**
 * Stripe client.
 *
 * Payments are optional infrastructure: with no secret key the product still
 * works end-to-end on the free track, and Fast Track presents itself honestly
 * as unavailable rather than throwing at import time. That's why this is a
 * lazy getter rather than a module-level client.
 */

let cached: Stripe | null = null;

export function paymentsEnabled(): boolean {
  return Boolean(process.env.stripe_private);
}

export function wisePaymentsEnabled(): boolean {
  return Boolean(process.env.WISE_PAYMENT_URL);
}

export function fastTrackPaymentsEnabled(): boolean {
  return paymentsEnabled() || wisePaymentsEnabled();
}

export function getStripe(): Stripe {
  const key = process.env.stripe_private;
  if (!key) {
    throw new Error(
      "Stripe is not configured. Set stripe_private to enable Fast Track checkout.",
    );
  }

  if (!cached) {
    cached = new Stripe(key, {
      // Pinned deliberately: an unpinned version means Stripe can change
      // response shapes under us on their schedule, not ours. Must match the
      // version the installed SDK is generated against.
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
      appInfo: { name: "BRAINS AI", url: "https://nexabrains.io" },
    });
  }

  return cached;
}

/** Guards against a live key being used against a dev database by accident. */
export function isLiveMode(): boolean {
  return (process.env.stripe_private ?? "").startsWith("sk_live_");
}
