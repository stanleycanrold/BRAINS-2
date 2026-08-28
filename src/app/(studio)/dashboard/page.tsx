import type { Metadata } from "next";
import { requireUser, getUserRoles } from "@/lib/auth";
import { listIdeas } from "@/lib/data/ideas";
import { projectWorkspace } from "@/lib/studio/projection";
import { StudioApp } from "@/components/empirical/StudioApp";
import type { FullWorkspaceData } from "@/lib/domain/empirical-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Studio" };

/**
 * The empirical studio: every idea the founder owns, projected into the
 * workspace shape the studio renders (see lib/studio/projection for the
 * seam's rules: never fabricate, never leak respondent identity). An account
 * with no ideas yet opens on an empty studio ready for the first idea.
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
    : {};
  const initialId = firstId ?? "";

  return (
    <StudioApp initialWorkspaces={workspaces} initialWorkspaceId={initialId} userRoles={roles} />
  );
}
