import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockCountdownIcon,
} from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getIdea, listVersions } from "@/lib/data/ideas";
import { getShareSettings } from "@/lib/data/journey";
import { originFromHeaders } from "@/lib/app-url";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import {
  computeConfirmationRate,
  PIPELINE_STAGES,
  stageForStatus,
  type IdeaStatus,
  type PipelineStage,
} from "@/lib/domain/types";
import { summariseWorkspace } from "@/lib/domain/workspace-summary";
import { IdeaTopBar } from "./IdeaTopBar";
import { SharePanel } from "./SharePanel";

export const metadata: Metadata = { title: "Overview" };

/**
 * B11 - the workspace root.
 *
 * This was a bare `switch` on status that redirected to whichever screen the
 * pipeline was currently on. The reasoning was that a summary screen adds a
 * click without adding information, which held while an idea was one pass
 * through four stages.
 *
 * It stopped holding once an idea outlived a single round. The top bar links
 * here as the workspace's home and landing on it bounced you elsewhere, so
 * there was nowhere that meant "this idea" as a whole - no place for the
 * history, the share link, or anything that is about the idea rather than
 * about the step it happens to be on.
 *
 * The redirect survives as the primary action. Continuing is still one click;
 * it just no longer takes the choice away.
 */

const STAGE_LABELS: Record<PipelineStage, string> = {
  entry: "Entry",
  research: "Research",
  validate: "Validate",
  decide: "Decide",
};

const STAGE_BLURB: Record<PipelineStage, string> = {
  entry: "The idea, in your words. Editable.",
  research: "What the market already says",
  validate: "Questions, people, answers",
  decide: "The score and its reasoning",
};

function hrefForStage(ideaId: string, stage: PipelineStage): string {
  switch (stage) {
    case "entry":
      return `/ideas/${ideaId}/entry`;
    case "research":
      return `/ideas/${ideaId}/research`;
    case "validate":
      return `/ideas/${ideaId}/validation`;
    case "decide":
      return `/ideas/${ideaId}/report`;
  }
}

/** Where Continue goes. The same mapping the old redirect used. */
function continueHref(ideaId: string, status: IdeaStatus): string {
  switch (status) {
    case "draft":
    case "researching":
      return `/ideas/${ideaId}/research`;
    case "validating_normal":
      return `/ideas/${ideaId}/validation/normal`;
    case "validating_fast":
      return `/ideas/${ideaId}/validation`;
    case "gate_review":
    case "passed":
    case "killed":
      return `/ideas/${ideaId}/report`;
    case "needs_rework":
      return `/ideas/${ideaId}/versions`;
  }
}

const CONTINUE_LABEL: Record<IdeaStatus, string> = {
  draft: "Start the research",
  researching: "Open the research",
  validating_normal: "Gather answers",
  validating_fast: "Check round status",
  gate_review: "Read the report",
  passed: "Read the report",
  killed: "Read the report",
  needs_rework: "Pick up the rework",
};

