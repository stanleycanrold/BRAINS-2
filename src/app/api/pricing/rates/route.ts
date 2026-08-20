import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { marketingFloorPerInterview } from "@/lib/pricing";
import { fastTrackPaymentsEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * The per-interview rate for a tier.
 *
 * Exists so the persistent Fast Track button can show a real price on every
 * screen without threading pricing props through every page that renders the
 * top bar. Nothing here is sensitive - these rates are on the pricing card -
 * but it still requires a session, because there's no reason to serve our
 * rate table to anonymous callers.
 */
export async function GET() {
  try {
    await requireUser();

    if (!fastTrackPaymentsEnabled()) {
      return NextResponse.json({ enabled: false });
    }

    // The floor across tiers, not the caller's own tier. This feeds the
    // always-present Fast Track button, which is a marketing surface, and
    // quoting a different number there than in the teaser beside it reads as
    // inconsistent pricing. See marketingFloorPerInterview.
    const floor = await marketingFloorPerInterview();

    return NextResponse.json({
      enabled: true,
      cost_per_interview: floor.cents,
      currency: floor.currency,
    });
  } catch {
    // The button simply renders without a price.
    return NextResponse.json({ enabled: false });
  }
}
