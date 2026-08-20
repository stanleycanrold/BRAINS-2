import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { listIdeas } from "@/lib/data/ideas";
import { StatusBadge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { DashboardTopBar } from "./DashboardTopBar";
import { EntryScreen } from "../ideas/new/EntryForm";
import { stageForStatus, type IdeaStatus } from "@/lib/domain/types";
import { formatMoney, marketingFloorPerInterview } from "@/lib/pricing";
import {
  canMarketFastTrack,
  validationStage,
} from "@/lib/validation-stage";
import { fastTrackPaymentsEnabled } from "@/lib/stripe";
import { FastTrackInline, LoopReminder } from "@/components/FastTrackTeaser";
import { summariseWorkspace } from "@/lib/domain/workspace-summary";

export const metadata: Metadata = { title: "Your Ideas" };

/**
 * B1 - Dashboard (design system §4.1).
 *
 * A portfolio view of every idea at every stage. Its empty state is not a "no
 * ideas" message - it IS the entry field (§3.12), so a new account's first
 * screen is an invitation to start rather than a dead end.
 */

/** What the founder should do next, phrased as the action, not the status. */
const NEXT_STEP: Record<IdeaStatus, string> = {
  draft: "Pick up where you left off",
  researching: "See what we found",
  validating_normal: "Log what people told you",
  validating_fast: "See how the validation is going",
  gate_review: "Read your score",
  needs_rework: "Start the next round",
  passed: "Validated - ready to build",
  killed: "Archived",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const ideas = await listIdeas(user.id);

  if (ideas.length === 0) {
    return (
      <>
        <DashboardTopBar />
        <EntryScreen heading="What are you building?" />
      </>
    );
  }

  const live = ideas.filter(
    (i) => i.status !== "killed" && i.status !== "passed",
  );
  const settled = ideas.filter(
    (i) => i.status === "killed" || i.status === "passed",
  );

  /**
   * An idea gathering responses but still short of a usable sample - the
   * founder has met the hard part. That's the only place the Fast Track offer
   * is worth making; anywhere else it's an ad.
   *
   * Deliberately not time-based: reading the clock during render is impure,
   * and "how far along are they" answers the question just as well as "how
   * long since they touched it".
   */
  /**
   * Who the Fast Track offer is for: someone whose research is done but who
   * hasn't yet committed to how they'll gather answers. That's the moment
   * before they'd pay, and the only moment the pitch is useful.
   *
   * Previously this targeted founders already mid-round, which meant selling
   * validation to people who had visibly already started it. A redo lands
   * back here on its own - forkVersion resets the track.
   */
  const readyToChoose = live.find(
    (idea) => idea.state.research_report != null && canMarketFastTrack(idea.state),
  );

  // The per-interview rate, not a total - a total is a door people close.
  // The FLOOR across tiers, so the same offer never appears at two prices in
  // two places. See marketingFloorPerInterview.
  const floor = readyToChoose ? await marketingFloorPerInterview() : null;
  const teaserPrice = floor ? formatMoney(floor.cents, floor.currency) : null;

  return (
    <>
      <DashboardTopBar />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-display-l text-primary">Your ideas</h1>
          <p className="type-body-l mt-1 text-secondary">
            {live.length > 0
              ? `${live.length} in progress${settled.length ? `, ${settled.length} settled` : ""}.`
              : "Everything here has reached a decision."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {readyToChoose && teaserPrice && fastTrackPaymentsEnabled() ? (
            <FastTrackInline
              ideaId={readyToChoose.id}
              perInterviewPrice={teaserPrice}
            />
          ) : null}
          <Link
            href="/ideas/new"
            className="type-body-m inline-flex items-center gap-1.5 text-brand hover:underline"
          >
            Start another
            <ArrowRightIcon size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      {live.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {live.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : null}

      {live.length > 0 ? <LoopReminder className="mt-6" /> : null}

      {settled.length > 0 ? (
        <section className="mt-12">
          <h2 className="type-caption text-tertiary uppercase">Settled</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {settled.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} muted />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function IdeaCard({
  idea,
  muted,
}: {
  idea: Awaited<ReturnType<typeof listIdeas>>[number];
  muted?: boolean;
}) {
  const gate = idea.state.decision_gate;
  const hasScore = Boolean(gate?.signal);
  const stage = stageForStatus(idea.status);
  const roundStage = validationStage(idea.state);
  const summary = summariseWorkspace(idea.status, idea.state);

  return (
    <article
      className={[
        "group relative flex flex-col rounded-[12px] border border-line bg-raised p-5",
        "transition-all duration-[120ms] ease-out",
        "hover:border-line-strong hover:shadow-[var(--shadow-raised-hover)]",
        muted ? "opacity-75 hover:opacity-100" : "shadow-[var(--shadow-raised)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="type-display-m truncate text-primary">
            {/* Stretched link - the whole card is the target (§3.3) */}
            <Link
              href={`/ideas/${idea.id}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {idea.title}
            </Link>
          </h3>
          <p className="type-body-m mt-1.5 line-clamp-2 text-secondary">
            {idea.summary || "No description yet."}
          </p>
        </div>

        {hasScore ? (
          <div className="shrink-0">
            <ScoreGauge score={gate!.score} size="sm" />
          </div>
        ) : null}
      </div>

      {/* Progress through the four pipeline stages, at a glance */}
      <div className="mt-5 flex items-center gap-1" aria-hidden="true">
        {(["entry", "research", "validate", "decide"] as const).map((s, i) => {
          const reachedIndex = ["entry", "research", "validate", "decide"].indexOf(stage);
          return (
            <span
              key={s}
              className={[
                "h-1 flex-1 rounded-full transition-colors",
                i <= reachedIndex
                  ? idea.status === "killed"
                    ? "bg-danger"
                    : idea.status === "passed"
                      ? "bg-success"
                      : "bg-brand"
                  : "bg-line",
              ].join(" ")}
            />
          );
        })}
      </div>

      {/* Where it actually stands, in a sentence and a few numbers. A status
          badge reading "Validating" does not say whether eleven people have
          replied or nobody has, which is the only thing a founder opens the
          dashboard to find out. */}
      <p className="type-body-m mt-4 text-primary">{summary.headline}</p>

      {summary.stats.length > 0 ? (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {summary.stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-1.5">
              <dt className="type-caption text-tertiary">{stat.label}</dt>
              <dd className="type-body-m font-medium text-primary">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={idea.status} />
          {/* Say a paid round is running so the founder doesn't have to open
              the idea to remember it's in hand - but only once payment has
              actually cleared. The idea flips to validating_fast when checkout
              OPENS, so keying off status alone would promise work on an
              abandoned checkout. `pending_sourcing` means unpaid. */}
          {roundStage === "underway" ? (
            <span className="type-caption inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 py-1 text-brand">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              Validation round running
            </span>
          ) : null}
        </div>
        <span className="type-caption text-tertiary">
          {idea.versionNumber > 1 ? `v${idea.versionNumber} · ` : ""}
          {formatDistanceToNow(idea.updatedAt, { addSuffix: true })}
        </span>
      </div>

      {summary.attention ? (
        <p
          className={[
            "type-caption mt-3 rounded-[6px] px-2.5 py-2",
            summary.attention.tone === "caution"
              ? "bg-caution-subtle text-primary"
              : "bg-brand-subtle text-brand",
          ].join(" ")}
        >
          {summary.attention.text}
        </p>
      ) : null}

      <p className="type-body-m mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-brand">
        {NEXT_STEP[idea.status]}
        <ArrowRightIcon
          size={14}
          aria-hidden="true"
          className="transition-transform duration-[120ms] group-hover:translate-x-0.5"
        />
      </p>
    </article>
  );
}
