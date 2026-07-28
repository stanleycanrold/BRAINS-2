"use client";

import * as React from "react";
import Link from "next/link";
import {
  UsersThreeIcon,
  ArrowRightIcon,
  XIcon,
  LightningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { useSessionFlag } from "@/lib/client-state";

/**
 * The Fast Track offer.
 *
 * Two rules shaped this:
 *
 *  1. Lead with the PER-INTERVIEW price, never a total. "From $40 an
 *     interview" invites someone in; "from $530" makes them close the tab
 *     before they've seen that they choose the quantity. The total is honest
 *     and unavoidable at checkout - it just shouldn't be the opening line.
 *
 *  2. Small and dismissible. This is an offer beside the founder's work, not
 *     an interruption of it. A full-width block competes with the thing they
 *     came to do; a compact card in the corner of the section stays available
 *     without demanding anything.
 */

const DISMISS_KEY = "brains-fasttrack-dismissed";

export function FastTrackTeaser({
  ideaId,
  perInterviewPrice,
  responsesLogged,
  className,
  dismissible = true,
}: {
  ideaId: string;
  /** Formatted per-interview price, e.g. "$40" - never a total. */
  perInterviewPrice: string;
  responsesLogged?: number;
  className?: string;
  dismissible?: boolean;
}) {
  // Dismissal sticks for the session only - see useSessionFlag.
  const [dismissed, setDismissed] = useSessionFlag(DISMISS_KEY);

  if (dismissible && dismissed) return null;

  const stalled = typeof responsesLogged === "number" && responsesLogged < 3;

  return (
    <aside
      aria-labelledby="fast-track-teaser"
      className={cn(
        "relative w-full max-w-sm rounded-[10px] border border-brand/25 bg-brand-subtle p-4",
        className,
      )}
    >
      {dismissible ? (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 rounded p-1 text-tertiary transition-colors hover:bg-wash-hover hover:text-primary"
        >
          <XIcon size={14} aria-hidden="true" />
        </button>
      ) : null}

      <div className="flex items-start gap-2.5">
        <LightningIcon
          size={18}
          weight="fill"
          className="mt-0.5 shrink-0 text-brand"
          aria-hidden="true"
        />
        <div className="min-w-0 pr-4">
          <h3 id="fast-track-teaser" className="type-body-l font-medium text-primary">
            {stalled ? "Skip the hard part" : "Validate faster"}
          </h3>

          <p className="type-body-m mt-1 text-secondary">
            Get the interviews done and analysed for you - from{" "}
            <span className="font-medium text-primary">
              {perInterviewPrice} an interview
            </span>
            . You pick how many.
          </p>

          <Link
            href={`/ideas/${ideaId}/validation/fast-track/checkout`}
            className="type-body-m mt-2.5 inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
          >
            See pricing
            <ArrowRightIcon size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

/**
 * A one-line variant for tight spaces - same offer, same per-interview
 * framing, no card.
 */
export function FastTrackInline({
  ideaId,
  perInterviewPrice,
  className,
}: {
  ideaId: string;
  perInterviewPrice: string;
  className?: string;
}) {
  return (
    <Link
      href={`/ideas/${ideaId}/validation/fast-track/checkout`}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-subtle px-3 py-1.5",
        "transition-colors duration-[120ms] hover:border-brand/50",
        className,
      )}
    >
      <UsersThreeIcon size={15} className="shrink-0 text-brand" aria-hidden="true" />
      <span className="type-body-m text-primary">
        Interviews done for you, from {perInterviewPrice} each
      </span>
      <ArrowRightIcon
        size={13}
        aria-hidden="true"
        className="shrink-0 text-brand transition-transform duration-[120ms] group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/**
 * The rework loop, stated plainly.
 *
 * Founders read a low score as a verdict on them and quietly abandon the idea.
 * Saying the loop is unlimited - and that nothing is thrown away - is what
 * turns a "rethink" into a next step instead of an exit.
 */
export function LoopReminder({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "type-body-m rounded-[8px] border border-line bg-raised px-4 py-3 text-secondary",
        className,
      )}
    >
      <span className="font-medium text-primary">
        Validation is a loop, not a verdict.
      </span>{" "}
      If the signal is weak, sharpen the idea and run it again - there&rsquo;s
      no limit on rounds, and every version you&rsquo;ve been through stays
      readable. You can also narrow the next round to a single feature rather
      than the whole product.
    </p>
  );
}
