"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import {
  LockSimpleIcon,
  ArrowLeftIcon,
  WarningIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InterviewCount } from "@/components/InterviewCount";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { IdeaTopBar } from "../../../IdeaTopBar";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/cn";
import type { IdeaState } from "@/lib/domain/types";
import { recalculate, type Estimate } from "@/lib/pricing-math";

/**
 * B6 - Fast Track: Estimate & Checkout (design system §4.6).
 *
 * Payment happens INSIDE the product. Stripe's embedded checkout renders the
 * card fields in an iframe it owns, so no card data touches our servers and
 * PCI scope stays SAQ-A - but the founder never leaves the page. That matters
 * here specifically: they have just spent real effort on their questions, and
 * a hand-off to a different domain is exactly where people reconsider.
 */

export function CheckoutView({
  ideaId,
  state,
  initialEstimate,
  stripePublicKey,
}: {
  ideaId: string;
  state: IdeaState;
  initialEstimate: Estimate;
  stripePublicKey: string;
}) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("checkout") === "cancelled";

  const [n, setN] = React.useState(initialEstimate.nRequested);
  const [serverEstimate, setServerEstimate] = React.useState(initialEstimate);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [preparing, setPreparing] = React.useState(false);
  const [location, setLocation] = React.useState("");
  const stripePromise = React.useMemo(
    () => (stripePublicKey ? loadStripe(stripePublicKey) : null),
    [stripePublicKey],
  );

  // Priced locally so the total moves on the same frame as the input; the
  // server confirms in the background and its figure is what Stripe charges.
  const estimate = recalculate(serverEstimate, n);

  React.useEffect(() => {
    if (n === serverEstimate.nRequested) return;
    let stale = false;

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/ideas/${ideaId}/fast-track/estimate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ n }),
        });
        if (!response.ok) return;
        const body = await response.json();
        if (!stale) setServerEstimate(body.estimate);
      } catch {
        // Keep the local figure; checkout re-prices server-side anyway.
      }
    }, 400);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [n, ideaId, serverEstimate.nRequested]);

  async function beginPayment() {
    setPreparing(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/fast-track/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n, location_preference: location }),
      });
      const body = await response.json();
      if (!response.ok || !body.client_secret) {
        throw new Error(body.error ?? "We couldn't start checkout.");
      }
      setClientSecret(body.client_secret);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't start checkout.",
        "danger",
      );
    } finally {
      setPreparing(false);
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
          {clientSecret ? "Confirm and pay" : "How many people should validate it?"}
        </h1>
        <p className="type-body-l mt-1 max-w-prose text-secondary">
          {clientSecret
            ? "Your order is held below. Nothing starts until this clears."
            : "Every validation response is read by our AI, synthesised across all of them, scored, and delivered as a finished report on your dashboard."}
        </p>
      </header>

      {cancelled && !clientSecret ? (
        <Card className="mt-6 border-caution/40 bg-caution-subtle p-4">
          <p className="type-body-m flex items-start gap-2 text-primary">
            <WarningIcon
              size={18}
              className="mt-0.5 shrink-0 text-caution"
              aria-hidden="true"
            />
            <span>
              That checkout was cancelled and you haven&rsquo;t been charged.
            </span>
          </p>
        </Card>
      ) : null}

      {!clientSecret ? (
        <Card elevation="raised" className="mt-8 p-6">
          <InterviewCount
            value={n}
            onChange={setN}
            min={estimate.minInterviews}
            max={estimate.maxInterviews}
          />

          {/* Optional, and deliberately free text: "US healthcare admins" and
              "anywhere, English-speaking" are both useful and neither fits a
              country dropdown. Asked before payment because it changes who we
              go looking for. */}
          <div className="mt-6 border-t border-line pt-5">
            <label
              htmlFor="location-preference"
              className="type-body-m block font-medium text-primary"
            >
              Where should these people be?{" "}
              <span className="text-tertiary">Optional</span>
            </label>
            <Input
              id="location-preference"
              className="mt-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. UK and Ireland, or US healthcare admins"
              maxLength={200}
            />
            <p className="type-caption mt-1.5 text-tertiary">
              Leave it blank and we will look anywhere your people are.
            </p>
          </div>

          <dl
            className="mt-6 space-y-2.5 border-t border-line pt-5"
            aria-live="polite"
          >
            <Line
              label={`Validation responses · ${money(estimate.costPerInterviewCents)} each`}
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
              loading={preparing}
              onClick={() => void beginPayment()}
              iconLeft={<LockSimpleIcon size={16} aria-hidden="true" />}
            >
              Continue to payment
            </Button>
            <p className="type-caption mt-3 flex items-center justify-center gap-1.5 text-tertiary">
              <ShieldCheckIcon size={14} aria-hidden="true" />
              Card handled by Stripe. Nothing starts until payment clears.
            </p>
          </div>
        </Card>
      ) : (
        <div className="mt-8">
          {/* Order summary stays visible above the form - the founder should
              never have to remember what they're paying for. */}
          <Card className="p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="type-body-m text-secondary">
                {estimate.nRequested} responses, analysed and scored
                {location.trim() ? ` · ${location.trim()}` : ""}
              </span>
              <span className="type-data-l text-[20px] text-primary">
                {money(estimate.totalCents)}
              </span>
            </div>
          </Card>

          <Card elevation="raised" className="mt-3 overflow-hidden p-1">
            {stripePromise ? (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  clientSecret,
                  // Stripe's iframe can't read our CSS, so the theme has to be
                  // passed explicitly or the form looks pasted on in dark mode.
                  onComplete: () => {},
                }}
                key={theme}
              >
                <EmbeddedCheckout className="min-h-[520px]" />
              </EmbeddedCheckoutProvider>
            ) : null}
          </Card>

          <button
            type="button"
            onClick={() => setClientSecret(null)}
            className="type-body-m mt-4 text-secondary hover:text-primary"
          >
            Change the number of people
          </button>
        </div>
      )}

      <p className="type-body-m mt-6 max-w-prose text-tertiary">
        Responses land in the same pool as anything you gather yourself, so the
        score is computed across everything together.
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
