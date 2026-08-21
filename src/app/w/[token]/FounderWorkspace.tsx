"use client";

import { AppShell } from "@/components/shell/AppShell";
import { TopBar } from "@/components/shell/AppShell";
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
    <AppShell
      ideas={[{ id: workspace.ideaId, title: workspace.title, status: workspace.status, score: null }]}
      publicWorkspace={{ token, ideaId: workspace.ideaId }}
    >
      <TopBar>
        <span className="type-body-m min-w-0 truncate font-medium text-primary">
          {workspace.title || "Your idea"}
        </span>
      </TopBar>
      <SharedWorkspace
        journey={journey}
        founder={{
          token,
          ideaId: workspace.ideaId,
          permission: workspace.permission,
          questions: workspace.questions,
          intro: workspace.intro,
          paymentStatus: workspace.paymentStatus,
          questionsLocked: workspace.questionsLocked,
        }}
      />
    </AppShell>
  );
}