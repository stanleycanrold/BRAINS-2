"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { WORKSPACE_AUTOAUDIT } from "@/components/empirical/data/mockData";
import type { FullWorkspaceData } from "@/components/empirical/data/mockData";
import { OverviewTab } from "@/components/empirical/components/OverviewTab";
import { AudienceTab } from "@/components/empirical/components/AudienceTab";
import { EvidenceTab } from "@/components/empirical/components/EvidenceTab";
import { CompetitorTab } from "@/components/empirical/components/CompetitorTab";
import { HypothesisTab } from "@/components/empirical/components/HypothesisTab";
import { SocialScanTab } from "@/components/empirical/components/SocialScanTab";
import { SimulatorTab } from "@/components/empirical/components/SimulatorTab";
import { RespondentModal } from "@/components/empirical/components/RespondentModal";
import { CopilotChatBubble } from "@/components/empirical/components/CopilotChatBubble";
import { ToastContainer, ToastMessage } from "@/components/empirical/components/Toast";
import {
  Home,
  Layers,
  Users,
  Quote,
  Target,
  FlaskConical,
  Radio,
  Search,
  ChevronDown,
  Plus,
  Send,
  Menu,
  X,
  BarChart3,
  Share2,
  Download,
  Zap,
  SlidersHorizontal,
} from "lucide-react";

// Design system from ui-ux-pro-max — BRAINS dashboard, dense, minimal, BRAINS primary #2563EB
const TOKENS = {
  canvas: "#F8FAFC", // --color-background
  surfaceCard: "#FFFFFF", // --color-card
  surfaceMuted: "#E9EEF6", // --color-muted
  border: "#DBEAFE", // --color-border
  primary: "#2563EB", // BRAINS icon — replaces purple
  primaryHover: "#1E40AF",
  textHeading: "#1E3A8A", // --color-foreground
  textBody: "#1E293B",
  textSubdued: "#475569", // --color-muted-foreground
  success: "#059669",
  warning: "#D97706",
  destructive: "#DC2626",
} as const;

function statusColor(score: number) {
  if (score >= 70) return TOKENS.success;
  if (score >= 45) return TOKENS.warning;
  return TOKENS.destructive;
}
function statusLabel(score: number) {
  if (score >= 70) return "GO";
  if (score >= 45) return "PIVOT";
  return "KILL";
}

