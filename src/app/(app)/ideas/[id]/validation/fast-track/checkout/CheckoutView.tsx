"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LockSimpleIcon,
  ArrowLeftIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InterviewCount } from "@/components/InterviewCount";
import { useToast } from "@/components/ui/Toast";
import { IdeaTopBar } from "../../../IdeaTopBar";
import { cn } from "@/lib/cn";
import type { IdeaState } from "@/lib/domain/types";
import { recalculate, type Estimate } from "@/lib/pricing-math";

/**
 * B6 — Fast Track: Estimate & Checkout (design system §4.6).
 *
 * The founder sees exactly what they're paying for, itemised, before they
 * commit — a PRD acceptance criterion, not a nicety. Card details are never
 * handled here: checkout redirects to Stripe, so no card data touches our
 * servers and PCI scope stays with Stripe.
 */
export function CheckoutView({
  ideaId,
  state,
  initialEstimate,
}: {
  ideaId: string;
  state: IdeaState;
  initialEstimate: Estimate;
}) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("checkout") === "cancelled";

  const [n, setN] = React.useState(initialEstimate.nRequested);
  const [serverEstimate, setServerEstimate] = React.useState(initialEstimate);
  const [redirecting, setRedirecting] = React.useState(false);

  /**
   * Priced in the browser from the coefficients the server sent, so the total
   * moves on the same frame as the slider or keystroke. The server is still
   * asked to confirm — quietly, debounced — and its answer wins if the two
   * ever differ, because the server figure is what Stripe actually charges.
   */
  const estimate = recalculate(serverEstimate, n);

  React.useEffect(() => {
    if (n === serverEstimate.nRequested) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/ideas/${ideaId}/fast-track/estimate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ n }),
        });
        if (!response.ok) return;
        const body = await response.json();
        if (!cancelled) setServerEstimate(body.estimate);
      } catch {
        // Keep showing the locally-computed figure; checkout re-prices anyway.
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [n, ideaId, serverEstimate.nRequested]);

  async function checkout() {
    setRedirecting(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/fast-track/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n }),
      });
      const body = await response.json();
      if (!response.ok || !body.url) {
        throw new Error(body.error ?? "We couldn't start checkout.");
      }
      window.location.href = body.url;
    } catch (err) {
      setRedirecting(false);
      toast(
        err instanceof Error ? err.message : "We couldn't start checkout.",
        "danger",
      );
    }
  }

  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: estimate.currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <>
      <IdeaTopBar
        ideaId={ideaId}
        title={state.title}
        status={state.status}
        showStepper={false}
      />

      <Link
        href={`/ideas/${ideaId}/validation`}
        className="type-body-m inline-flex items-center gap-1.5 text-secondary hover:text-primary"
      >
        <ArrowLeftIcon size={15} aria-hidden="true" />
        Back to track options
      </Link>

      <header className="mt-4">
        <h1 className="type-display-l text-primary">
          How many interviews do you want analysed?
        </h1>
        <p className="type-body-l mt-1 max-w-prose text-secondary">
          Every interview is transcribed and read by our AI, synthesised across
          all of them, scored, and delivered as a finished report on your
          dashboard. You do no analysis and no spreadsheet work.
        </p>
      </header>

      {cancelled ? (
        <Card className="mt-6 border-caution/40 bg-caution-subtle p-4">
          <p className="type-body-m flex items-start gap-2 text-primary">
            <WarningIcon
              size={18}
              className="mt-0.5 shrink-0 text-caution"
              aria-hidden="true"
            />
            <span>
              Checkout was cancelled and you haven&rsquo;t been charged. Your
              order is still here whenever you want to pick it back up.
            </span>
          </p>
        </Card>
      ) : null}

      <Card elevation="raised" className="mt-8 p-6">
        <InterviewCount
          value={n}
          onChange={setN}
          min={estimate.minInterviews}
          max={estimate.maxInterviews}
        />

        <dl
          className="mt-6 space-y-2.5 border-t border-line pt-5"
          aria-live="polite"
        >
          <Line
            label={`Interviews · ${money(estimate.costPerInterviewCents)} each`}
            value={money(estimate.interviewsSubtotalCents)}
          />
          <Line
            label="AI analysis, scoring & report"
            value={money(estimate.analysisFeeCents)}
          />
          <div className="border-t border-line pt-2.5">
            <Line label="Total" value={money(estimate.totalCents)} emphasis />
          </div>
        </dl>

        <div className="mt-6 border-t border-line pt-5">
          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={redirecting}
            onClick={() => void checkout()}
            iconLeft={<LockSimpleIcon size={16} aria-hidden="true" />}
          >
            {redirecting
              ? "Taking you to Stripe…"
              : `Pay ${money(estimate.totalCents)}`}
          </Button>

          <p className="type-caption mt-3 text-center text-tertiary">
            Card details are handled by Stripe and never touch our servers.
            Nothing starts until your payment clears.
          </p>
        </div>
      </Card>

      <p className="type-body-m mt-6 max-w-prose text-tertiary">
        Responses land in the same pool as anything you gather yourself, so the
        score is computed across everything together — not one number for your
        interviews and another for ours.
      </p>
    </>
  );
}

function Line({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt
        className={cn(
          "type-body-m",
          emphasis ? "font-medium text-primary" : "text-secondary",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "shrink-0",
          emphasis
            ? "type-data-l text-[20px] text-primary"
            : "type-data-m text-primary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
