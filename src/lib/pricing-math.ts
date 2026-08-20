import type { NicheTier } from "@/lib/domain/types";

/**
 * Pricing arithmetic and types - deliberately free of any database import so
 * client components can use it.
 *
 * The formula lives here ONCE. The server reads rates from `pricing_config`
 * and applies it; the browser re-applies it to the same coefficients as the
 * founder drags or types. Two copies of a pricing formula in two files is how
 * the displayed total and the charged total quietly drift apart.
 */

export type Estimate = {
  nRequested: number;
  nicheTier: NicheTier;
  costPerInterviewCents: number;
  interviewsSubtotalCents: number;
  analysisFeeCents: number;
  totalCents: number;
  currency: string;
  minInterviews: number;
  maxInterviews: number;
  /** Coefficients behind analysisFeeCents, so the client can recompute. */
  analysisFeeBaseCents: number;
  analysisFeePerUnitCents: number;
};

export type PricingRates = {
  costPerInterviewCents: number;
  analysisFeeBaseCents: number;
  /** Analysis is largely fixed-cost, so it scales mildly rather than 1:1. */
  analysisFeePerUnitCents: number;
  minInterviews: number;
  maxInterviews: number;
  currency: string;
};

export function priceFor(
  rates: PricingRates,
  tier: NicheTier,
  n: number,
): Estimate {
  const clamped = Math.max(rates.minInterviews, Math.round(n));

  const interviewsSubtotalCents = rates.costPerInterviewCents * clamped;
  // Launch promotion: analysis, review, scoring, and the report are free.
  // Keep the configured coefficients in the estimate for a future promotion.
  const analysisFeeCents = 0;

  return {
    nRequested: clamped,
    nicheTier: tier,
    costPerInterviewCents: rates.costPerInterviewCents,
    interviewsSubtotalCents,
    analysisFeeCents,
    totalCents: interviewsSubtotalCents + analysisFeeCents,
    currency: rates.currency,
    minInterviews: rates.minInterviews,
    maxInterviews: rates.maxInterviews,
    analysisFeeBaseCents: rates.analysisFeeBaseCents,
    analysisFeePerUnitCents: rates.analysisFeePerUnitCents,
  };
}

/**
 * Re-price an existing estimate for a new count, in the browser, on the same
 * frame the founder makes the change. The server figure is still the only one
 * that reaches Stripe - this is for responsiveness, not authority.
 */
export function recalculate(base: Estimate, n: number): Estimate {
  return priceFor(
    {
      costPerInterviewCents: base.costPerInterviewCents,
      analysisFeeBaseCents: base.analysisFeeBaseCents,
      analysisFeePerUnitCents: base.analysisFeePerUnitCents,
      minInterviews: base.minInterviews,
      maxInterviews: base.maxInterviews,
      currency: base.currency,
    },
    base.nicheTier,
    n,
  );
}

export function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
