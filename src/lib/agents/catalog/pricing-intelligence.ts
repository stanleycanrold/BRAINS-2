import { z } from "zod";
import { defineAgent } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Agent definitions - PRD §6.
 *
 * Every judgment call, synthesis, estimate, go/no-go and "propose changes"
 * step in the pipeline is an agent call, never hardcoded logic. Each one is a
 * tightly scoped prompt plus a strict output schema, so it can be swapped for
 * a fine-tuned specialist SLM later without touching a caller.
 *
 * Prompt versions are bumped whenever wording changes, so the training corpus
 * in `agent_run_logs` stays attributable.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { VOICE } from "./voice";

// ── Pricing Intelligence Agent (Van Westendorp) ────────────────────────────

/**
 * Produces an empirical willingness-to-pay estimate from money people ALREADY
 * spend - competitor prices, the cost of current workarounds, budgets
 * respondents actually stated - never from what they say they would pay.
 *
 * The honesty rule is structural: with no money anchor in the evidence the
 * agent must return model "anchor_missing" and no point estimate, because a
 * confident invented number is the single most misleading thing this agent
 * could produce.
 */
export const pricingIntelligenceOutput = z.object({
  wtp_point: z.number(),
  wtp_range_low: z.number(),
  wtp_range_high: z.number(),
  currency: z.string(),
  basis: z.enum([
    "competitor_price",
    "current_spend",
    "stated_budget",
    "none",
  ]),
  reasoning: z.string(),
  model: z.enum(["anchored", "anchor_missing"]),
});

export const pricingIntelligenceAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    valueProp: string;
    niche: string;
    nicheTier: string;
    /** Monthly amounts, as best the evidence states them. */
    competitorPrices: string[];
    /** What respondents describe spending today: tools, hours, services. */
    costSignals: string[];
    /** Budgets or price expectations respondents stated outright. */
    statedBudgets: string[];
  },
  z.infer<typeof pricingIntelligenceOutput>
>({
  name: "pricing_intelligence",
  promptVersion: "2.0.0",
  outputSchema: pricingIntelligenceOutput,
  temperature: 0,
  maxTokens: 1400,
  system: `${VOICE}

You estimate what this product could empirically charge, the way a Van
Westendorp Price Sensitivity Meter would bound it: from observed money,
not stated intent. You act like a pricing analyst, not a cheerleader.

ANCHOR HIERARCHY (strongest first):
1. competitor_prices - what comparable tools actually charge this audience
   per month (G2/Capterra/Product Hunt, vendor pricing pages).
2. cost_signals - what respondents say the problem already costs them in
   tools, services, or labour they pay for today (payroll hours × rate).
3. stated_budgets - budgets or price expectations a respondent volunteered
   explicitly ("we pay $X", "budget up to $Y").

METHOD — Van Westendorp framing:
- With ≥2 distinct anchors: set wtp_point at the defensible monthly price
  where "too cheap = untrusted" and "too expensive = unaffordable" cross.
  Set wtp_range_low as the "cheap but credible" floor and wtp_range_high as
  the "expensive but still considered" ceiling. Bracket narrowly only when
  anchors cluster; widen when they conflict.
- Single thin anchor: widen range ±40%, note thinness in reasoning, still
  set basis to the anchor that carried it.
- Conflicting anchors (e.g., $49 tool vs $400 spend): explain the tension
  and weight toward the ICP's actual spend, not the cheapest tool.
- No anchor at all: model "anchor_missing", basis "none", wtp_point 0.
  Do not invent a precise number to fill the gap — a wide reasoned range
  only if niche Tier genuinely suggests one.

HARD RULES
- All amounts are monthly and in USD unless every anchor says otherwise.
- Every number must trace to a supplied anchor. If you round to a clean
  price with nothing behind it, return anchor_missing instead.
- Stated intent ("I would pay $X") is NOT an anchor, even with a number.
  Only money described as spent, charged, or budgeted counts.
- reasoning is 2–4 sentences naming anchors used and limits. A founder
  will price on this — do not hedge with "further research needed" without
  saying what anchor is missing.
- Prefer round price points founders can actually charge ($49, $99, $149,
  $249, $399) only when anchors support that tier.`,
  buildMessages: ({
    problemStatement,
    icp,
    valueProp,
    niche,
    nicheTier,
    competitorPrices,
    costSignals,
    statedBudgets,
  }) => [
    {
      role: "user",
      content: [
        `Problem: ${problemStatement}`,
        `Audience: ${icp}`,
        `What the product would change: ${valueProp}`,
        `Niche: ${niche} (${nicheTier})`,
        "",
        competitorPrices.length
          ? `Competitor prices found in research:\n${competitorPrices
              .map((p) => `- ${p}`)
              .join("\n")}`
          : "Competitor prices found in research: none.",
        costSignals.length
          ? `What respondents say the problem costs them today:\n${costSignals
              .map((s) => `- ${s}`)
              .join("\n")}`
          : "Cost signals from respondents: none.",
        statedBudgets.length
          ? `Budgets respondents stated outright:\n${statedBudgets
              .map((b) => `- ${b}`)
              .join("\n")}`
          : "Stated budgets: none.",
        "",
        "Estimate the empirical willingness to pay.",
      ].join("\n\n"),
    },
  ],
});
