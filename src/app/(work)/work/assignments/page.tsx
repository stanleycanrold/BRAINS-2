import { getUserWithRoles } from "@/lib/auth";
import { WorkShell } from "@/components/shell/WorkShell";

export default async function AssignmentsPage() {
  const { roles } = await getUserWithRoles();

  return (
    <WorkShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">My Assignments</h1>
          <p className="type-body-m text-secondary mt-1">
            Track and manage your active and completed work assignments.
          </p>
        </header>

        <div className="rounded-[12px] border border-line bg-raised p-6 text-center">
          <p className="type-body-m text-secondary">
            No active assignments yet. <a href="/work/available" className="text-brand underline">Browse available jobs</a> to get started.
          </p>
        </div>
      </div>
    </WorkShell>
  );
}