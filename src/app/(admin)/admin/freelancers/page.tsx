import { getUserWithRoles } from "@/lib/auth";
import { AdminShell } from "@/components/shell/AdminShell";

export default async function FreelancersPage() {
  const { roles } = await getUserWithRoles();

  return (
    <AdminShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">Freelancers</h1>
          <p className="type-body-m text-secondary mt-1">
            Manage freelancer accounts, ratings, and verification.
          </p>
        </header>

        <div className="rounded-[12px] border border-line bg-raised p-6 text-center">
          <p className="type-body-m text-secondary">
            Freelancer management coming soon.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}