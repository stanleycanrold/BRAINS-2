import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { NicheTier } from "@/lib/domain/types";
import { priceFor, type Estimate, type PricingRates } from "./pricing-math";

/**
 * Fast Track pricing (PRD §4.3.2.1) - the server half.
 *
 * Rates are read from the `pricing_config` table, never hardcoded, so Ops can
 * retune them without a deploy. The arithmetic itself lives in `pricing-math`
 * so the browser can apply the identical formula without importing the
 * database layer. Money is in minor units (cents) end-to-end; floats never
 * touch a price.
 */

export type { Estimate } from "./pricing-math";
export { formatMoney, recalculate } from "./pricing-math";

/** Used only when Ops hasn't configured a tier yet, so the UI still works. */
const FALLBACK: Record<NicheTier, Omit<PricingRates, "currency">> = {
  general_consumer: {
    costPerInterviewCents: 4000,
    analysisFeeBaseCents: 15000,
    analysisFeePerUnitCents: 1500,
    minInterviews: 3,
    maxInterviews: 60,
  },
  vertical_b2b: {
    costPerInterviewCents: 9000,
    analysisFeeBaseCents: 20000,
    analysisFeePerUnitCents: 2000,
    minInterviews: 3,
    maxInterviews: 40,
  },
  highly_specialized: {
    costPerInterviewCents: 18000,
    analysisFeeBaseCents: 30000,
    analysisFeePerUnitCents: 3000,
    minInterviews: 3,
    maxInterviews: 30,
  },
};

export async function getPricingForTier(
  tier: NicheTier,
): Promise<PricingRates & { configured: boolean }> {
  const rows = await db
    .select()
    .from(schema.pricingConfig)
    .where(eq(schema.pricingConfig.nicheTier, tier))
    .orderBy(desc(schema.pricingConfig.effectiveFrom))
    .limit(1);

  const row = rows[0];
  if (row) {
    return {
      costPerInterviewCents: row.costPerInterviewCents,
      analysisFeeBaseCents: row.analysisFeeBaseCents,
      analysisFeePerUnitCents: row.analysisFeePerUnitCents,
      minInterviews: row.minInterviews,
      maxInterviews: row.maxInterviews,
      currency: row.currency,
      configured: true,
    };
  }

  return { ...FALLBACK[tier], currency: "usd", configured: false };
}

/**
 * The Estimation Agent's calculation (PRD §6.5).
 *
 * Deliberately deterministic rather than an LLM call: a founder is about to be
 * charged this number, so it must be reproducible and auditable. The judgment
 * that DOES need a model - which niche tier this idea falls into - already
 * happened during extraction and is stored on the idea.
 */
export async function estimateFastTrack(params: {
  tier: NicheTier;
  n: number;
}): Promise<Estimate> {
  const rates = await getPricingForTier(params.tier);
  return priceFor(rates, params.tier, params.n);
}

/**
 * The number every marketing surface quotes.
 *
 * Interviews are priced per niche: a general-consumer round is cheaper than a
 * highly specialised one. Quoting the reader's OWN tier meant the same offer
 * appeared as $40 in one place and $90 or $180 in another, which reads as
 * inconsistent pricing rather than as a tiered rate card.
 *
 * So every teaser, badge and button quotes the FLOOR across all tiers, always
 * worded "from" or "starting at". The real rate for a specific idea appears
 * once, itemised, at checkout - where a quantity has been chosen and the
 * number actually means something.
 */
export async function marketingFloorPerInterview(): Promise<{
  cents: number;
  currency: string;
}> {
  const tiers: NicheTier[] = [
    "general_consumer",
    "vertical_b2b",
    "highly_specialized",
  ];

  const rates = await Promise.all(tiers.map((tier) => getPricingForTier(tier)));

  return rates.reduce(
    (lowest, rate) =>
      rate.costPerInterviewCents < lowest.cents
        ? { cents: rate.costPerInterviewCents, currency: rate.currency }
        : lowest,
    { cents: Number.POSITIVE_INFINITY, currency: "usd" },
  );
}
