"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InterviewCount } from "@/components/InterviewCount";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { IdeaTopBar } from "../../../IdeaTopBar";
import { cn } from "@/lib/cn";
import type { IdeaState } from "@/lib/domain/types";
import { recalculate, type Estimate } from "@/lib/pricing-math";

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
  const [n, setN] = React.useState(initialEstimate.nRequested);
  const [serverEstimate, setServerEstimate] = React.useState(initialEstimate);
  const [preparing, setPreparing] = React.useState(false);
  const [location, setLocation] = React.useState("");

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
        // Keep the local figure; the server remains authoritative.
      }
    }, 400);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [n, ideaId, serverEstimate.nRequested]);

  async function requestPayment() {
    setPreparing(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/fast-track/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n, location_preference: location }),
      });
      const body = await response.json();
      if (!response.ok || !body.contact_url) {
        throw new Error(body.error ?? "We couldn't prepare the payment request.");
      }
      window.location.assign(body.contact_url);
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : "We couldn't prepare the payment request.",
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
        <h1 className="type-display-l text-primary">Arrange your validation round</h1>
        <p className="type-body-l mt-1 max-w-prose text-secondary">
          Choose the people you want to hear from. We will contact you first,
          send your Wise payment link, and start only after payment is confirmed.
        </p>
      </header>

      <div className="mt-4 border-y border-line py-3">
        <p className="type-body-m font-medium text-primary">
          Every response gets a human quality check
        </p>
        <p className="type-caption mt-1 max-w-prose text-secondary">
          We check for detail, relevance, and enough context before it is used
          in your report.
        </p>
      </div>

      <Card elevation="raised" className="mt-6 p-5">
        <InterviewCount
          value={n}
          onChange={setN}
          min={estimate.minInterviews}
          max={estimate.maxInterviews}
        />

        <div className="mt-6 border-t border-line pt-5">
          <label
            htmlFor="location-preference"
            className="type-body-m block font-medium text-primary"
          >
            Where should these people be? <span className="text-tertiary">Optional</span>
          </label>
          <Input
            id="location-preference"
            className="mt-2"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. UK and Ireland, or US healthcare admins"
            maxLength={200}
          />
          <p className="type-caption mt-1.5 text-tertiary">
            Leave it blank and we will look anywhere your people are.
          </p>
        </div>

        <dl className="mt-6 space-y-2.5 border-t border-line pt-5" aria-live="polite">
          <Line
            label={`Validation responses · ${money(estimate.costPerInterviewCents)} each`}
            value={money(estimate.interviewsSubtotalCents)}
          />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="type-body-m text-secondary">Analysis, scoring & report</dt>
            <dd className="text-right">
              <span className="type-caption mr-2 text-tertiary line-through">
                {money(
                  estimate.analysisFeeBaseCents +
                    estimate.analysisFeePerUnitCents * estimate.nRequested,
                )}
              </span>
              <span className="type-body-m font-medium text-brand">100% off · Free</span>
            </dd>
          </div>
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
            onClick={() => void requestPayment()}
            iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
          >
            Email me payment instructions
          </Button>
          <p className="type-caption mt-3 flex items-center justify-center gap-1.5 text-tertiary">
            <ShieldCheckIcon size={14} aria-hidden="true" />
            We will reply with your personal Wise link. Nothing starts until payment is confirmed.
          </p>
        </div>
      </Card>

      <p className="type-caption mt-5 max-w-prose text-tertiary">
        Your own responses and this round can be combined in the same report.
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
