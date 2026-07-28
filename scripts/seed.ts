/**
 * Seeds Ops-configurable reference data.
 *   npm run db:seed
 *
 * Idempotent - safe to re-run. Prices are placeholders for Stanley/Ops to
 * replace (PRD §12 open question 1); they live in the database precisely so
 * changing them never needs a deploy.
 */
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";

const PRICING = [
  {
    nicheTier: "general_consumer" as const,
    costPerInterviewCents: 4000, // $40
    analysisFeeBaseCents: 15000, // $150
    analysisFeePerUnitCents: 1500, // $15/interview
    minInterviews: 3,
    maxInterviews: 60,
  },
  {
    nicheTier: "vertical_b2b" as const,
    costPerInterviewCents: 9000, // $90
    analysisFeeBaseCents: 20000,
    analysisFeePerUnitCents: 2000,
    minInterviews: 3,
    maxInterviews: 40,
  },
  {
    nicheTier: "highly_specialized" as const,
    costPerInterviewCents: 18000, // $180
    analysisFeeBaseCents: 30000,
    analysisFeePerUnitCents: 3000,
    minInterviews: 3,
    maxInterviews: 30,
  },
];

async function main() {
  for (const tier of PRICING) {
    const existing = await db
      .select()
      .from(schema.pricingConfig)
      .where(eq(schema.pricingConfig.nicheTier, tier.nicheTier))
      .limit(1);

    if (existing[0]) {
      // Keep the Ops-set prices, but sync the bounds so the UI's typed input
      // has the range this seed intends.
      await db
        .update(schema.pricingConfig)
        .set({
          minInterviews: tier.minInterviews,
          maxInterviews: tier.maxInterviews,
        })
        .where(eq(schema.pricingConfig.id, existing[0].id));
      console.log(
        `  ~ ${tier.nicheTier} exists - bounds synced to ${tier.minInterviews}-${tier.maxInterviews}`,
      );
      continue;
    }

    await db.insert(schema.pricingConfig).values(tier);
    console.log(
      `  + ${tier.nicheTier}: $${tier.costPerInterviewCents / 100}/interview`,
    );
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
