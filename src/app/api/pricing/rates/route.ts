import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPricingForTier } from "@/lib/pricing";
import { paymentsEnabled } from "@/lib/stripe";
import type { NicheTier } from "@/lib/domain/types";

export const runtime = "nodejs";

/**
 * The per-interview rate for a tier.
 *
 * Exists so the persistent Fast Track button can show a real price on every
 * screen without threading pricing props through every page that renders the
 * top bar. Nothing here is sensitive — these rates are on the pricing card —
 * but it still requires a session, because there's no reason to serve our
 * rate table to anonymous callers.
 */
export async function GET(request: Request) {
  try {
    await requireUser();

    if (!paymentsEnabled()) {
      return NextResponse.json({ enabled: false });
    }

    const tier = (new URL(request.url).searchParams.get("tier") ??
      "general_consumer") as NicheTier;

    const rates = await getPricingForTier(tier);

    return NextResponse.json({
      enabled: true,
      cost_per_interview: rates.costPerInterviewCents,
      currency: rates.currency,
    });
  } catch {
    // The button simply renders without a price.
    return NextResponse.json({ enabled: false });
  }
}
