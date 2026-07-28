import Link from "next/link";
import {
  CheckCircleIcon,
  SpinnerGapIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import type { IdeaState } from "@/lib/domain/types";
import { validationStage } from "@/lib/validation-stage";

/**
 * States that this round is already running.
 *
 * This occupies the slot the Fast Track pitch used to sit in. A founder who
 * has already started gathering answers doesn't need to be sold validation -
 * they need to know where their round stands. Selling to them anyway suggests
 * the product hasn't noticed what they're doing.
 *
 * When they're doing it themselves it still carries the option to hand the
 * interviews over, because that remains genuinely useful mid-round - but as a
 * plain line of text, not a pitch competing with their work.
 */
export function ValidationInProgress({
  ideaId,
  state,
  className,
}: {
  ideaId: string;
  state: IdeaState;
  className?: string;
}) {
  const stage = validationStage(state);
  const order = state.fast_track_order;

  if (stage === "not_started") return null;

  const logged = state.validation.responses.length;

  if (stage === "awaiting_payment") {
    return (
      <Flag
        className={className}
        icon={<ClockIcon size={16} className="text-caution" aria-hidden="true" />}
        title="Payment not finished"
        body="Your Fast Track order is held but hasn't been paid for, so nothing has started yet."
        action={{
          href: `/ideas/${ideaId}/validation/fast-track/checkout`,
          label: "Finish payment",
        }}
      />
    );
  }

  if (stage === "delivered") {
    return (
      <Flag
        className={className}
        icon={
          <CheckCircleIcon
            size={16}
            weight="fill"
            className="text-success"
            aria-hidden="true"
          />
        }
        title="Fast Track round complete"
        body={`All ${order?.completed_count ?? 0} interviews are in and analysed.`}
        action={{
          href: `/ideas/${ideaId}/validation/fast-track/status`,
          label: "See the round",
        }}
      />
    );
  }

  if (stage === "underway") {
    const done = order?.completed_count ?? 0;
    const total = order?.n_requested ?? 0;
    return (
      <Flag
        className={className}
        live
        icon={<SpinnerGapIcon size={16} className="text-brand" aria-hidden="true" />}
        title="Validation in progress"
        body={
          done > 0
            ? `We're running your interviews - ${done} of ${total} done. The report lands on your dashboard when they're all in.`
            : `We're lining up your ${total} interviews. Nothing more for you to do - the report lands on your dashboard.`
        }
        action={{
          href: `/ideas/${ideaId}/validation/fast-track/status`,
          label: "Track progress",
        }}
      />
    );
  }

  // self_serve
  return (
    <Flag
      className={className}
      live
      icon={<SpinnerGapIcon size={16} className="text-brand" aria-hidden="true" />}
      title="Validation in progress"
      body={
        logged > 0
          ? `You're gathering answers yourself - ${logged} logged so far.`
          : "You're gathering answers yourself. Share the link below, and log anything you're told in person."
      }
      // Kept available but not sold: mid-round is exactly when handing the
      // interviews over becomes attractive, and hiding it would be unhelpful.
      action={{
        href: `/ideas/${ideaId}/validation/fast-track/checkout`,
        label: "Have them run for you instead",
      }}
    />
  );
}

function Flag({
  icon,
  title,
  body,
  action,
  live,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: { href: string; label: string };
  live?: boolean;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-[10px] border border-line bg-raised px-4 py-3",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <h3 className="type-body-m flex items-center gap-2 font-medium text-primary">
            {title}
            {live ? (
              <span
                className="size-1.5 shrink-0 animate-pulse rounded-full bg-brand"
                aria-hidden="true"
              />
            ) : null}
          </h3>
          <p className="type-body-m mt-1 text-secondary">{body}</p>
          <Link
            href={action.href}
            className="type-body-m mt-1.5 inline-flex items-center gap-1 text-brand hover:underline"
          >
            {action.label}
            <ArrowRightIcon size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
