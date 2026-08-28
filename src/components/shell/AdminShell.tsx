"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";
import { SharedAccountMenu } from "@/components/shell/SharedAccountMenu";
import { Briefcase, Users, ClipboardList, DollarSign, BarChart3, Settings, ChevronDown, Menu, X } from "lucide-react";

const TOKENS = {
  canvas: "#F8FAFC",
  surfaceCard: "#FFFFFF",
  surfaceSubdued: "#E9EEF6",
  borderNeutral: "#DBEAFE",
  primary: "#2563EB",
  textHeading: "#1E3A8A",
  textBody: "#1E293B",
  textSubdued: "#475569",
};

const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: BarChart3 },
  { id: "review", label: "Review Queue", href: "/admin/review", icon: ClipboardList },
  { id: "freelancers", label: "Freelancers", href: "/admin/freelancers", icon: Users },
  { id: "jobs", label: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { id: "payouts", label: "Payouts", href: "/admin/payouts", icon: DollarSign },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminShell({ children, userRoles = [] }: { children: React.ReactNode; userRoles?: string[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <div className="min-h-screen flex flex-col" style={{ background: TOKENS.canvas, color: TOKENS.textBody, fontFamily: "'Fira Sans', system-ui, sans-serif" } as React.CSSProperties}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap');`}</style>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-3 sm:px-4 border-b shrink-0" style={{ height: 44, background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-1.5 rounded-lg border" style={{ borderColor: TOKENS.borderNeutral }} aria-label="Menu">
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <img src="/brains-icon-128.png" alt="" width={20} height={20} className="rounded-md object-contain" style={{ width: 20, height: 20 }} />
            <span className="text-[13px] font-bold tracking-[0.12em]" style={{ color: TOKENS.textHeading, lineHeight: 1 }}>BRAINS</span>
            <span className="text-[13px] font-medium tracking-[0.12em]" style={{ color: TOKENS.textHeading, lineHeight: 1, opacity: 0.7 }}>WORKSPACE</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" />
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className={`hidden md:flex flex-col border-r shrink-0 sticky top-[44px] h-[calc(100vh-44px)] overflow-hidden transition-all duration-200 ${collapsed ? "w-[60px]" : "w-[224px]"}`} style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto min-h-0">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link key={item.id} href={item.href} onClick={() => setMobileOpen(false)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${active ? "font-semibold" : ""}`} style={active ? { background: "rgba(37,99,235,0.08)", color: "#1E40AF" } : { color: TOKENS.textBody }}>
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t shrink-0 sticky bottom-0" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
            <AdminAccountBlock collapsed={collapsed} userRoles={userRoles} />
          </div>
        </aside>

        <div className="hidden md:block relative w-0 shrink-0 sticky top-[44px] h-[calc(100vh-44px)]">
          <button onClick={() => setCollapsed((v) => !v)} className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-white border shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 z-20" style={{ borderColor: TOKENS.borderNeutral }}>
            <ChevronDown size={12} className={collapsed ? "-rotate-90" : "rotate-90"} />
          </button>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-[44px] bottom-0 w-[224px] bg-white border-r shadow-xl overflow-y-auto flex flex-col" style={{ borderColor: TOKENS.borderNeutral }}>
              <nav className="flex-1 p-2 space-y-0.5">
                {ADMIN_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link key={item.id} href={item.href} onClick={() => setMobileOpen(false)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left" style={active ? { background: "rgba(37,99,235,0.08)", color: "#1E40AF" } : { color: TOKENS.textBody }}>
                      <Icon size={16} /> {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t" style={{ borderColor: TOKENS.borderNeutral }}>
                <AdminAccountBlock collapsed={false} userRoles={userRoles} />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto h-[calc(100vh-44px)]" style={{ background: TOKENS.canvas }}>
          <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminAccountBlock({ collapsed, userRoles }: { collapsed: boolean; userRoles: string[] }) {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Admin";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  if (collapsed) {
    return (
      <div ref={ref} className="relative flex flex-col items-center">
        {open && <SharedAccountMenu name={name} email={email} isLoaded={!!isLoaded} userRoles={userRoles} onManageProfile={() => openUserProfile()} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} theme={theme} onSignOut={() => void signOut({ redirectUrl: "/sign-in" })} centered />}
        <button onClick={() => setOpen((v) => !v)} className="p-1 rounded-full hover:bg-slate-100"><Avatar name={name} imageUrl={user?.imageUrl} /></button>
      </div>
    );
  }
  return (
    <div ref={ref} className="relative">
      {open && <SharedAccountMenu name={name} email={email} isLoaded={!!isLoaded} userRoles={userRoles} onManageProfile={() => openUserProfile()} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} theme={theme} onSignOut={() => void signOut({ redirectUrl: "/sign-in" })} />}
      <button onClick={() => setOpen((v) => !v)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left ${open ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
        <Avatar name={name} imageUrl={user?.imageUrl} />
        <span className="min-w-0 flex-1 leading-tight text-left">
          <span className="text-xs font-semibold block truncate" style={{ color: TOKENS.textHeading }}>{isLoaded ? name : ""}</span>
          <span className="text-[11px] block truncate" style={{ color: TOKENS.textSubdued }}>{isLoaded ? email : ""}</span>
        </span>
        <ChevronDown size={12} style={{ color: TOKENS.textSubdued }} className={open ? "rotate-180" : ""} />
      </button>
    </div>
  );
}

function Avatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  return (
    <span className="relative flex size-7 shrink-0 overflow-hidden rounded-full" style={{ background: "#E0E7FF" }}>
      {imageUrl ? <img src={imageUrl} alt="" className="size-7 rounded-full object-cover" /> : <span className="flex size-7 items-center justify-center text-xs font-semibold" style={{ color: "#4F46E5" }}>{name.trim()[0]?.toUpperCase() || "A"}</span>}
    </span>
  );
}
