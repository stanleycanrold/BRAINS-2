import { getUserWithRoles } from "@/lib/auth";
import { AdminShell } from "@/components/shell/AdminShell";
import Link from "next/link";

export default async function AdminDashboard() {
  const { roles } = await getUserWithRoles();

  return (
    <AdminShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">Admin Console</h1>
          <p className="type-body-m text-secondary mt-1">
            Review submissions, manage freelancers, and oversee the marketplace.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminCard
            title="Review Queue"
            description="Submissions awaiting review"
            href="/admin/review"
            icon="ClipboardTextIcon"
            count={0}
            badge="AI-assisted"
          />
          <AdminCard
            title="Freelancers"
            description="Manage freelancer accounts and ratings"
            href="/admin/freelancers"
            icon="UsersThreeIcon"
            count={0}
          />
          <AdminCard
            title="Jobs"
            description="Oversee posted jobs and assignments"
            href="/admin/jobs"
            icon="BriefcaseIcon"
            count={0}
          />
          <AdminCard
            title="Payouts"
            description="Process and track freelancer payments"
            href="/admin/payouts"
            icon="CurrencyCircleDollarIcon"
            count={0}
          />
          <AdminCard
            title="Analytics"
            description="Platform metrics and insights"
            href="/admin/analytics"
            icon="ChartBarIcon"
          />
          <AdminCard
            title="Settings"
            description="Platform configuration and policies"
            href="/admin/settings"
            icon="CogIcon"
          />
        </div>
      </div>
    </AdminShell>
  );
}

function AdminCard({
  title,
  description,
  href,
  icon,
  count,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  count?: number;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-[12px] border border-line bg-raised p-5 transition-colors hover:border-brand/30 hover:bg-wash-hover"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-brand/10 text-brand">
          <span className="type-caption font-medium">{icon.slice(0, 2)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="type-body-m font-medium text-primary truncate">{title}</h3>
            {badge && (
              <span className="type-caption bg-brand/10 text-brand px-1.5 rounded-full whitespace-nowrap">
                {badge}
              </span>
            )}
          </div>
          <p className="type-body-s text-secondary">{description}</p>
        </div>
      </div>
      {count !== undefined && (
        <span className="type-data-s text-tertiary">{count} items</span>
      )}
    </Link>
  );
}