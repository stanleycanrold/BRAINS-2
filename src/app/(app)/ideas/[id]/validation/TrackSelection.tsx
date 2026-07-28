"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  ArrowRightIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InterviewCount } from "@/components/InterviewCount";
import { useToast } from "@/components/ui/Toast";
import { TopBar } from "@/components/shell/AppShell";
import { PipelineStepper } from "@/components/shell/PipelineStepper";
import { cn } from "@/lib/cn";
import type { IdeaState } from "@/lib/domain/types";
import { ValidationInProgress } from "@/components/ValidationInProgress";
import { recalculate, type Estimate } from "@/lib/pricing-math";

/**
 * B4 — Validation Track Selection (design system §4.4).
 *
 * Two tracks, presented side by side, both converging on the same
 * `validation_report` shape. The tracks differ in who does the legwork and how
 * fast — not in which capabilities are available: questionnaire generation and
 * social engagement assistance are shared by both (PRD §4.3 note).
 */

export function TrackSelection({
  ideaId,
  initialState,
  initialEstimate,
  paymentsEnabled,
}: {
  ideaId: string;
  initialState: IdeaState;
  initialEstimate: Estimate;
  paymentsEnabled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [starting, setStarting] = React.useState(false);
  const [n, setN] = React.useState(
    Math.max(initialEstimate.minInterviews, Math.min(8, initialEstimate.maxInterviews)),
  );
  const [serverEstimate, setServerEstimate] = React.useState(initialEstimate);

  /**
   * Priced in the browser from the coefficients the server sent, so the total
   * moves on the same frame as the slider. The server is still asked to
   * confirm — quietly, debounced — and its answer wins if the two ever differ,
   * because the server figure is what Stripe charges.
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

  async function startNormal() {
    setStarting(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: "normal" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "We couldn't start that track.");
      }
      router.push(`/ideas/${ideaId}/validation/normal`);
    } catch (err) {
      setStarting(false);
      toast(
        err instanceof Error ? err.message : "We couldn't start that track.",
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
      <TopBar>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="type-body-m hidden min-w-0 truncate font-medium text-primary sm:block">
            {initialState.title || "Your idea"}
          </span>
          <PipelineStepper
            ideaId={ideaId}
            status={initialState.status}
            currentStage="validate"
          />
        </div>
      </TopBar>

      <header>
        <h1 className="type-display-l text-primary">
          Time to talk to real people
        </h1>
        <p className="type-body-l mt-1 max-w-prose text-secondary">
          Research tells you the problem probably exists. Only people can tell
          you it matters. Two ways to do that — same report at the end.
        </p>
      </header>

      {/* An abandoned checkout is otherwise invisible here: the order exists
          but the track never moved, so without this the founder has no way
          back to a payment they started. */}
      <ValidationInProgress
        ideaId={ideaId}
        state={initialState}
        className="mt-6"
      />

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-2">
        {/* ── Normal Track ─────────────────────────────────────────────── */}
        <Card elevation="raised" className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="type-display-m text-primary">Do it yourself</h2>
              <p className="type-body-m mt-0.5 text-secondary">
                Self-paced, at your own speed
              </p>
            </div>
            <Badge tone="success">Free</Badge>
          </div>

          <p className="type-body-l mt-4 text-secondary">
            We find the communities where your people already talk, write your
            interview script, and you go have the conversations.
          </p>

          <ul className="mt-5 flex-1 space-y-2.5">
            <Feature>Named communities with real threads to start from</Feature>
            <Feature>An interview script written not to lead the witness</Feature>
            <Feature>Log responses as you go, see the rate update live</Feature>
            <Feature>Same AI analysis and scored report at the end</Feature>
          </ul>

          <div className="mt-6 border-t border-line pt-5">
            <Button
              variant="primary"
              size="large"
              fullWidth
              loading={starting}
              onClick={() => void startNormal()}
              iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
            >
              Start talking to people
            </Button>
            <p className="type-caption mt-2.5 text-center text-tertiary">
              Takes a minute to find your communities
            </p>
          </div>
        </Card>

        {/* ── Fast Track ───────────────────────────────────────────────── */}
        <Card
          elevation="raised"
          className={cn(
            "flex h-full flex-col p-6",
            !paymentsEnabled && "opacity-95",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="type-display-m text-primary">
                Interviews, analysed for you
              </h2>
              <p className="type-body-m mt-0.5 text-secondary">
                Report back in 1&ndash;2 weeks
              </p>
            </div>
            <Badge tone="brand">Paid</Badge>
          </div>

          <p className="type-body-l mt-4 text-secondary">
            Interviews get run against your script, then our AI reads every one
            of them, finds the patterns across all of them, scores the result
            and puts the finished report on your dashboard.
          </p>

          <div className="mt-5 flex-1">
            <InterviewCount
              value={n}
              onChange={setN}
              min={estimate.minInterviews}
              max={estimate.maxInterviews}
            />

            {/* Itemised before committing — PRD §4.3.2 acceptance criteria */}
            <dl
              className="mt-5 space-y-2 rounded-[8px] border border-line bg-page p-4"
              aria-live="polite"
            >
              <Line
                label={`Interviews · ${money(estimate.costPerInterviewCents)} × ${estimate.nRequested}`}
                value={money(estimate.interviewsSubtotalCents)}
              />
              <Line
                label="AI analysis, scoring &amp; report"
                value={money(estimate.analysisFeeCents)}
              />
              <div className="border-t border-line pt-2">
                <Line
                  label="Total"
                  value={money(estimate.totalCents)}
                  emphasis
                />
              </div>
            </dl>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            {paymentsEnabled ? (
              <>
                <Button
                  variant="secondary"
                  size="large"
                  fullWidth
                  onClick={() =>
                    router.push(
                      `/ideas/${ideaId}/validation/fast-track/checkout`,
                    )
                  }
                  iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
                >
                  Review and pay
                </Button>
                <p className="type-caption mt-2.5 text-center text-tertiary">
                  Nobody is contacted until your payment clears.
                </p>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="large"
                  fullWidth
                  disabled
                  iconLeft={<LockSimpleIcon size={16} aria-hidden="true" />}
                >
                  Payment not connected yet
                </Button>
                <p className="type-caption mt-2.5 text-center text-tertiary">
                  Pricing is live — checkout switches on with your Stripe keys.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>

      <p className="type-body-m mt-6 text-tertiary">
        You can switch later. Responses from either route land in the same pool,
        so nothing you gather is wasted.
      </p>
    </>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="type-body-m flex items-start gap-2.5 text-primary">
      <CheckIcon
        size={16}
        weight="bold"
        className="mt-1 shrink-0 text-success"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
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
          emphasis ? "type-body-l font-medium text-primary" : "type-data-m text-primary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
