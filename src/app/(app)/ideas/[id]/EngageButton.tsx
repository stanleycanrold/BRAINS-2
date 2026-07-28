"use client";

import * as React from "react";
import { ChatsCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { SlideOver } from "@/components/ui/SlideOver";
import { Tooltip } from "@/components/ui/Tooltip";
import { EngageWorkspace } from "./engage/EngageWorkspace";
import type { IdeaState } from "@/lib/domain/types";

/**
 * Opens Engage as a side panel rather than a separate destination.
 *
 * Drafting only makes sense against a specific problem and a specific
 * community, so sending the founder to a top-level page meant leaving the
 * context the drafts are about. A slide-over keeps the idea on screen behind
 * it, and returns them exactly where they were.
 */
export function EngageButton({
  ideaId,
  state,
}: {
  ideaId: string;
  state: IdeaState;
}) {
  const [open, setOpen] = React.useState(false);

  const drafts =
    state.social_engagement.drafted_posts.length +
    state.social_engagement.drafted_comments.length;

  return (
    <>
      <Tooltip content="Draft posts and replies" side="bottom">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="type-body-m inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-secondary transition-colors hover:bg-wash-hover hover:text-primary"
        >
          <ChatsCircleIcon size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Engage</span>
          {drafts > 0 ? (
            <span className="type-data-s rounded-full bg-inset px-1.5 text-tertiary">
              {drafts}
            </span>
          ) : null}
        </button>
      </Tooltip>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title="Engage"
        description="Draft something worth reading, make it sound like you, then post it yourself."
        width="lg"
      >
        <EngageWorkspace ideaId={ideaId} initialState={state} embedded />
      </SlideOver>
    </>
  );
}