export function DashboardCopy() {
  // Use mock workspaces for preview — not wired to DB, isolated copy
  const [workspacesMap] = useState<Record<string, FullWorkspaceData>>({
    [WORKSPACE_AUTOAUDIT.meta.id]: WORKSPACE_AUTOAUDIT,
  });
  const [currentWorkspaceId] = useState<string>(WORKSPACE_AUTOAUDIT.meta.id);
  const currentWorkspace = workspacesMap[currentWorkspaceId];
  const { meta, respondents, quotes, competitors, hypotheses, socialMentions } = currentWorkspace;

  const [activeTab, setActiveTab] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prompt, setPrompt] = useState("i want to build an app to help startup founders validate their ideas");
  const [sprintSearch, setSprintSearch] = useState("");
  const [sprintFilter, setSprintFilter] = useState<"all" | "active" | "archived">("all");
  const [selectedRespondent, setSelectedRespondent] = useState<any | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (title: string, description?: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const sprints = useMemo(() => {
    const all = Object.values(workspacesMap);
    const q = sprintSearch.toLowerCase();
    return all.filter((w) => {
      if (q && !`${w.meta.name} ${w.meta.tagline}`.toLowerCase().includes(q)) return false;
      if (sprintFilter === "active" && w.meta.overallValidationScore < 45) return false;
      if (sprintFilter === "archived" && w.meta.overallValidationScore >= 45) return false;
      return true;
    });
  }, [workspacesMap, sprintSearch, sprintFilter]);

  const NAV = [
    { id: "home", label: "Workspace Home", icon: Home },
    { id: "overview", label: "Overview & Verdict", icon: Layers, badge: `${meta.overallValidationScore}/100` },
    { id: "audience", label: "Audience & ICP", icon: Users, badge: String(respondents.length) },
    { id: "evidence", label: "Verbatim Quotes", icon: Quote, badge: String(quotes.length) },
    { id: "competitors", label: "Competitors & Wedge", icon: Target, badge: String(competitors.length) },
    { id: "hypotheses", label: "Hypotheses & Rework", icon: FlaskConical, badge: String(hypotheses.length) },
    { id: "social", label: "Live Social Scan", icon: Radio },
    { id: "simulator", label: "Pricing Simulator", icon: SlidersHorizontal },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: TOKENS.canvas, color: TOKENS.textBody, fontFamily: "'Fira Sans', system-ui, sans-serif" } as React.CSSProperties}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap');
        .mono { font-family: 'Fira Code', ui-monospace, monospace; }
        .orbital { background: radial-gradient(circle at 50% 35%, rgba(37,99,235,0.06) 0%, transparent 55%), radial-gradient(circle at 50% 35%, rgba(37,99,235,0.04) 0%, transparent 70%); }
        .ripple { position:absolute; left:50%; top:32%; transform:translate(-50%,-50%); border:1px solid rgba(37,99,235,0.08); border-radius:9999px; pointer-events:none; }
        @media (prefers-reduced-motion: reduce) { .ripple, .orbital { display:none; } .animate-in { animation:none !important; } }
      `}</style>

      {/* 44px Top Bar — master icon is primary */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-3 sm:px-4 border-b shrink-0" style={{ height: 44, background: TOKENS.surfaceCard, borderColor: TOKENS.border }}>
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-1.5 rounded-lg border cursor-pointer" style={{ borderColor: TOKENS.border }} aria-label="Menu">
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <Image src="/brains-icon-master.png" alt="BRAINS" width={20} height={20} className="rounded-md shrink-0" unoptimized priority />
            <span className="text-[11px] font-bold tracking-[0.14em]" style={{ color: TOKENS.textHeading }}>
              BRAINS
            </span>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: TOKENS.textSubdued }}>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium" style={{ background: TOKENS.surfaceMuted, color: TOKENS.textBody }}>
              Default_Workspace
            </span>
            <ChevronDown size={12} />
            <span className="mx-1">/</span>
            <span className="inline-flex items-center gap-1">
              <Home size={12} /> Workspace Home <ChevronDown size={12} />
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline text-[10px] px-2 py-1 rounded-full border" style={{ background: TOKENS.surfaceMuted, borderColor: TOKENS.border, color: TOKENS.textSubdued }}>
            Copy — not merged
          </span>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm cursor-pointer" style={{ background: TOKENS.primary }}>
            <Plus size={14} /> New Workspace
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidepanel 224/60 — density 9, minimal */}
        <aside className={`hidden md:flex flex-col border-r shrink-0 transition-all duration-200 ${collapsed ? "w-[60px]" : "w-[224px]"}`} style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.border }}>
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors duration-150 cursor-pointer ${active ? "font-semibold" : ""}`}
                  style={active ? { background: "#EFF6FF", color: TOKENS.primary, border: `1px solid ${TOKENS.border}` } : { color: TOKENS.textBody }}
                >
                  <Icon size={16} className="shrink-0" aria-hidden="true" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold mono" style={{ background: active ? "#DBEAFE" : TOKENS.surfaceMuted, color: active ? TOKENS.primary : TOKENS.textSubdued }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t" style={{ borderColor: TOKENS.border }}>
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <img src="https://i.pravatar.cc/100?img=12" alt="S" className="w-7 h-7 rounded-full" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: TOKENS.textHeading }}>
                    Stanley canrold
                  </div>
                  <div className="text-[11px] truncate" style={{ color: TOKENS.textSubdued }}>
                    stanleycanrold@gmail.com
                  </div>
                </div>
              </div>
            ) : (
              <img src="https://i.pravatar.cc/100?img=12" alt="S" className="w-7 h-7 rounded-full mx-auto" />
            )}
          </div>
        </aside>

        <div className="hidden md:block relative w-0 shrink-0">
          <button onClick={() => setCollapsed((v) => !v)} className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-white border shadow-sm flex items-center justify-center cursor-pointer" style={{ borderColor: TOKENS.border, color: TOKENS.textSubdued }}>
            <ChevronDown size={12} className={collapsed ? "-rotate-90" : "rotate-90"} />
          </button>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-[44px] bottom-0 w-[224px] bg-white border-r shadow-xl overflow-y-auto" style={{ borderColor: TOKENS.border }}>
              <nav className="p-2 space-y-0.5">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileOpen(false); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left cursor-pointer" style={activeTab === item.id ? { background: "#EFF6FF", color: TOKENS.primary } : { color: TOKENS.textBody }}>
                      <Icon size={16} aria-hidden="true" /> {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main — whole dashboard copy */}
        <main className="flex-1 min-w-0 relative overflow-auto" style={{ background: TOKENS.canvas }}>
          {activeTab === "home" ? (
            <div className="relative">
              <div className="absolute inset-0 orbital pointer-events-none" />
              <div className="ripple" style={{ width: 520, height: 520, opacity: 0.9 }} />
              <div className="ripple" style={{ width: 720, height: 720, opacity: 0.6 }} />
              <div className="relative max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <div className="text-center mb-6">
                  <h1 className="text-[28px] font-bold tracking-tight" style={{ color: TOKENS.textHeading, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
                    What do you want to <span style={{ color: TOKENS.primary }}>orchestrate</span> today?
                  </h1>
                  <p className="text-xs mt-1" style={{ color: TOKENS.textSubdued }}>
                    Copy — whole dashboard with BRAINS blue primary. Approve to merge into /dashboard.
                  </p>
                </div>
                <div className="mx-auto max-w-[640px] rounded-2xl border shadow-sm overflow-hidden" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.border }}>
                  <div className="p-4">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="I want to validate a B2B SaaS for…" className="w-full resize-none bg-transparent outline-none text-sm leading-6 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 rounded-lg" style={{ color: TOKENS.textBody }} aria-label="Describe your idea" />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: TOKENS.success }} aria-hidden="true" />
                        <span className="text-xs font-medium rounded-full px-2.5 py-1 border" style={{ background: TOKENS.surfaceMuted, borderColor: TOKENS.border, color: TOKENS.textBody }}>
                          Verified ICP
                        </span>
                        <span className="hidden sm:inline text-[11px] px-2 py-1 rounded-full" style={{ background: TOKENS.surfaceMuted, color: TOKENS.textSubdued }}>
                          48-hr SLA
                        </span>
                      </div>
                      <button className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm hover:opacity-90 transition-opacity duration-150 cursor-pointer" style={{ background: TOKENS.primary }} aria-label="Send prompt">
                        <Send size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs" style={{ color: TOKENS.textSubdued }}>
                    Try these
                  </span>
                  {["Sales Demo Scheduler", "Tech Support Troubleshooter", "Job Interview Coordinator (HR)"].map((label) => (
                    <button key={label} onClick={() => setPrompt(`I want to build ${label}`)} className="px-3 py-1.5 rounded-full border text-xs font-medium hover:shadow-sm transition-all duration-150 cursor-pointer" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.border, color: TOKENS.textBody }}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: TOKENS.textHeading }}>
                      Validation Sprints <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: TOKENS.surfaceMuted, color: TOKENS.textSubdued }}>{sprints.length}</span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: TOKENS.textSubdued }} aria-hidden="true" />
                        <input value={sprintSearch} onChange={(e) => setSprintSearch(e.target.value)} placeholder="Search sprints" className="pl-7 pr-3 py-1.5 rounded-lg border text-xs w-36 sm:w-44 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.border }} aria-label="Search sprints" />
                      </div>
                      <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value as any)} className="px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.border, color: TOKENS.textBody }}>
                        <option value="all">All types</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sprints.map((ws) => {
                      const score = ws.meta.overallValidationScore;
                      const wtp = ws.meta.willingnessToPayAvg ? `$${ws.meta.willingnessToPayAvg}` : "—";
                      return (
                        <div key={ws.meta.id} className="rounded-xl border p-4 hover:shadow-sm transition-shadow duration-150" style={{ background: TOKENS.surfaceCard, borderColor: score ? `${statusColor(score)}30` : TOKENS.border }}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full truncate" style={{ background: TOKENS.surfaceMuted, color: TOKENS.textSubdued }}>
                              {(ws.meta.tagline || ws.meta.name).slice(0, 22).toUpperCase()}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white mono shrink-0" style={{ background: statusColor(score) }}>
                              {statusLabel(score)}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold truncate" style={{ color: TOKENS.textHeading }}>
                            {ws.meta.name.split("—")[0]}
                          </h3>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceMuted }}>
                              <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                                SCORE
                              </div>
                              <div className="text-sm font-bold mono" style={{ color: TOKENS.textHeading }}>
                                {score}
                                <span className="text-[11px] font-medium" style={{ color: TOKENS.textSubdued }}>
                                  /100
                                </span>
                              </div>
                            </div>
                            <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceMuted }}>
                              <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                                ICPS
                              </div>
                              <div className="text-sm font-bold mono" style={{ color: TOKENS.textHeading }}>
                                {ws.meta.totalRespondents}
                              </div>
                            </div>
                            <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceMuted }}>
                              <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                                WTP
                              </div>
                              <div className="text-sm font-bold mono" style={{ color: TOKENS.textHeading }}>
                                {wtp}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {activeTab === "overview" && <OverviewTab workspace={meta} respondents={respondents} quotes={quotes} competitors={competitors} hypotheses={hypotheses} onSelectTab={setActiveTab} onOpenRespondent={setSelectedRespondent} onOpenFastTrack={() => {}} onShowToast={addToast} />}
              {activeTab === "audience" && <AudienceTab respondents={respondents} targetMarket={meta.targetMarket} onOpenRespondent={setSelectedRespondent} onOpenFastTrack={() => {}} />}
              {activeTab === "evidence" && <EvidenceTab quotes={quotes} respondents={respondents} onOpenRespondent={setSelectedRespondent} onShowToast={addToast} />}
              {activeTab === "competitors" && <CompetitorTab competitors={competitors} workspaceName={meta.name} onSelectTab={setActiveTab} />}
              {activeTab === "hypotheses" && <HypothesisTab hypotheses={hypotheses} onOpenNewHypothesis={() => {}} />}
              {activeTab === "social" && <SocialScanTab mentions={socialMentions} workspace={meta} onShowToast={addToast} />}
              {activeTab === "simulator" && <SimulatorTab />}
            </div>
          )}
        </main>
      </div>

      <RespondentModal respondent={selectedRespondent} onClose={() => setSelectedRespondent(null)} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <CopilotChatBubble meta={meta} respondents={respondents} quotes={quotes} competitors={competitors} hypotheses={hypotheses} onOpenRespondent={setSelectedRespondent} onShowToast={addToast} />
    </div>
  );
}
