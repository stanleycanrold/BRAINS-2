import { getUserWithRoles } from "@/lib/auth";
import { WorkShell } from "@/components/shell/WorkShell";
import Link from "next/link";

export default async function WorkDashboard() {
  const { roles } = await getUserWithRoles();

  return (
    <WorkShell userRoles={roles}>
      <div className="space-y-6">
        <header>
          <h1 className="type-display-s font-semibold text-primary">My Work</h1>
          <p className="type-body-m text-secondary mt-1">
            Manage your assignments, track progress, and get paid.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WorkCard
            title="Active Assignments"
            description="Work you're currently doing"
            href="/work/assignments"
            icon="BriefcaseIcon"
            count={0}
          />
          <WorkCard
            title="Available Jobs"
            description="Browse and claim new work"
            href="/work/available"
            icon="UsersThreeIcon"
            count={0}
          />
          <WorkCard
            title="Messages"
            description="Chat with clients and reviewers"
            href="/work/messages"
            icon="ChatTeardropTextIcon"
            count={0}
          />
          <WorkCard
            title="Earnings"
            description="Track your payouts and history"
            href="/work/earnings"
            icon="CurrencyCircleDollarIcon"
            count={0}
          />
          <WorkCard
            title="My Profile"
            description="Skills, portfolio, and ratings"
            href="/work/profile"
            icon="UserIcon"
          />
          <WorkCard
            title="Settings"
            description="Notifications, preferences, payout info"
            href="/work/settings"
            icon="CogIcon"
          />
        </div>
      </div>
    </WorkShell>
  );
}

function WorkCard({
  title,
  description,
  href,
  icon,
  count,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-[12px] border border-line bg-raised p-5 transition-colors hover:border-brand/30 hover:bg-wash-hover"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-brand/10 text-brand">
          {/* Icon placeholder - replace with actual icon import */}
          <span className="type-caption font-medium">{icon.slice(0, 2)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="type-body-m font-medium text-primary truncate">{title}</h3>
          <p className="type-body-s text-secondary">{description}</p>
        </div>
      </div>
      {count !== undefined && (
        <span className="type-data-s text-tertiary">{count} items</span>
      )}
    </Link>
  );
}