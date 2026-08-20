"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
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
  const [step, setStep] = React.useState<1 | 2>(1);
  const [contactUrl, setContactUrl] = React.useState<string | null>(null);

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
      setContactUrl(body.contact_url);
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

      <header className="mt-4 max-w-[760px]">
        <p className="type-eyebrow text-brand">Fast Track · Step {step} of 2</p>
        <h1 className="type-display-l mt-3 text-balance text-primary">
          {step === 1 ? "See your estimate." : "Let's arrange payment."}
        </h1>
        <p className="type-body-l mt-3 max-w-[58ch] text-secondary">
          {step === 1
            ? "Choose how many people you want to hear from and where they should be."
            : "Most clients prefer to arrange larger orders directly. It avoids high card fees and gives us a simpler way to confirm the details together."}
        </p>
      </header>

      {step === 1 ? (
        <div className="mt-5 grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-3">
        <div className="bg-raised p-4">
          <p className="type-eyebrow text-tertiary">01</p>
          <p className="type-body-m mt-2 font-medium text-primary">We reach people</p>
          <p className="type-caption mt-1 text-secondary">Matched to your audience.</p>
        </div>
        <div className="bg-raised p-4">
          <p className="type-eyebrow text-tertiary">02</p>
          <p className="type-body-m mt-2 font-medium text-primary">We check responses</p>
          <p className="type-caption mt-1 text-secondary">Detail, relevance, context.</p>
        </div>
        <div className="bg-raised p-4">
          <p className="type-eyebrow text-tertiary">03</p>
          <p className="type-body-m mt-2 font-medium text-primary">You get the answer</p>
          <p className="type-caption mt-1 text-secondary">Scored report, analysis free.</p>
        </div>
        </div>
      ) : null}

      <Card elevation="raised" className="mt-5 max-w-[760px] p-5 lg:p-6">
        {step === 1 ? (
          <InterviewCount
            value={n}
            onChange={setN}
            min={estimate.minInterviews}
            max={estimate.maxInterviews}
          />
        ) : (
          <div className="border-b border-line pb-5">
            <p className="type-eyebrow text-tertiary">Your estimate</p>
            <p className="type-display-hero mt-2 text-primary">
              {money(estimate.totalCents)}
            </p>
            <p className="type-body-m mt-1 text-secondary">
              {estimate.nRequested} validation responses · analysis and report included free
            </p>
          </div>
        )}

        {step === 1 ? (
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
        ) : null}

        {step === 1 ? (
          <div className="mt-6 border-t border-line pt-5">
            <dl className="space-y-2.5" aria-live="polite">
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
                  <span className="type-body-m font-medium text-brand">Free</span>
                </dd>
              </div>
              <div className="border-t border-line pt-2.5">
                <Line label="Estimated total" value={money(estimate.totalCents)} emphasis />
              </div>
            </dl>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-5 space-y-3">
            <p className="type-body-m text-secondary">
              We&rsquo;ll reply with the payment details and confirm the round before any work begins.
            </p>
            {contactUrl ? (
              <a
                href={contactUrl}
                className="type-body-m inline-flex w-full items-center justify-center rounded-[6px] bg-brand px-4 py-3 font-medium text-on-brand hover:opacity-90"
              >
                Open your email draft
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 border-t border-line pt-5">
          {step === 1 ? (
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={() => setStep(2)}
              iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
            >
              Continue to payment details
            </Button>
          ) : (
            <Button
              variant="primary"
              size="large"
              fullWidth
              loading={preparing}
              onClick={() => void requestPayment()}
              iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
            >
              {contactUrl ? "Send again" : "Contact us about payment"}
            </Button>
          )}
          <p className="type-caption mt-3 text-center text-tertiary">
            {step === 1
              ? "No payment is taken on this screen."
              : "We will confirm the amount with you before anything begins."}
          </p>
        </div>

        {step === 2 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="type-caption mt-4 block w-full text-center text-secondary hover:text-primary"
          >
            Back to estimate
          </button>
        ) : null}

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
