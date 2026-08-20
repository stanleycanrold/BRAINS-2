"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircleIcon,
  ClockIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { IdeaTopBar } from "../../../IdeaTopBar";
import { cn } from "@/lib/cn";
import type { IdeaState } from "@/lib/domain/types";

/**
 * B7 - Fast Track: Order Status (design system §4.7).
 *
 * The linear progress bar here is the one legitimate literal progress bar in
 * the product (§3.11): it tracks a real count toward a known total, and the
 * fraction is always shown as text beside it rather than relying on bar length.
 */

type Order = {
  id: string;
  nRequested: number;
  totalCostCents: number;
  currency: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  locationPreference: string;
};

const STAGES = [
  {
    key: "pending_sourcing",
    label: "Order confirmed",
    detail: "Your script and target audience are locked in.",
  },
  {
    key: "scheduling",
    label: "Validation participants being arranged",
    detail: "People are being sourced against your validation questions.",
  },
  {
    key: "in_progress",
    label: "Validation underway",
    detail: "Responses are landing in your pool as people complete the validation.",
  },
  {
    key: "completed",
    label: "Analysed and scored",
    detail:
      "Our AI has read every validation response, found the recurring themes, and built your report.",
  },
] as const;

export function StatusView({
  ideaId,
  state,
  order,
  scheduled,
  completed,
}: {
  ideaId: string;
  state: IdeaState;
  order: Order;
  scheduled: number;
  completed: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const paid = order.paymentStatus === "paid";
  const currentIndex = Math.max(
    0,
    STAGES.findIndex((s) => s.key === order.status),
  );

  /**
   * Confirm the payment on return.
   *
   * The webhook is the authority, but it can lag by seconds - or never arrive
   * at all in local development where nobody is running `stripe listen`. So on
   * return from checkout we ask our server to verify the session against
   * Stripe directly, then fall back to polling in case the webhook is what
   * lands first. Either way the founder shouldn't sit looking at "awaiting
   * confirmation" for a payment that has gone through.
   */
  React.useEffect(() => {
    if (paid || !sessionId) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/ideas/${ideaId}/fast-track/reconcile`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          },
        );
        const body = await response.json();
        if (!cancelled && body.paid) router.refresh();
      } catch {
        // Polling below is the fallback.
      }
    })();

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= 8) clearInterval(timer);
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [paid, sessionId, ideaId, router]);

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order.currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(order.totalCostCents / 100);

  const paymentTone: BadgeTone =
    order.paymentStatus === "paid"
      ? "success"
      : order.paymentStatus === "failed"
        ? "danger"
        : "caution";

  return (
    <>
      <IdeaTopBar
        ideaId={ideaId}
        title={state.title}
        status={state.status}
        showStepper={false}
      />

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-display-l text-primary">
            {paid ? "Validation in progress" : "Request submitted"}
          </h1>
          {paid ? (
            <Badge tone="brand" dot>
              Underway
            </Badge>
          ) : null}
        </div>
        <p className="type-body-l mt-1 max-w-prose text-secondary">
          {paid
            ? "Nothing more for you to do. We gather responses against your questions, our AI analyses every one, and the finished report appears on your dashboard - usually within one to two weeks."
            : "Your payment details have been emailed to you. Complete payment and reply with confirmation before any work begins."}
        </p>
      </header>

      {!paid ? (
        <Card className="mt-6 border-caution/40 bg-caution-subtle p-4">
          <p className="type-body-m flex items-start gap-2 text-primary">
            <ClockIcon
              size={18}
              className="mt-0.5 shrink-0 text-caution"
              aria-hidden="true"
            />
            <span>
              Nothing has started yet. Check your email for the amount and payment link, then reply with payment confirmation.
            </span>
          </p>
        </Card>
      ) : null}

      {/* Order summary */}
      <Card elevation="raised" className="mt-8 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="type-caption text-tertiary uppercase">Your order</h2>
            <p className="type-display-m mt-1.5 text-primary">
              {order.nRequested} people in your validation round
            </p>
            <p className="type-body-m mt-0.5 text-secondary">
              Ordered {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              {order.locationPreference ? ` · ${order.locationPreference}` : ""}
            </p>
          </div>
          <div className="text-right">
            <span className="type-data-l text-[28px] text-primary">{money}</span>
            <div className="mt-1.5 flex justify-end">
              <Badge tone={paymentTone} dot>
                {order.paymentStatus === "paid"
                  ? "Paid"
                  : order.paymentStatus === "failed"
                    ? "Payment failed"
                    : "Awaiting payment details"}
              </Badge>
            </div>
          </div>
        </div>

        {paid ? (
          <div className="mt-6 space-y-4 border-t border-line pt-5">
            <ProgressBar
              value={scheduled}
              total={order.nRequested}
              label="Conversations scheduled"
            />
            <ProgressBar
              value={completed}
              total={order.nRequested}
              label="Responses completed"
            />
          </div>
        ) : null}
      </Card>

      {/* Stage tracker */}
      {paid ? (
        <section className="mt-10" aria-label="Order progress">
          <ol className="space-y-1">
            {STAGES.map((stage, index) => {
              const done = index < currentIndex;
              const current = index === currentIndex;

              return (
                <li key={stage.key} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                        done && "border-success bg-success",
                        current && "border-brand",
                        !done && !current && "border-line",
                      )}
                    >
                      {done ? (
                        <CheckCircleIcon
                          size={12}
                          weight="fill"
                          className="text-on-accent"
                          aria-hidden="true"
                        />
                      ) : current ? (
                        <span className="size-2 rounded-full bg-brand" />
                      ) : null}
                    </span>
                    {index < STAGES.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "my-1 w-px flex-1",
                          done ? "bg-success" : "bg-line",
                        )}
                      />
                    ) : null}
                  </div>

                  <div className={cn("pb-6", !done && !current && "opacity-55")}>
                    <p
                      className={cn(
                        "type-body-l",
                        current ? "font-medium text-primary" : "text-primary",
                      )}
                    >
                      {stage.label}
                    </p>
                    <p className="type-body-m mt-0.5 text-secondary">
                      {stage.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {order.status === "completed" ? (
            <Button
              variant="primary"
              size="large"
              className="mt-2"
              onClick={() => router.push(`/ideas/${ideaId}/report`)}
            >
              Read your report
            </Button>
          ) : null}
        </section>
      ) : null}

      {order.paymentStatus === "failed" ? (
        <Card className="mt-8 border-danger-border bg-danger-subtle p-5">
          <p className="type-body-l flex items-start gap-2.5 text-primary">
            <WarningIcon
              size={20}
              className="mt-0.5 shrink-0 text-danger"
              aria-hidden="true"
            />
            <span>
              That payment didn&rsquo;t go through, so nothing was charged and
              no work has started. You can try again whenever you like.
            </span>
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() =>
              router.push(`/ideas/${ideaId}/validation/fast-track/checkout`)
            }
          >
            Try again
          </Button>
        </Card>
      ) : null}
    </>
  );
}
