"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Home,
  Layers,
  Users,
  Quote,
  Target,
  FlaskConical,
  Radio,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Search,
  ChevronDown,
  Plus,
  Send,
  Menu,
  X,
  Crown,
  Database,
  Plug,
  Boxes,
  Eye,
  BarChart3,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// BRAINS Dashboard Studio — Preview Copy (isolated, does not touch current dashboard)
// Guide: 44px top bar + 224/60 sidepanel + orchestrator canvas
// Tokens from spec §2 — scoped to this preview root only
// ─────────────────────────────────────────────────────────────────────────────

const TOKENS = {
  canvas: "#FAFAFC",
  surfaceCard: "#FFFFFF",
  surfaceSubdued: "#F1F3F9",
  borderNeutral: "#E2E8F0",
  borderFocus: "#9333EA",
  primary: "#7E22CE",
  primaryHover: "#9333EA",
  success: "#059669",
  warning: "#D97706",
  destructive: "#E11D48",
  textHeading: "#0F172A",
  textBody: "#334155",
  textSubdued: "#64748B",
};

const NAV_ITEMS = [
  { id: "home", label: "Workspace Home", icon: Home, active: true },
  { id: "overview", label: "Overview", icon: Layers, badge: "86/100" },
  { id: "audience", label: "Audience", icon: Users, badge: "32" },
  { id: "evidence", label: "Evidence", icon: Quote, badge: "18" },
  { id: "competitors", label: "Competitors", icon: Target },
  { id: "hypotheses", label: "Hypotheses", icon: FlaskConical, badge: "4" },
  { id: "social", label: "Social Scan", icon: Radio },
  { id: "copilot", label: "AI Copilot", icon: Sparkles, badge: "AI" },
  { id: "governance", label: "Governance", icon: ShieldCheck, premium: true },
  { id: "billing", label: "Billing & Usage", icon: CreditCard },
];

