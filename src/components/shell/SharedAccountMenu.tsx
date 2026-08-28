"use client";
import Link from "next/link";
import { User, CreditCard, Sun, Moon, LogOut, LayoutDashboard, Briefcase, ShieldCheck, LayoutGrid } from "lucide-react";

/**
 * Single source of truth for the account modal.
 * Exact replica of StudioApp's dark menu — image reference:
 * #0F172A bg, #1E293B border, slate-300 text, 224px width, 10px SWITCH PORTAL label
 * Do not fork this — all portals import it.
 */
export function SharedAccountMenu({
  name,
  email,
  isLoaded,
  userRoles,
  onManageProfile,
  onThemeToggle,
  theme,
  onSignOut,
  centered = false,
}: {
  name: string;
  email: string;
  isLoaded: boolean;
  userRoles: string[];
  onManageProfile: () => void;
  onThemeToggle: () => void;
  theme: string;
  onSignOut: () => void;
  centered?: boolean;
}) {
  const portalMap: Record<string, { label: string; href: string; icon: React.ElementType }> = {
    ADMIN: { label: "Admin — /admin", href: "/admin", icon: LayoutGrid },
    REVIEWER: { label: "Reviewer — /admin/review", href: "/admin/review", icon: ShieldCheck },
    FREELANCER: { label: "Freelancer — /work", href: "/work", icon: Briefcase },
    FOUNDER: { label: "Founder — /dashboard", href: "/dashboard", icon: LayoutDashboard },
  };
  // Order matches screenshot: Admin, Reviewer, Freelancer, Founder
  const order = ["ADMIN", "REVIEWER", "FREELANCER", "FOUNDER"] as const;
  const hasMulti = userRoles.length > 1;

  return (
    <div
      role="menu"
      className={centered ? "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[224px] rounded-xl border shadow-xl overflow-hidden" : "absolute bottom-full left-0 right-0 mb-2 rounded-xl border shadow-xl overflow-hidden"}
      style={{ background: "#0F172A", borderColor: "#1E293B" }}
    >
      <div className="px-3 py-2.5 border-b" style={{ borderColor: "#1E293B" }}>
        <p className="text-xs font-semibold truncate text-white">{isLoaded ? name : ""}</p>
        <p className="text-[11px] truncate text-slate-400">{isLoaded ? email : ""}</p>
      </div>
      <div className="p-1">
        <button onClick={onManageProfile} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white text-left cursor-pointer">
          <User size={14} /> Manage profile
        </button>
        <Link href="/account" className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white">
          <CreditCard size={14} /> Plan & billing
        </Link>
        <button onClick={onThemeToggle} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white text-left cursor-pointer">
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />} {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
      {hasMulti && (
        <div className="border-t p-1" style={{ borderColor: "#1E293B" }}>
          <p className="text-[10px] font-semibold tracking-widest px-2.5 py-1 text-slate-400">SWITCH PORTAL</p>
          {order.filter((r) => userRoles.includes(r) && portalMap[r]).map((r) => {
            const p = portalMap[r];
            const Icon = p.icon;
            return (
              <Link key={r} href={p.href} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white">
                <Icon size={14} /> {p.label}
              </Link>
            );
          })}
        </div>
      )}
      <div className="border-t p-1" style={{ borderColor: "#1E293B" }}>
        <button onClick={onSignOut} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white text-left cursor-pointer">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}
