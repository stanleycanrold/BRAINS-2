import { getUserWithRoles } from "@/lib/auth";
import { AdminShell } from "@/components/shell/AdminShell";

export default async function AnalyticsPage() {
  const { roles } = await getUserWithRoles();

  return (
    <AdminShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">Analytics</h1>
          <p className="type-body-m text-secondary mt-1">
            Platform metrics and insights.
          </p>
        </header>

        <div className="rounded-[12px] border border-line bg-raised p-6 text-center">
          <p className="type-body-m text-secondary">
            Analytics dashboard coming soon.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}