export function StudioPreview() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prompt, setPrompt] = useState("i want to build an app to help startup founders validate their ideas");
  const [icpTier, setIcpTier] = useState("Verified ICP");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: TOKENS.canvas, color: TOKENS.textBody, fontFamily: "Inter, Plus Jakarta Sans, system-ui, -apple-system, sans-serif" } as React.CSSProperties}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600&display=swap');
        .preview-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .preview-orbital {
          background: radial-gradient(circle at 50% 35%, rgba(147,51,234,0.08) 0%, transparent 55%),
                      radial-gradient(circle at 50% 35%, rgba(147,51,234,0.06) 0%, transparent 70%),
                      radial-gradient(circle at 50% 35%, rgba(147,51,234,0.04) 0%, transparent 85%);
        }
        .preview-ripple {
          position: absolute; left: 50%; top: 32%; transform: translate(-50%, -50%);
          border: 1px solid rgba(147,51,234,0.12); border-radius: 9999px; pointer-events: none;
        }
      `}</style>

      {/* ── 44px Top Command Bar ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between gap-3 px-3 sm:px-4 border-b shrink-0"
        style={{ height: 44, background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-1.5 rounded-lg border"
            style={{ borderColor: TOKENS.borderNeutral }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <Image
              src="/brains-icon-master.png"
              alt="BRAINS"
              width={22}
              height={22}
              className="rounded-md shrink-0"
              unoptimized priority />
            <span className="text-[15px] font-bold tracking-[0.14em]" style={{ color: TOKENS.textHeading, lineHeight: 1 }}>
              BRAINS
            </span>
          </div>

          <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: TOKENS.textSubdued }}>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium" style={{ background: TOKENS.surfaceSubdued, color: TOKENS.textBody }}>
              Default_Workspace
            </span>
            <ChevronDown size={12} />
            <span className="mx-1">/</span>
            <span className="inline-flex items-center gap-1">
              <Home size={12} /> Workspace Home <ChevronDown size={12} />
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <a href="#" className="hidden sm:inline text-xs font-medium" style={{ color: TOKENS.textSubdued }}>
            Docs
          </a>
          <a href="#" className="hidden sm:inline text-xs font-medium" style={{ color: TOKENS.textSubdued }}>
            Support
          </a>
          <a href="#" className="hidden sm:inline text-xs font-medium" style={{ color: TOKENS.textSubdued }}>
            Feedback
          </a>
          <button
            className="hidden sm:inline-flex w-7 h-7 rounded-full items-center justify-center border"
            style={{ borderColor: TOKENS.borderNeutral, color: TOKENS.textSubdued }}
            aria-label="Toggle theme"
          >
            <Eye size={14} />
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
            style={{ background: TOKENS.primary }}
          >
            <Plus size={14} /> <span className="hidden sm:inline">New Workspace</span><span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidepanel 224 / 60 ── */}
        <aside
          className={`hidden md:flex flex-col border-r shrink-0 transition-all duration-200 ${collapsed ? "w-[60px]" : "w-[224px]"}`}
          style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}
        >
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href="#"
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    item.active ? "font-semibold" : ""
                  }`}
                  style={
                    item.active
                      ? { background: "rgba(147,51,234,0.08)", color: "#6B21A8" }
                      : { color: TOKENS.textBody }
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold preview-mono"
                          style={{
                            background: item.active ? "#F3E8FF" : TOKENS.surfaceSubdued,
                            color: item.active ? "#6B21A8" : TOKENS.textSubdued,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.premium && <Crown size={12} className="text-amber-500" />}
                    </>
                  )}
                </a>
              );
            })}


          </nav>

          {/* Usage block */}
          <div className="p-3 border-t space-y-3" style={{ borderColor: TOKENS.borderNeutral }}>
            {!collapsed ? (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span style={{ color: TOKENS.textSubdued }}>Credits Remaining</span>
                    <span className="preview-mono" style={{ color: TOKENS.textHeading }}>
                      $140
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: TOKENS.surfaceSubdued }}>
                    <div className="h-full rounded-full" style={{ width: "71%", background: TOKENS.primary }} />
                  </div>
                  <div className="flex justify-between text-[10px]" style={{ color: TOKENS.textSubdued }}>
                    <span>Sessions</span>
                    <span>71% used</span>
                  </div>
                  <button
                    className="w-full py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: TOKENS.primary }}
                  >
                    Upgrade Plan
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: TOKENS.borderNeutral }}>
                  <img
                    src="https://i.pravatar.cc/100?img=12"
                    alt="Stanley"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: TOKENS.textHeading }}>
                      Stanley Canrold
                    </div>
                    <div className="text-[11px] truncate" style={{ color: TOKENS.textSubdued }}>
                      Superadmin
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <img src="https://i.pravatar.cc/100?img=12" alt="S" className="w-7 h-7 rounded-full" />
                <div className="w-7 h-1.5 rounded-full" style={{ background: TOKENS.surfaceSubdued }}>
                  <div className="h-full rounded-full" style={{ width: "71%", background: TOKENS.primary }} />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Collapse toggle — vertical centered */}
        <div className="hidden md:block relative w-0 shrink-0">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-white border shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900"
            style={{ borderColor: TOKENS.borderNeutral }}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronDown size={12} className={collapsed ? "-rotate-90" : "rotate-90"} />
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-[44px] bottom-0 w-[224px] bg-white border-r shadow-xl overflow-y-auto" style={{ borderColor: TOKENS.borderNeutral }}>
              <nav className="p-2 space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.id} href="#" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium" style={item.active ? { background: "rgba(147,51,234,0.08)", color: "#6B21A8" } : { color: TOKENS.textBody }}>
                      <Icon size={16} /> {item.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* ── Orchestrator Canvas ── */}
        <main className="flex-1 min-w-0 relative overflow-hidden" style={{ background: TOKENS.canvas }}>
          {/* Concentric orbital ripples */}
          <div className="absolute inset-0 preview-orbital pointer-events-none" />
          <div className="preview-ripple" style={{ width: 520, height: 520, opacity: 0.9 }} />
          <div className="preview-ripple" style={{ width: 720, height: 720, opacity: 0.6 }} />
          <div className="preview-ripple" style={{ width: 920, height: 920, opacity: 0.35 }} />

          <div className="relative max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            {/* Headline */}
            <div className="text-center mb-6">
              <h1
                className="text-[22px] sm:text-[28px] font-bold tracking-tight"
                style={{ color: TOKENS.textHeading, letterSpacing: "-0.025em" }}
              >
                <span style={{ color: TOKENS.textHeading }}>What do you want to</span>{" "}
                <span style={{ color: TOKENS.primary }}>orchestrate</span>{" "}
                <span style={{ color: TOKENS.textHeading }}>today?</span>
              </h1>
            </div>

            {/* Prompt Box */}
            <div
              className="mx-auto max-w-[640px] rounded-2xl border shadow-sm overflow-hidden"
              style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}
            >
              <div className="p-3 sm:p-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder='I want to validate a B2B SaaS for…'
                  className="w-full resize-none bg-transparent outline-none text-sm leading-6 placeholder:text-slate-400"
                  style={{ color: TOKENS.textBody }}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: TOKENS.success }} />
                      <select
                        value={icpTier}
                        onChange={(e) => setIcpTier(e.target.value)}
                        className="text-xs font-medium rounded-full px-2.5 py-1 border outline-none"
                        style={{ background: TOKENS.surfaceSubdued, borderColor: TOKENS.borderNeutral, color: TOKENS.textBody }}
                      >
                        <option>Verified ICP</option>
                        <option>General</option>
                        <option>Highly specialized</option>
                      </select>
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                    </div>
                    <span className="hidden sm:inline text-[11px] px-2 py-1 rounded-full" style={{ background: TOKENS.surfaceSubdued, color: TOKENS.textSubdued }}>
                      48-hr SLA
                    </span>
                  </div>
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm hover:opacity-90 transition-opacity"
                    style={{ background: TOKENS.primary }}
                    aria-label="Send"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Try-these chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs" style={{ color: TOKENS.textSubdued }}>
                Try these
              </span>
              {["Sales Demo Scheduler", "Tech Support Troubleshooter", "Job Interview Coordinator (HR)"].map((label) => (
                <button
                  key={label}
                  onClick={() => setPrompt(`I want to build ${label}`)}
                  className="px-3 py-1.5 rounded-full border text-xs font-medium hover:shadow-sm transition-shadow"
                  style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral, color: TOKENS.textBody }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Validation Sprints */}
            <div className="mt-10 sm:mt-14">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: TOKENS.textHeading }}>
                  Validation Sprints <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: TOKENS.surfaceSubdued, color: TOKENS.textSubdued }}>3</span>
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: TOKENS.textSubdued }} />
                    <input
                      placeholder="Search Agent Graph"
                      className="pl-7 pr-3 py-1.5 rounded-lg border text-xs w-36 sm:w-44 outline-none focus:border-purple-500"
                      style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}
                    />
                  </div>
                  <select className="px-2.5 py-1.5 rounded-lg border text-xs font-medium" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral, color: TOKENS.textBody }}>
                    <option>All types</option>
                    <option>Active</option>
                    <option>Archived</option>
                  </select>
                  <div className="hidden sm:flex rounded-lg border overflow-hidden" style={{ borderColor: TOKENS.borderNeutral }}>
                    <button className="px-3 py-1.5 text-xs font-semibold" style={{ background: "#F3E8FF", color: "#6B21A8" }}>
                      Active
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium bg-white" style={{ color: TOKENS.textSubdued }}>
                      Archive
                    </button>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hidden sm:inline-flex items-center gap-1" style={{ background: TOKENS.primary }}>
                    <Plus size={14} /> New Agent Graph
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { name: "AutoAudit SOC-2", tag: "SOC-2 Compliance", score: 86, status: "GO", color: TOKENS.success, respondents: 14, wtp: "$285", border: TOKENS.success },
                  { name: "DevPulse Copilot", tag: "Dev Infrastructure", score: 78, status: "GO", color: TOKENS.success, respondents: 32, wtp: "$195", border: TOKENS.success },
                  { name: "MediFlow AI Clinic", tag: "Healthcare", score: 42, status: "KILL", color: TOKENS.destructive, respondents: 28, wtp: "—", border: TOKENS.destructive },
                ].map((sprint) => (
                  <div
                    key={sprint.name}
                    className="rounded-xl border p-4 hover:shadow-sm transition-shadow"
                    style={{ background: TOKENS.surfaceCard, borderColor: sprint.score >= 70 ? `${sprint.color}30` : TOKENS.borderNeutral }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full" style={{ background: TOKENS.surfaceSubdued, color: TOKENS.textSubdued }}>
                        {sprint.tag.toUpperCase()}
                      </span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white preview-mono"
                        style={{ background: sprint.color }}
                      >
                        {sprint.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold truncate" style={{ color: TOKENS.textHeading }}>
                      {sprint.name}
                    </h3>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceSubdued }}>
                        <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                          SCORE
                        </div>
                        <div className="text-sm font-bold preview-mono" style={{ color: TOKENS.textHeading }}>
                          {sprint.score}
                          <span className="text-[11px] font-medium" style={{ color: TOKENS.textSubdued }}>
                            /100
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceSubdued }}>
                        <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                          ICPS
                        </div>
                        <div className="text-sm font-bold preview-mono" style={{ color: TOKENS.textHeading }}>
                          {sprint.respondents}
                        </div>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceSubdued }}>
                        <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                          WTP
                        </div>
                        <div className="text-sm font-bold preview-mono" style={{ color: TOKENS.textHeading }}>
                          {sprint.wtp}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: TOKENS.textSubdued }}>
                      <BarChart3 size={12} /> {sprint.respondents} verified · {sprint.wtp !== "—" ? `${sprint.wtp}/mo` : "no anchor"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Approval helper */}
              <div className="mt-6 rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
                <div>
                  <div className="text-xs font-semibold" style={{ color: TOKENS.textHeading }}>
                    Preview copy — not wired to current dashboard
                  </div>
                  <div className="text-xs" style={{ color: TOKENS.textSubdued }}>
                    44px bar + 224/60 panel + orbital canvas + 12px cards. Approve this section and we clone the rest (Overview, Evidence, Pricing curve).
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-1 rounded-full font-medium" style={{ background: "#ECFDF5", color: TOKENS.success, border: "1px solid #A7F3D0" }}>
                    BRAINS — tokens locked
                  </span>
                  <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: TOKENS.surfaceSubdued, color: TOKENS.textSubdued }}>
                    /preview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* watermark */}
      <div className="hidden sm:block fixed bottom-3 right-3 text-[10px] px-2 py-1 rounded-full border bg-white shadow-sm" style={{ borderColor: TOKENS.borderNeutral, color: TOKENS.textSubdued }}>
        Preview — isolated copy
      </div>
    </div>
  );
}
