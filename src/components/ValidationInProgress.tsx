import Link from "next/link";
import {
  CheckCircleIcon,
  SpinnerGapIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import type { IdeaState } from "@/lib/domain/types";
import { canBuyFastTrack, validationStage } from "@/lib/validation-stage";

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
 * plain line of text, not a pitch competing with their work. That option is
 * only shown when checkout can actually be reached: see canBuyFastTrack.
 */
export function ValidationInProgress({
  ideaId,
  state,
  paymentsEnabled,
  className,
  bare,
}: {
  ideaId: string;
  state: IdeaState;
  /** Whether Stripe is configured. Without it checkout has nowhere to go. */
  paymentsEnabled: boolean;
  className?: string;
  /** Drops the panel chrome, for when it sits inside a card already. */
  bare?: boolean;
}) {
  const stage = validationStage(state);
  const order = state.fast_track_order;

  if (stage === "not_started") return null;

  const logged = state.validation.responses.length;
  const buyable = canBuyFastTrack(state, paymentsEnabled);

  if (stage === "awaiting_payment") {
    return (
      <Flag
        bare={bare}
        className={className}
        icon={<ClockIcon size={16} className="text-caution" aria-hidden="true" />}
        title="Request submitted"
        body="Your Fast Track request is with the team. Nothing has started yet; we will contact you to arrange payment."
        action={{
          href: `/ideas/${ideaId}/validation/fast-track/status`,
          label: "See request status",
        }}
      />
    );
  }

  if (stage === "delivered") {
    return (
      <Flag
        bare={bare}
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
        body={`All ${order?.completed_count ?? 0} validation responses are in and analysed.`}
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
        bare={bare}
        className={className}
        live
        icon={<SpinnerGapIcon size={16} className="text-brand" aria-hidden="true" />}
        title="Validation in progress"
        body={
          done > 0
            ? `We're validating with real people - ${done} of ${total} responses in. The report lands on your dashboard when they're all in.`
            : `We're lining up ${total} validation participants. Nothing more for you to do - the report lands on your dashboard.`
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
      bare={bare}
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
      // Only when it leads somewhere, though - unreachable checkout bounces
      // back to this very page, which reads as a link that does nothing.
      action={
        buyable
          ? {
              href: `/ideas/${ideaId}/validation/fast-track/checkout`,
              label: "Have them run for you instead",
            }
          : undefined
      }
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
  bare,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  /** Omitted when there is nowhere useful to send them. */
  action?: { href: string; label: string };
  live?: boolean;
  className?: string;
  bare?: boolean;
}) {
  return (
    <aside
      className={cn(
        bare
          ? "border-t border-line pt-4"
          : "rounded-[10px] border border-line bg-raised px-4 py-3",
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
          {action ? (
            <Link
              href={action.href}
              className="type-body-m mt-1.5 inline-flex items-center gap-1 text-brand hover:underline"
            >
              {action.label}
              <ArrowRightIcon size={13} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
