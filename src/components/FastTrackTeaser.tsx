"use client";

import Link from "next/link";
import {
  UsersThreeIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/**
 * The Fast Track offer, surfaced where it's actually relevant.
 *
 * Placement is the whole argument: it appears when a founder is stalled part
 * way through gathering responses — the moment they've discovered that finding
 * ten of the right strangers is harder than building was. Selling it on the
 * pricing page or at signup would be selling to someone who hasn't hit the
 * problem yet.
 *
 * The copy names the real friction rather than claiming a benefit. Founders
 * who have just failed to book interviews do not need to be told interviews
 * are valuable; they need to be told they can hand it over.
 */
export function FastTrackTeaser({
  ideaId,
  fromPrice,
  variant = "card",
  responsesLogged,
  className,
}: {
  ideaId: string;
  /** Formatted, e.g. "$590" — the realistic entry point, not a per-unit tease. */
  fromPrice: string;
  variant?: "card" | "inline";
  responsesLogged?: number;
  className?: string;
}) {
  const stalled = typeof responsesLogged === "number" && responsesLogged < 3;

  if (variant === "inline") {
    return (
      <Link
        href={`/ideas/${ideaId}/validation/fast-track/checkout`}
        className={cn(
          "group flex items-center gap-2.5 rounded-[8px] border border-line bg-raised px-3.5 py-2.5",
          "transition-colors duration-[120ms] hover:border-brand/40",
          className,
        )}
      >
        <UsersThreeIcon
          size={18}
          className="shrink-0 text-brand"
          aria-hidden="true"
        />
        <span className="type-body-m min-w-0 flex-1 text-primary">
          Want more interviews, analysed automatically?
        </span>
        <ArrowRightIcon
          size={15}
          aria-hidden="true"
          className="shrink-0 text-tertiary transition-transform duration-[120ms] group-hover:translate-x-0.5"
        />
      </Link>
    );
  }

  return (
    <aside
      aria-labelledby="fast-track-teaser"
      className={cn(
        "rounded-[12px] border border-brand/25 bg-brand-subtle p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-raised">
          <UsersThreeIcon size={20} className="text-brand" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 id="fast-track-teaser" className="type-display-m text-primary">
            {stalled
              ? "Getting interviews done is the slow part"
              : "More interviews, analysed for you"}
          </h3>

          <p className="type-body-l mt-2 max-w-prose text-secondary">
            This is where most ideas stall — not because the founder gave up,
            but because gathering enough conversations takes longer than
            building did. Order a batch and our AI reads every interview, finds
            what recurs across all of them, scores it, and puts the finished
            report on your dashboard. The more you run, the more the result is
            worth trusting.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="type-body-m flex items-center gap-1.5 text-secondary">
              <ClockIcon size={16} aria-hidden="true" />
              Back in 1&ndash;2 weeks
            </span>
            <span className="type-body-m text-secondary">
              From <span className="type-data-m text-primary">{fromPrice}</span>
            </span>
          </div>

          <Link
            href={`/ideas/${ideaId}/validation/fast-track/checkout`}
            className={cn(
              "type-body-m mt-4 inline-flex h-10 items-center gap-2 rounded-[6px] px-4 font-medium",
              "bg-brand text-on-accent transition-colors duration-[120ms] hover:bg-brand-hover",
            )}
          >
            See what it costs
            <ArrowRightIcon size={16} aria-hidden="true" />
          </Link>

          <p className="type-caption mt-2.5 text-tertiary">
            Nothing starts until your payment clears.
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * The rework loop, stated plainly.
 *
 * Founders treat a low score as a verdict on them and quietly abandon the
 * idea. Saying the loop is unlimited — and that nothing is thrown away —
 * is what turns a "rethink" into a next step instead of an exit.
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
      If the signal is weak, sharpen the idea and run it again — there&rsquo;s
      no limit on rounds, and every version you&rsquo;ve been through stays
      readable. You can also narrow the next round to a single feature rather
      than the whole product.
    </p>
  );
}
