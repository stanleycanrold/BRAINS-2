import { getUserWithRoles } from "@/lib/auth";
import { WorkShell } from "@/components/shell/WorkShell";

export default async function SettingsPage() {
  const { roles } = await getUserWithRoles();

  return (
    <WorkShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">Settings</h1>
          <p className="type-body-m text-secondary mt-1">
            Configure notifications, preferences, and payout information.
          </p>
        </header>

        <div className="rounded-[12px] border border-line bg-raised p-6 text-center">
          <p className="type-body-m text-secondary">
            Settings coming soon.
          </p>
        </div>
      </div>
    </WorkShell>
  );
}