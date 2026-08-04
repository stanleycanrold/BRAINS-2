"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LightningIcon,
  SpinnerGapIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/pricing-math";
import type { IdeaState } from "@/lib/domain/types";
import { canBuyFastTrack, validationStage } from "@/lib/validation-stage";

/**
 * The always-there Fast Track action, top right of every idea screen.
 *
 * Paid interviews are the product's revenue, and previously they were only
 * reachable from the track-choice screen - once a founder moved past it there
 * was no way back without navigating backwards. A fixed position in the top
 * bar means it's in the same place on every screen, findable without being
 * sold: one line, no card, no pitch competing with their work.
 *
 * It changes what it says with the round rather than disappearing, so the
 * same spot answers "can I buy this?" and "what's happening with what I
 * bought?" - which is what people look for in the same place anyway.
 */

/**
 * Whether checkout is open for business, and at what rate.
 *
 * These have to travel together. Collapsing them to a bare price meant "still
 * loading" and "Stripe isn't configured" looked identical, so the button drew
 * itself without a price and sent people to a checkout page that redirects
 * straight back - a link that appears to do nothing when clicked.
 */
type Rates = { enabled: boolean; cents: number | null };

/**
 * Cached across mounts - the rate doesn't change within a session, and it is
 * the same floor price for every idea, so one fetch serves the whole app.
 */
let ratePromise: Promise<Rates> | null = null;

function fetchRates(): Promise<Rates> {
  if (!ratePromise) {
    ratePromise = fetch("/api/pricing/rates")
      .then((r) => r.json())
      .then((body) => ({
        enabled: Boolean(body.enabled),
        cents:
          typeof body.cost_per_interview === "number"
            ? body.cost_per_interview
            : null,
      }))
      .catch(() => ({ enabled: false, cents: null }));
  }
  return ratePromise;
}

export function FastTrackButton({
  ideaId,
  state,
}: {
  ideaId: string;
  state: IdeaState;
}) {
  const router = useRouter();
  const stage = validationStage(state);
  const [rates, setRates] = React.useState<Rates | null>(null);

  React.useEffect(() => {
    let live = true;
    void fetchRates().then((value) => {
      if (live) setRates(value);
    });
    return () => {
      live = false;
    };
  }, []);

  // Nothing to buy or track until there's research to build questions from.
  if (!state.research_report) return null;

  /**
   * The three buying stages all point at checkout, so they only exist while
   * checkout does. `rates === null` is the moment before the fetch lands: the
   * button waits rather than flashing an offer it might have to withdraw.
   */
  const buyable = canBuyFastTrack(state, rates?.enabled === true);
  const needsCheckout =
    stage === "not_started" || stage === "self_serve" || stage === "awaiting_payment";
  if (needsCheckout && !buyable) return null;

  const rate = rates?.cents ?? null;

  const view = {
    not_started: {
      icon: <LightningIcon size={15} weight="fill" aria-hidden="true" />,
      label: rate
        ? `Interviews for you · from ${formatMoney(rate)} each`
        : "Get interviews done for you",
      href: `/ideas/${ideaId}/validation/fast-track/checkout`,
      tone: "offer" as const,
    },
    self_serve: {
      icon: <LightningIcon size={15} weight="fill" aria-hidden="true" />,
      label: rate
        ? `Have them run for you · from ${formatMoney(rate)} each`
        : "Have them run for you",
      href: `/ideas/${ideaId}/validation/fast-track/checkout`,
      tone: "offer" as const,
    },
    awaiting_payment: {
      icon: <ClockIcon size={15} aria-hidden="true" />,
      label: "Finish your payment",
      href: `/ideas/${ideaId}/validation/fast-track/checkout`,
      tone: "caution" as const,
    },
    underway: {
      icon: (
        <SpinnerGapIcon size={15} className="animate-spin" aria-hidden="true" />
      ),
      label: "Validation in progress",
      href: `/ideas/${ideaId}/validation/fast-track/status`,
      tone: "live" as const,
    },
    delivered: {
      icon: <CheckCircleIcon size={15} weight="fill" aria-hidden="true" />,
      label: "Interviews complete",
      href: `/ideas/${ideaId}/validation/fast-track/status`,
      tone: "done" as const,
    },
  }[stage];

  return (
    <button
      type="button"
      onClick={() => router.push(view.href)}
      className={cn(
        "type-body-m inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3",
        "transition-colors duration-[120ms]",
        view.tone === "offer" &&
          "border-brand/35 bg-brand-subtle text-brand hover:border-brand/60",
        view.tone === "caution" &&
          "border-caution/40 bg-caution-subtle text-primary hover:border-caution/70",
        view.tone === "live" &&
          "border-brand/35 bg-brand-subtle text-brand",
        view.tone === "done" &&
          "border-line bg-raised text-secondary hover:text-primary",
      )}
    >
      {view.icon}
      <span className="hidden truncate sm:inline">{view.label}</span>
    </button>
  );
}
