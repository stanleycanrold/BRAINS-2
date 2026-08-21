import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { requireUser, isOpsUser, workspaceAccess } from "@/lib/auth";
import { listIdeas } from "@/lib/data/ideas";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resource-level gate: everything under this layout reads founder data, so
  // an unauthenticated visitor is sent to sign-in before any query runs.
  const { userId } = await auth();
  if (!userId && !(await workspaceAccess())) redirect("/sign-in");

  const user = await requireUser();
  const workspace = await workspaceAccess();
  const ideas = await listIdeas(user.id);
  const ops = await isOpsUser();

  return (
    <AppShell
      isOps={ops}
      publicWorkspace={
        workspace
          ? { token: workspace.token, ideaId: workspace.id }
          : undefined
      }
      ideas={ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        status: idea.status,
        score: idea.state.decision_gate?.signal
          ? idea.state.decision_gate.score
          : null,
      }))}
    >
      {children}
    </AppShell>
  );
}
