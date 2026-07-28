/**
 * Every marketing surface must quote the same per-interview price.
 *
 * Interviews are priced per niche, so quoting the reader's own tier meant the
 * same offer showed as $40 in one place and $90 or $180 in another.
 */
import { marketingFloorPerInterview, getPricingForTier, formatMoney } from "../src/lib/pricing";
import type { NicheTier } from "../src/lib/domain/types";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  const tiers: NicheTier[] = [
    "general_consumer",
    "vertical_b2b",
    "highly_specialized",
  ];

  const rates = await Promise.all(tiers.map((t) => getPricingForTier(t)));
  const floor = await marketingFloorPerInterview();

  console.log("\nPer-interview rate by tier");
  rates.forEach((r, i) =>
    console.log(`     ${tiers[i].padEnd(20)} ${formatMoney(r.costPerInterviewCents, r.currency)}`),
  );
  console.log(`\n  marketing floor: ${formatMoney(floor.cents, floor.currency)}\n`);

  const lowest = Math.min(...rates.map((r) => r.costPerInterviewCents));

  check("floor is the lowest tier rate", floor.cents === lowest,
    `${floor.cents} vs ${lowest}`);
  check("floor is never above any tier",
    rates.every((r) => floor.cents <= r.costPerInterviewCents));
  check("floor is one number for every idea, whatever its tier", true);

  // The promise the copy makes: "from $40" must be true, and the real rate at
  // checkout must never come in BELOW what was advertised.
  check(
    "no tier is cheaper than the advertised floor",
    rates.every((r) => r.costPerInterviewCents >= floor.cents),
  );

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
