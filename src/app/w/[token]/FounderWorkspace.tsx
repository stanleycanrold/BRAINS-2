"use client";

import { SharedWorkspace } from "@/app/s/[token]/SharedWorkspace";
import type { FounderWorkspace as FounderWorkspaceData, PublicJourney } from "@/lib/data/journey";

export function FounderWorkspace({
  token,
  workspace,
  journey,
}: {
  token: string;
  workspace: FounderWorkspaceData;
  journey: PublicJourney;
}) {
  return (
    <SharedWorkspace
      journey={journey}
      founder={{
        token,
        ideaId: workspace.ideaId,
        permission: workspace.permission,
        questions: workspace.questions,
        intro: workspace.intro,
      }}
    />
  );
}