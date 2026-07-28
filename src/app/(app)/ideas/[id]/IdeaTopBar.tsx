"use client";

import Link from "next/link";
import { TopBar } from "@/components/shell/AppShell";
import { PipelineStepper } from "@/components/shell/PipelineStepper";
import { EngageButton } from "./EngageButton";
import { FastTrackButton } from "./FastTrackButton";
import type { IdeaState, IdeaStatus } from "@/lib/domain/types";

export function IdeaTopBar({
  ideaId,
  title,
  status,
  showStepper = true,
  state,
}: {
  ideaId: string;
  title: string;
  status: IdeaStatus;
  showStepper?: boolean;
  /** When provided, the Engage panel trigger is shown. */
  state?: IdeaState;
}) {
  return (
    <TopBar>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link
          href={`/ideas/${ideaId}`}
          className="type-body-m hidden min-w-0 truncate font-medium text-primary hover:underline sm:block"
        >
          {title || "Your idea"}
        </Link>
        {showStepper ? (
          <PipelineStepper ideaId={ideaId} status={status} />
        ) : null}
        {state ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* Fixed position on every idea screen - see FastTrackButton. */}
            <FastTrackButton ideaId={ideaId} state={state} />
            <EngageButton ideaId={ideaId} state={state} />
          </div>
        ) : null}
      </div>
    </TopBar>
  );
}
