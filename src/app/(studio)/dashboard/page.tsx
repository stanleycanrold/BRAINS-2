import type { Metadata } from "next";
import { requireUser, getUserRoles } from "@/lib/auth";
import { listIdeas } from "@/lib/data/ideas";
import { projectWorkspace } from "@/lib/studio/projection";
import type { FullWorkspaceData } from "@/components/empirical/data/mockData";
import { StudioApp } from "@/components/empirical/StudioApp";
import { WORKSPACE_AUTOAUDIT } from "@/components/empirical/data/mockData";

export const metadata: Metadata = { title: "Studio" };

/**
 * The empirical studio: every idea the founder owns, projected into the
 * workspace shape the studio renders (see lib/studio/projection for the
 * seam's rules: never fabricate, never leak respondent identity). An account
 * with no ideas yet opens on the reference workspace so the studio is
 * demonstrable before the first idea is composed.
 */
export default async function StudioDashboardPage() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);
  const ideas = await listIdeas(user.id);

  const map: Record<string, FullWorkspaceData> = {};
  let firstId: string | null = null;
  for (const idea of ideas) {
    map[idea.id] = await projectWorkspace(idea, { ownerName: user.name });
    if (!firstId) firstId = idea.id;
  }

  const workspaces = firstId
    ? map
    : { [WORKSPACE_AUTOAUDIT.meta.id]: WORKSPACE_AUTOAUDIT };
  const initialId = firstId ?? WORKSPACE_AUTOAUDIT.meta.id;

  return (
    <StudioApp initialWorkspaces={workspaces} initialWorkspaceId={initialId} userRoles={roles} />
  );
}
