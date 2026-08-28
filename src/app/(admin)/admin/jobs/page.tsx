import { getUserWithRoles } from "@/lib/auth";
import { AdminShell } from "@/components/shell/AdminShell";

export default async function JobsPage() {
  const { roles } = await getUserWithRoles();

  return (
    <AdminShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">Jobs</h1>
          <p className="type-body-m text-secondary mt-1">
            Oversee posted jobs and assignments.
          </p>
        </header>

        <div className="rounded-[12px] border border-line bg-raised p-6 text-center">
          <p className="type-body-m text-secondary">
            Job management coming soon.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}