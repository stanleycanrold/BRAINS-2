"use client";

import Link from "next/link";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import {
  PIPELINE_STAGES,
  stageForStatus,
  type IdeaStatus,
  type PipelineStage,
} from "@/lib/domain/types";

/**
 * Design system §2.2 — the pipeline stepper in the top bar.
 *
 * This is navigation and progress indicator at once, and it is what makes the
 * PRD's "nothing becomes unreachable once you continue" rule actually visible:
 * every stage the founder has reached stays clickable, forever.
 */

const STAGE_LABELS: Record<PipelineStage, string> = {
  entry: "Entry",
  research: "Research",
  validate: "Validate",
  decide: "Decide",
};

function hrefForStage(ideaId: string, stage: PipelineStage): string {
  switch (stage) {
    case "entry":
      return `/ideas/${ideaId}`;
    case "research":
      return `/ideas/${ideaId}/research`;
    case "validate":
      return `/ideas/${ideaId}/validation`;
    case "decide":
      return `/ideas/${ideaId}/report`;
  }
}

export function PipelineStepper({
  ideaId,
  status,
  currentStage,
}: {
  ideaId: string;
  status: IdeaStatus;
  /** Overrides the stage derived from status, for read-only back-navigation. */
  currentStage?: PipelineStage;
}) {
  const reached = stageForStatus(status);
  const reachedIndex = PIPELINE_STAGES.indexOf(reached);
  const activeIndex = PIPELINE_STAGES.indexOf(currentStage ?? reached);

  return (
    <nav aria-label="Pipeline progress">
      <ol className="flex items-center gap-1">
        {PIPELINE_STAGES.map((stage, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < reachedIndex;
          const isReachable = index <= reachedIndex;

          const label = (
            <span className="flex items-center gap-1.5">
              {isComplete ? (
                <CheckIcon
                  size={14}
                  weight="bold"
                  className="text-success"
                  aria-hidden="true"
                />
              ) : null}
              {STAGE_LABELS[stage]}
            </span>
          );

          return (
            <li key={stage} className="flex items-center">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="mx-0.5 h-px w-4 bg-line sm:w-6"
                />
              ) : null}

              {isReachable ? (
                <Link
                  href={hrefForStage(ideaId, stage)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "type-caption rounded-full px-2.5 py-1 transition-colors duration-[120ms]",
                    isActive
                      ? "bg-brand-subtle font-medium text-brand"
                      : "text-secondary hover:bg-wash-hover hover:text-primary",
                  )}
                >
                  {label}
                </Link>
              ) : (
                <span className="type-caption cursor-default px-2.5 py-1 text-tertiary">
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