export default async function IdeaOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  const [versions, share, origin] = await Promise.all([
    listVersions(id, user.id),
    getShareSettings(id, user.id),
    originFromHeaders(),
  ]);

  const summary = summariseWorkspace(idea.status, idea.state);
  const reached = stageForStatus(idea.status);
  const reachedIndex = PIPELINE_STAGES.indexOf(reached);
  const gate = idea.state.decision_gate;

  return (
    <>
      <IdeaTopBar
        ideaId={id}
        title={idea.title}
        status={idea.status}
        state={idea.state}
      />

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={idea.status} />
          <span className="type-caption text-tertiary">
            Round {idea.versionNumber} of {versions.length}
          </span>
          <span className="type-caption text-tertiary">
            Updated {formatDistanceToNow(idea.updatedAt, { addSuffix: true })}
          </span>
        </div>

        <h1 className="type-display-l mt-3 text-primary">
          {idea.title || "Your idea"}
        </h1>
        {idea.summary ? (
          <p className="type-body-l mt-2 max-w-[70ch] text-secondary">
            {idea.summary}
          </p>
        ) : null}

        {/* The same summary the dashboard card shows, from the same function,
            so opening a workspace never contradicts the card you clicked. */}
        <p className="type-body-l mt-5 text-primary">{summary.headline}</p>

        {summary.stats.length > 0 ? (
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-line bg-line sm:grid-cols-4">
            {summary.stats.map((stat) => (
              <div key={stat.label} className="bg-page p-4">
                <dt className="type-caption text-tertiary uppercase">
                  {stat.label}
                </dt>
                <dd className="type-body-l mt-1 font-medium text-primary">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {summary.attention ? (
          <p
            className={[
              "type-body-m mt-4 rounded-[8px] border p-3",
              summary.attention.tone === "caution"
                ? "border-caution/40 bg-caution-subtle text-primary"
                : "border-brand/30 bg-brand-subtle text-brand",
            ].join(" ")}
          >
            {summary.attention.text}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink
            href={continueHref(id, idea.status)}
            variant="primary"
            size="large"
            iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
          >
            {CONTINUE_LABEL[idea.status]}
          </ButtonLink>
          {versions.length > 1 ? (
            <ButtonLink href={`/ideas/${id}/versions`}>
              See all {versions.length} rounds
            </ButtonLink>
          ) : null}
        </div>
      </header>

      {/* Every stage reached stays open, forever. The top bar's stepper says
          the same thing, but only once you are inside a stage; this is the
          version you can read at a glance from the root. */}
      <section className="mt-10" aria-labelledby="stages-heading">
        <h2 id="stages-heading" className="type-caption text-tertiary uppercase">
          This round so far
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PIPELINE_STAGES.map((stage, index) => {
            const isComplete = index < reachedIndex;
            const isCurrent = index === reachedIndex;
            const isReachable = index <= reachedIndex;

            const body = (
              <>
                <span className="mt-0.5 shrink-0">
                  {isComplete ? (
                    <CheckCircleIcon
                      size={18}
                      weight="fill"
                      className="text-success"
                      aria-hidden="true"
                    />
                  ) : isCurrent ? (
                    <ClockCountdownIcon
                      size={18}
                      className="text-brand"
                      aria-hidden="true"
                    />
                  ) : (
                    <CircleIcon
                      size={18}
                      className="text-tertiary"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="type-body-m block font-medium text-primary">
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="type-caption mt-0.5 block text-tertiary">
                    {isReachable ? STAGE_BLURB[stage] : "Not reached yet"}
                  </span>
                </span>
              </>
            );

            return isReachable ? (
              <Link
                key={stage}
                href={hrefForStage(id, stage)}
                className="flex items-start gap-3 rounded-[8px] border border-line bg-raised p-4 transition-colors duration-[120ms] hover:border-line-strong"
              >
                {body}
              </Link>
            ) : (
              <div
                key={stage}
                className="flex items-start gap-3 rounded-[8px] border border-dashed border-line p-4 opacity-60"
              >
                {body}
              </div>
            );
          })}
        </div>
      </section>

      {gate?.signal ? (
        <section className="mt-8" aria-labelledby="verdict-heading">
          <h2
            id="verdict-heading"
            className="type-caption text-tertiary uppercase"
          >
            Where this round landed
          </h2>
          <Card className="mt-4 p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="type-data-l text-primary">{gate.score}</span>
              <span className="type-body-m text-tertiary">/ 100</span>
              <span className="type-body-m text-secondary">
                {Math.round(computeConfirmationRate(idea.state.validation.responses) * 100)}% of{" "}
                {idea.state.validation.responses.length} confirmed the problem
              </span>
            </div>
            {gate.reasoning ? (
              <p className="type-body-m mt-3 max-w-[70ch] text-secondary">
                {gate.reasoning}
              </p>
            ) : null}
          </Card>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="share-heading">
        <h2 id="share-heading" className="type-caption text-tertiary uppercase">
          Sharing
        </h2>
        <div className="mt-4">
          <SharePanel
            ideaId={id}
            origin={origin}
            initialToken={share?.shareToken ?? null}
            initialIncludesResponses={share?.shareIncludesResponses ?? false}
          />
        </div>
      </section>
    </>
  );
}
