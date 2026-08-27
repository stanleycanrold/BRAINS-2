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

/** Parse $ / € / £ strings into monthly USD cents, filtering implausible values. */
export function parseMoneyValues(snippets: string[]): number[] {
  const values: number[] = [];
  for (const s of snippets) {
    const matches = s.matchAll(/\$?\s?(\d[\d,]*\.?\d*)\s*(k)?\s*(\/|\sper\s|\sa\s)?\s*(mo|month|yr|year)?/gi);
    for (const m of matches) {
      let n = Number(m[1].replace(/,/g, ""));
      if (m[2]?.toLowerCase() === "k") n *= 1000;
      const period = (m[4] || "").toLowerCase();
      if (period.startsWith("yr") || period.startsWith("year")) n = n / 12;
      if (n >= 5 && n <= 10000) values.push(Math.round(n));
    }
  }
  return [...new Set(values)].sort((a, b) => a - b);
}

/** Lightweight Van Westendorp bounds from observed monthly values. */
export function vanWestendorpBounds(values: number[]): { point: number; low: number; high: number } | null {
  if (values.length === 0) return null;
  if (values.length === 1) return { point: values[0], low: Math.round(values[0] * 0.6), high: Math.round(values[0] * 1.4) };
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return {
    point: median,
    low: Math.max(5, Math.round(q1 * 0.85)),
    high: Math.round(q3 * 1.15),
  };
}
