import { getUserWithRoles } from "@/lib/auth";
import { WorkShell } from "@/components/shell/WorkShell";
import { TaskDetail } from "@/components/work/TaskDetail";
import Link from "next/link";
import { listIdeas } from "@/lib/data/ideas";

export default async function WorkDashboard() {
  const me = await getUserWithRoles();
  const roles = (me as any).roles || [];
  // Fetch demo tasks from first idea if exists
  let demoTasks: any[] = [];
  let demoAccess: any = null;
  let demoAb: any = null;
  try {
    const { requireUser } = await import("@/lib/auth");
    const u = await requireUser();
    const ideas = await listIdeas(u.id);
    if (ideas[0]) {
      const s:any = ideas[0].state;
      demoTasks = s.tasks || [];
      demoAccess = s.testing_context?.access || s.structured?.testing_context?.access;
      demoAb = s.test_spec?.variant_choice || s.testing_context?.ab_test;
    }
  } catch {}

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
            description="Browse by format: interview, A/B, guided_task"
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
        {demoTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold">Your assignments — per-format detail (F2)</h3>
            {demoTasks.slice(0,3).map((t:any)=> (
              <div key={t.id} className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 font-bold">{t.format} · {t.goal}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.status==="ready"?"bg-emerald-50 text-emerald-700":t.status==="qa"?"bg-amber-50 text-amber-700":"bg-slate-50"}`}>{t.status}</span>
                  {t.spec_version && <span className="text-[11px] text-slate-500">v{t.spec_version}</span>}
                </div>
                <TaskDetail task={t} access={demoAccess} ab_test={demoAb} />
                <div className="flex gap-1.5 text-[11px]">
                  <span className={`px-2 py-0.5 rounded-full border ${t.qa?.automated ? "bg-emerald-50 border-emerald-200" : "bg-slate-50"}`}>automated {t.qa?.automated?"✓":"○"}</span>
                  <span className={`px-2 py-0.5 rounded-full border ${t.qa?.dry_run?.passed ? "bg-emerald-50" : "bg-slate-50"}`}>dry-run {t.qa?.dry_run?.passed?"✓":"○"}</span>
                  <span className={`px-2 py-0.5 rounded-full border ${t.qa?.founder_preview?.approved ? "bg-emerald-50" : "bg-slate-50"}`}>founder preview {t.qa?.founder_preview?.approved?"✓":"○"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 p-4 bg-white rounded-xl border">
          <h3 className="text-xs font-bold">Task Formats (from testing_context)</h3>
          <p className="text-xs text-slate-500">F1 badges: interview / open_review / guided_task / variant_choice (A/B) + goal (G1-G5) + ongoing + device/geo. F2 detail switches per format with QA checklist (automated + dry-run + founder_preview). Live health checks every 6h.</p>
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