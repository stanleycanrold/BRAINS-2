import { getUserWithRoles } from "@/lib/auth";
import { WorkShell } from "@/components/shell/WorkShell";

export default async function ProfilePage() {
  const { roles } = await getUserWithRoles();

  return (
    <WorkShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">My Profile</h1>
          <p className="type-body-m text-secondary mt-1">
            Manage your skills, portfolio, and freelancer profile.
          </p>
        </header>

        <div className="rounded-[12px] border border-line bg-raised p-6 text-center">
          <p className="type-body-m text-secondary">
            Profile management coming soon.
          </p>
        </div>
      </div>
    </WorkShell>
  );
}