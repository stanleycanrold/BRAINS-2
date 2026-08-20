"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckCircleIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
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
  const [submitted, setSubmitted] = React.useState(false);

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
        // Keep the local estimate; the server remains authoritative.
      }
    }, 400);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [n, ideaId, serverEstimate.nRequested]);

  async function submitRequest() {
    setPreparing(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/fast-track/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n, location_preference: location }),
      });
      const body = await response.json();
      if (!response.ok || !body.submitted) {
        throw new Error(body.error ?? "We couldn't send your request.");
      }
      setSubmitted(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "We couldn't send your request.", "danger");
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
      <IdeaTopBar ideaId={ideaId} title={state.title} status={state.status} showStepper={false} />

      <Link
        href={`/ideas/${ideaId}/validation`}
        className="type-body-m inline-flex items-center gap-1.5 text-secondary hover:text-primary"
      >
        <ArrowLeftIcon size={15} aria-hidden="true" />
        Back to track options
      </Link>

      {submitted ? (
        <Card elevation="raised" className="mt-8 max-w-[680px] border-brand/40 p-7 lg:p-8">
          <CheckCircleIcon size={30} weight="fill" className="text-brand" aria-hidden="true" />
          <p className="type-eyebrow mt-5 text-brand">Request submitted</p>
          <h1 className="type-display-l mt-2 text-primary">We&rsquo;ll be in touch shortly.</h1>
          <p className="type-body-l mt-3 max-w-prose text-secondary">
            Your request has been sent to the team. We&rsquo;ll reply within the next few hours to confirm the amount and payment details before anything begins.
          </p>
          <p className="type-caption mt-6 text-tertiary">
            {estimate.nRequested} responses · estimated total {money(estimate.totalCents)}
          </p>
        </Card>
      ) : (
        <>
          <header className="mt-4 max-w-[760px]">
            <p className="type-eyebrow text-brand">Fast Track · Estimate</p>
            <h1 className="type-display-l mt-3 text-balance text-primary">See what your validation round costs.</h1>
            <p className="type-body-l mt-3 max-w-[58ch] text-secondary">
              Choose how many people you want to hear from. We&rsquo;ll confirm payment details with you before any work begins.
            </p>
          </header>

          <div className="mt-5 grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-3">
            <Step number="01" title="We reach people" detail="Matched to your audience." />
            <Step number="02" title="We check responses" detail="Detail, relevance, context." />
            <Step number="03" title="You get the answer" detail="Scored report, analysis free." />
          </div>

          <Card elevation="raised" className="mt-5 max-w-[760px] p-5 lg:p-6">
            <InterviewCount value={n} onChange={setN} min={estimate.minInterviews} max={estimate.maxInterviews} />

            <div className="mt-6 border-t border-line pt-5">
              <label htmlFor="location-preference" className="type-body-m block font-medium text-primary">
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
              <p className="type-caption mt-1.5 text-tertiary">Leave it blank and we will look anywhere your people are.</p>
            </div>

            <dl className="mt-6 space-y-2.5 border-t border-line pt-5" aria-live="polite">
              <Line label={`Validation responses · ${money(estimate.costPerInterviewCents)} each`} value={money(estimate.interviewsSubtotalCents)} />
              <div className="flex items-baseline justify-between gap-4">
                <dt className="type-body-m text-secondary">Analysis, scoring & report</dt>
                <dd className="type-body-m font-medium text-brand">Free</dd>
              </div>
              <div className="border-t border-line pt-2.5">
                <Line label="Estimated total" value={money(estimate.totalCents)} emphasis />
              </div>
            </dl>

            <div className="mt-6 border-t border-line pt-5">
              <Button
                variant="primary"
                size="large"
                fullWidth
                loading={preparing}
                onClick={() => void submitRequest()}
                iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
              >
                Request payment details
              </Button>
              <p className="type-caption mt-3 text-center text-tertiary">
                We&rsquo;ll respond within the next few hours.
              </p>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function Step({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <div className="bg-raised p-4">
      <p className="type-eyebrow text-tertiary">{number}</p>
      <p className="type-body-m mt-2 font-medium text-primary">{title}</p>
      <p className="type-caption mt-1 text-secondary">{detail}</p>
    </div>
  );
}

function Line({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={cn("type-body-m", emphasis ? "font-medium text-primary" : "text-secondary")}>{label}</dt>
      <dd className={cn("shrink-0", emphasis ? "type-data-l text-[20px] text-primary" : "type-data-m text-primary")}>{value}</dd>
    </div>
  );
}
