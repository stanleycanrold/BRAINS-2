import { getUserWithRoles } from "@/lib/auth";
import { AdminShell } from "@/components/shell/AdminShell";

export default async function ReviewQueuePage() {
  const { roles } = await getUserWithRoles();

  return (
    <AdminShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">Review Queue</h1>
          <p className="type-body-m text-secondary mt-1">
            AI-assisted review of freelancer submissions.
          </p>
        </header>

        <div className="rounded-[12px] border border-line bg-raised p-6 text-center">
          <p className="type-body-m text-secondary">
            No submissions pending review.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}