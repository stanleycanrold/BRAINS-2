"use client";
/**
 * BRAINS Dashboard Studio — wired to validation engine
 * Design guide tokens (44px bar + 224/60 panel) applied to PREVIOUS dashboard's
 * full feature set — nothing important removed. Only agent-infra fluff (Tools/Env/MCP/RAG)
 * left out as irrelevant.
 */

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FullWorkspaceData } from "./data/mockData";
import { Respondent, Hypothesis } from "./types";
import { OverviewTab } from "./components/OverviewTab";
import { AudienceTab } from "./components/AudienceTab";
import { EvidenceTab } from "./components/EvidenceTab";
import { CompetitorTab } from "./components/CompetitorTab";
import { HypothesisTab } from "./components/HypothesisTab";
import { SocialScanTab } from "./components/SocialScanTab";
import { AiAssistantTab } from "./components/AiAssistantTab";
import { SimulatorTab } from "./components/SimulatorTab";
import { RespondentModal } from "./components/RespondentModal";
import { ShareModal } from "./components/ShareModal";
import { ExportModal } from "./components/ExportModal";
import { NewHypothesisModal } from "./components/NewHypothesisModal";
import { FastTrackModal } from "./components/FastTrackModal";
import { IdeaComposerModal } from "./components/IdeaComposerModal";
import { InvestorModeBanner } from "./components/InvestorModeBanner";
import { CopilotChatBubble } from "./components/CopilotChatBubble";
import { ToastContainer, ToastMessage } from "./components/Toast";
import { useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";
import {
  Home,
  Layers,
  Users,
  Quote,
  Target,
  FlaskConical,
  Radio,
  Sparkles,
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
  Eye,
  ShieldCheck,
  SlidersHorizontal,
  User,
  CreditCard,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

interface StudioAppProps {
  initialWorkspaces: Record<string, FullWorkspaceData>;
  initialWorkspaceId: string;
}

const TOKENS = {
  canvas: "#F8FAFC", // skill — Minimalism dense
  surfaceCard: "#FFFFFF",
  surfaceSubdued: "#E9EEF6",
  borderNeutral: "#DBEAFE",
  primary: "#2563EB", // BRAINS icon — replaces purple
  primaryHover: "#1E40AF",
  success: "#059669",
  warning: "#D97706",
  destructive: "#DC2626",
  textHeading: "#1E3A8A",
  textBody: "#1E293B",
  textSubdued: "#475569",
};

function statusColor(score: number, hasFeedback?: boolean, count?: number) {
  if (!hasFeedback || (count !== undefined && count < 5)) return TOKENS.textSubdued;
  if (score >= 70) return TOKENS.success;
  if (score >= 45) return TOKENS.warning;
  return TOKENS.destructive;
}
function statusLabel(score: number, hasFeedback?: boolean, count?: number) {
  if (!hasFeedback || (count !== undefined && count < 5)) return "—";
  if (score >= 70) return "GO";
  if (score >= 45) return "PIVOT";
  return "RETHINK";
}

export function StudioApp({ initialWorkspaces, initialWorkspaceId }: StudioAppProps) {
  const router = useRouter();
  const [workspacesMap, setWorkspacesMap] = useState<Record<string, FullWorkspaceData>>(initialWorkspaces);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(initialWorkspaceId);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sprintSearch, setSprintSearch] = useState("");
  const [sprintFilter, setSprintFilter] = useState<"all" | "active" | "archived">("all");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prompt, setPrompt] = useState("i want to build an app to help startup founders validate their ideas");
  const [isInvestorMode, setIsInvestorMode] = useState(false);
  const [isTopSwitcherOpen, setIsTopSwitcherOpen] = useState(false);
  const [selectedRespondent, setSelectedRespondent] = useState<Respondent | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFastTrackOpen, setIsFastTrackOpen] = useState(false);
  const [isNewHypothesisOpen, setIsNewHypothesisOpen] = useState(false);
  const [isIdeaComposerOpen, setIsIdeaComposerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const currentWorkspace = workspacesMap[currentWorkspaceId] || Object.values(workspacesMap)[0];
  const { meta, respondents, quotes, competitors, hypotheses, socialMentions } = currentWorkspace;

  const handleSelectWorkspace = (wsId: string) => {
    setCurrentWorkspaceId(wsId);
    setActiveTab("overview");
    setMobileOpen(false);
  };
  const handleWorkspaceCreated = (newWs: FullWorkspaceData) => {
    setWorkspacesMap((prev) => ({ [newWs.meta.id]: newWs, ...prev }));
    setCurrentWorkspaceId(newWs.meta.id);
    setActiveTab("overview");
    addToast("Validation Sprint Created", `"${newWs.meta.name.split("—")[0]}" is now active`, "success");
  };
  const handleAddHypothesis = (newHyp: Hypothesis) => {
    setWorkspacesMap((prev) => {
      const active = prev[currentWorkspaceId];
      if (!active) return prev;
      return { ...prev, [currentWorkspaceId]: { ...active, hypotheses: [newHyp, ...active.hypotheses] } };
    });
  };
  const handleRespondentsAdded = (newResps: Respondent[]) => {
    setWorkspacesMap((prev) => {
      const active = prev[currentWorkspaceId];
      if (!active) return prev;
      return { ...prev, [currentWorkspaceId]: { ...active, respondents: [...newResps, ...active.respondents], meta: { ...active.meta, totalRespondents: active.meta.totalRespondents + newResps.length } } };
    });
  };

  const sprints = useMemo(() => {
    const all = Object.values(workspacesMap).filter((w) => w.meta.id !== "empty-workspace");
    const q = sprintSearch.toLowerCase();
    return all.filter((w) => {
      if (q && !`${w.meta.name} ${w.meta.tagline}`.toLowerCase().includes(q)) return false;
      const hasFeedback = w.meta.totalRespondents > 0;
      const count = w.meta.totalRespondents;
      const score = w.meta.overallValidationScore;
      const isRethink = hasFeedback && count >= 5 && score < 45;
      // Before 5 responses, never bucket as archived — awaiting opinions
      if (sprintFilter === "active" && isRethink) return false;
      if (sprintFilter === "archived" && !isRethink) return false;
      return true;
    });
  }, [workspacesMap, sprintSearch, sprintFilter]);

  // Marketing-friendly nav — founder-to-founder (see .agents/product-marketing.md)
  const NAV = [
    { id: "home", label: "Home", icon: Home },
    { id: "overview", label: "Decision", icon: Layers, badge: meta.overallValidationScore ? `${meta.overallValidationScore}/100` : undefined },
    { id: "audience", label: "ICP Responses", icon: Users, badge: String(respondents.length) },
    { id: "evidence", label: "What they said", icon: Quote, badge: String(quotes.length) },
    { id: "competitors", label: "Alternatives", icon: Target, badge: competitors.length ? String(competitors.length) : undefined },
    { id: "hypotheses", label: "Assumptions", icon: FlaskConical, badge: hypotheses.length ? String(hypotheses.length) : undefined },
    { id: "social", label: "Community", icon: Radio },
    { id: "simulator", label: "Pricing", icon: SlidersHorizontal },
  ];

  return (
    <>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: TOKENS.canvas, color: TOKENS.textBody, fontFamily: "'Fira Sans', system-ui, sans-serif" } as React.CSSProperties}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap');
          .mono { font-family: 'Fira Code', ui-monospace, monospace; }
          .orbital { background: radial-gradient(circle at 50% 35%, rgba(37,99,235,0.06) 0%, transparent 55%), radial-gradient(circle at 50% 35%, rgba(37,99,235,0.04) 0%, transparent 70%); }
          .ripple { position:absolute; left:50%; top:32%; transform:translate(-50%,-50%); border:1px solid rgba(37,99,235,0.08); border-radius:9999px; pointer-events:none; }
          @media (prefers-reduced-motion: reduce) { .ripple, .orbital { display:none; } }
        `}</style>

        {/* 44px Top Bar — master icon + ideas switcher at top */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-3 sm:px-4 border-b shrink-0" style={{ height: 44, background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-1.5 rounded-lg border" style={{ borderColor: TOKENS.borderNeutral }} aria-label="Menu">
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              <img src="/brains-icon-128.png" alt="" width={22} height={22} className="rounded-md shrink-0 object-contain" style={{ width: 22, height: 22 }} />
              <span className="text-[15px] font-bold tracking-[0.14em]" style={{ color: TOKENS.textHeading, lineHeight: 1 }}>
                BRAINS
              </span>
            </div>
            {/* Ideas switcher — now the primary top control, Default_Workspace removed */}
            <div className="hidden sm:flex items-center gap-1 text-xs min-w-0 relative" style={{ color: TOKENS.textSubdued }}>
              <div className="relative">
                <button
                  onClick={() => setIsTopSwitcherOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium hover:shadow-sm"
                  style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral, color: TOKENS.textHeading }}
                >
                  <Home size={12} />
                  <span className="truncate max-w-[200px]">{meta.name.split("—")[0].trim() || "Select idea"}</span>
                  <ChevronDown size={12} style={{ color: TOKENS.textSubdued }} />
                </button>
                {isTopSwitcherOpen && (
                  <>
                    <button className="fixed inset-0 z-10" onClick={() => setIsTopSwitcherOpen(false)} aria-label="Close" />
                    <div className="absolute left-0 top-full mt-1.5 w-72 rounded-xl border shadow-lg z-20 overflow-hidden" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
                      <div className="px-3 py-2 border-b text-[11px] font-semibold" style={{ borderColor: TOKENS.borderNeutral, color: TOKENS.textSubdued }}>
                        Your ideas
                      </div>
                      <div className="max-h-64 overflow-y-auto p-1">
                        {Object.values(workspacesMap)
                          .filter((w) => w.meta.id !== "empty-workspace")
                          .map((ws) => (
                            <button
                              key={ws.meta.id}
                              onClick={() => {
                                handleSelectWorkspace(ws.meta.id);
                                setIsTopSwitcherOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 hover:shadow-sm"
                              style={ws.meta.id === currentWorkspaceId ? { background: "rgba(37,99,235,0.08)", color: "#1E40AF" } : { color: TOKENS.textBody }}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">{ws.meta.name.split("—")[0].trim()}</div>
                                <div className="text-[11px] truncate" style={{ color: TOKENS.textSubdued }}>
                                  {ws.meta.tagline.slice(0, 48)}
                                </div>
                              </div>
                              <span className="text-[11px] font-semibold mono px-1.5 py-0.5 rounded-full shrink-0" style={{ background: TOKENS.surfaceSubdued, color: TOKENS.textSubdued }}>
                                {ws.meta.totalRespondents >= 5 ? `${ws.meta.overallValidationScore}/100` : "—"}
                              </span>
                            </button>
                          ))}
                        {Object.values(workspacesMap).filter((w) => w.meta.id !== "empty-workspace").length === 0 && (
                          <div className="px-2.5 py-3 text-xs text-center" style={{ color: TOKENS.textSubdued }}>
                            No ideas yet — describe one above to get your first verdict.
                          </div>
                        )}
                      </div>
                      <div className="p-2 border-t" style={{ borderColor: TOKENS.borderNeutral }}>
                        <button onClick={() => { setIsTopSwitcherOpen(false); setIsIdeaComposerOpen(true); }} className="w-full py-1.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1" style={{ background: TOKENS.primary }}>
                          <Plus size={12} /> New Workspace
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {activeTab !== "home" && (
                <>
                  <span className="mx-1">/</span>
                  <span className="font-medium truncate" style={{ color: TOKENS.textHeading }}>
                    {NAV.find((n) => n.id === activeTab)?.label || "Overview"}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="relative hidden lg:block">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: TOKENS.textSubdued }} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search evidence..." className="pl-6 pr-2 py-1 rounded-lg border text-xs w-36 outline-none" style={{ background: TOKENS.surfaceSubdued, borderColor: TOKENS.borderNeutral }} />
            </div>
            <button onClick={() => setIsInvestorMode((v) => !v)} className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border" style={isInvestorMode ? { background: "#FFFBEB", color: "#92400E", borderColor: "#FDE68A" } : { background: TOKENS.surfaceCard, color: TOKENS.textSubdued, borderColor: TOKENS.borderNeutral }}>
              <Eye size={12} /> {isInvestorMode ? "Investor" : "Founder"}
            </button>
            <button onClick={() => setIsFastTrackOpen(true)} className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border" style={{ background: TOKENS.surfaceCard, color: TOKENS.textBody, borderColor: TOKENS.borderNeutral }}>
              <Zap size={12} className="text-amber-500" /> Fast Track
            </button>
            <button onClick={() => setIsExportOpen(true)} className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border" style={{ background: TOKENS.surfaceCard, color: TOKENS.textBody, borderColor: TOKENS.borderNeutral }}>
              <Download size={12} /> Export
            </button>
            <button onClick={() => setIsShareOpen(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: TOKENS.primary }}>
              <Share2 size={12} /> Share
            </button>
            <button onClick={() => setIsIdeaComposerOpen(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: TOKENS.primary }}>
              <Plus size={12} /> <span className="hidden sm:inline">New Workspace</span>
            </button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Sidepanel 224/60 — sticky, profile sticky at bottom */}
          <aside className={`hidden md:flex flex-col border-r shrink-0 sticky top-[44px] h-[calc(100vh-44px)] overflow-hidden transition-all duration-200 ${collapsed ? "w-[60px]" : "w-[224px]"}`} style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto min-h-0">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${active ? "font-semibold" : ""}`}
                    style={active ? { background: "rgba(37,99,235,0.08)", color: "#1E40AF" } : { color: TOKENS.textBody }}
                  >
                    <Icon size={16} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold mono" style={{ background: active ? "#DBEAFE" : TOKENS.surfaceSubdued, color: active ? "#1E40AF" : TOKENS.textSubdued }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t space-y-3 shrink-0 sticky bottom-0 z-10" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
              {!collapsed && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span style={{ color: TOKENS.textSubdued }}>Credits</span>
                    <span className="mono" style={{ color: TOKENS.textHeading }}>
                      $140
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: TOKENS.surfaceSubdued }}>
                    <div className="h-full rounded-full" style={{ width: "71%", background: TOKENS.primary }} />
                  </div>
                  <button className="w-full py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: TOKENS.primary }}>
                    Upgrade Plan
                  </button>
                </div>
              )}
              <StudioAccountBlock collapsed={collapsed} />
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
              <div className="absolute left-0 top-[44px] bottom-0 w-[224px] bg-white border-r shadow-xl overflow-y-auto" style={{ borderColor: TOKENS.borderNeutral }}>
                <nav className="p-2 space-y-0.5">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileOpen(false); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left" style={activeTab === item.id ? { background: "rgba(37,99,235,0.08)", color: "#1E40AF" } : { color: TOKENS.textBody }}>
                        <Icon size={16} /> {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

          {/* Main — scrolls, sidepanel stays */}
          <main className="flex-1 min-w-0 relative overflow-y-auto h-[calc(100vh-44px)]" style={{ background: TOKENS.canvas }}>
            {isInvestorMode && (
              <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <div className="rounded-xl border p-3 flex items-center gap-2 text-xs" style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}>
                  <ShieldCheck size={14} /> Investor view — verified counts only, respondent identities hidden.
                </div>
              </div>
            )}
            {activeTab === "home" ? (
              <div className="relative">
                <div className="absolute inset-0 orbital pointer-events-none" />
                <div className="ripple" style={{ width: 520, height: 520, opacity: 0.9 }} />
                <div className="ripple" style={{ width: 720, height: 720, opacity: 0.6 }} />
                <div className="ripple" style={{ width: 920, height: 920, opacity: 0.35 }} />
                <div className="relative max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                  <div className="text-center mb-6">
                    <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight" style={{ color: TOKENS.textHeading, letterSpacing: "-0.025em" }}>
                      What are you <span style={{ color: TOKENS.primary }}>building</span>?
                    </h1>
                    <p className="text-xs mt-1" style={{ color: TOKENS.textSubdued }}>
                      {meta.name !== "No validations yet" ? `Active: ${meta.name} — ${meta.tagline.slice(0, 80)}` : "Describe your idea — we’ll test it with real customers in 48 hours."}
                    </p>
                  </div>
                  <div className="mx-auto max-w-[640px] rounded-2xl border shadow-sm overflow-hidden" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
                    <div className="p-3 sm:p-4">
                      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="I want to validate a B2B SaaS for…" className="w-full resize-none bg-transparent outline-none text-sm leading-6 placeholder:text-slate-400" style={{ color: TOKENS.textBody }} />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: TOKENS.success }} />
                          <span className="text-xs font-medium rounded-full px-2.5 py-1 border" style={{ background: TOKENS.surfaceSubdued, borderColor: TOKENS.borderNeutral, color: TOKENS.textBody }}>
                            Verified ICP
                          </span>
                          <span className="hidden sm:inline text-[11px] px-2 py-1 rounded-full" style={{ background: TOKENS.surfaceSubdued, color: TOKENS.textSubdued }}>
                            48-hr SLA
                          </span>
                        </div>
                        <button onClick={() => setIsIdeaComposerOpen(true)} className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm hover:opacity-90" style={{ background: TOKENS.primary }} aria-label="Send">
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-xs" style={{ color: TOKENS.textSubdued }}>
                      Try an example
                    </span>
                    {["Sales Demo Scheduler", "Tech Support Troubleshooter", "Job Interview Coordinator (HR)"].map((label) => (
                      <button key={label} onClick={() => setPrompt(`I want to build ${label}`)} className="px-3 py-1.5 rounded-full border text-xs font-medium hover:shadow-sm" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral, color: TOKENS.textBody }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-10 sm:mt-12">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: TOKENS.textHeading }}>
                        Your ideas <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: TOKENS.surfaceSubdued, color: TOKENS.textSubdued }}>{sprints.length}</span>
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: TOKENS.textSubdued }} />
                          <input value={sprintSearch} onChange={(e) => setSprintSearch(e.target.value)} placeholder="Search sprints" className="pl-7 pr-3 py-1.5 rounded-lg border text-xs w-36 sm:w-44 outline-none" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }} />
                        </div>
                        <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value as any)} className="px-2.5 py-1.5 rounded-lg border text-xs font-medium" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral, color: TOKENS.textBody }}>
                          <option value="all">All types</option>
                          <option value="active">Active</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button onClick={() => setIsIdeaComposerOpen(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hidden sm:inline-flex items-center gap-1" style={{ background: TOKENS.primary }}>
                          <Plus size={14} /> New Sprint
                        </button>
                      </div>
                    </div>

                    {sprints.length === 0 ? (
                      <div className="rounded-xl border p-8 text-center" style={{ background: TOKENS.surfaceCard, borderColor: TOKENS.borderNeutral }}>
                        <p className="text-sm font-medium" style={{ color: TOKENS.textHeading }}>
                          No sprints yet
                        </p>
                        <p className="text-xs mt-1" style={{ color: TOKENS.textSubdued }}>
                          Orchestrate your first idea above — it becomes a sprint here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {sprints.map((ws) => {
                          const score = ws.meta.overallValidationScore;
                          const hasFeedback = ws.meta.totalRespondents > 0;
                          const count = ws.meta.totalRespondents;
                          const wtp = ws.meta.willingnessToPayAvg ? `$${ws.meta.willingnessToPayAvg}` : "—";
                          return (
                            <button key={ws.meta.id} onClick={() => handleSelectWorkspace(ws.meta.id)} className="text-left rounded-xl border p-4 hover:shadow-sm transition-shadow" style={{ background: TOKENS.surfaceCard, borderColor: hasFeedback && score ? `${statusColor(score, hasFeedback, count)}30` : TOKENS.borderNeutral }}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="text-[15px] font-bold leading-tight flex-1 min-w-0 line-clamp-2" style={{ color: TOKENS.textHeading }}>
                                  {ws.meta.name.split("—")[0].trim()}
                                </h3>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white mono shrink-0 mt-0.5" style={{ background: statusColor(score, hasFeedback, count) }}>
                                  {statusLabel(score, hasFeedback, count)}
                                </span>
                              </div>
                              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceSubdued }}>
                                  <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                                    SCORE
                                  </div>
                                  <div className="text-sm font-bold mono" style={{ color: TOKENS.textHeading }}>
                                    {hasFeedback && count >= 5 ? (
                                      <>
                                        {score}
                                        <span className="text-[11px] font-medium" style={{ color: TOKENS.textSubdued }}>
                                          /100
                                        </span>
                                      </>
                                    ) : (
                                      <span style={{ color: TOKENS.textSubdued }}>—</span>
                                    )}
                                  </div>
                                </div>
                                <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceSubdued }}>
                                  <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                                    ICPS
                                  </div>
                                  <div className="text-sm font-bold mono" style={{ color: TOKENS.textHeading }}>
                                    {ws.meta.totalRespondents}
                                  </div>
                                </div>
                                <div className="rounded-lg p-2" style={{ background: TOKENS.surfaceSubdued }}>
                                  <div className="text-[10px] font-semibold tracking-widest" style={{ color: TOKENS.textSubdued }}>
                                    WTP
                                  </div>
                                  <div className="text-sm font-bold mono" style={{ color: TOKENS.textHeading }}>
                                    {wtp}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: TOKENS.textSubdued }}>
                                <BarChart3 size={12} /> {ws.meta.totalRespondents} verified · {wtp !== "—" ? `${wtp}/mo` : "no anchor"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {activeTab === "overview" && <OverviewTab workspace={meta} respondents={respondents} quotes={quotes} competitors={competitors} hypotheses={hypotheses} onSelectTab={setActiveTab} onOpenRespondent={setSelectedRespondent} onOpenFastTrack={() => setIsFastTrackOpen(true)} onShowToast={addToast} />}
                {activeTab === "audience" && <AudienceTab respondents={respondents} targetMarket={meta.targetMarket} onOpenRespondent={setSelectedRespondent} onOpenFastTrack={() => setIsFastTrackOpen(true)} />}
                {activeTab === "evidence" && <EvidenceTab quotes={quotes} respondents={respondents} onOpenRespondent={setSelectedRespondent} onShowToast={addToast} />}
                {activeTab === "competitors" && <CompetitorTab competitors={competitors} workspaceName={meta.name} onSelectTab={setActiveTab} />}
                {activeTab === "hypotheses" && <HypothesisTab hypotheses={hypotheses} onOpenNewHypothesis={() => setIsNewHypothesisOpen(true)} />}
                {activeTab === "social" && <SocialScanTab mentions={socialMentions} workspace={meta} onShowToast={addToast} />}
                {activeTab === "simulator" && <SimulatorTab />}
              </div>
            )}
          </main>
        </div>
      </div>

      <IdeaComposerModal isOpen={isIdeaComposerOpen} onClose={() => setIsIdeaComposerOpen(false)} onWorkspaceCreated={handleWorkspaceCreated} onShowToast={addToast} />
      <RespondentModal respondent={selectedRespondent} onClose={() => setSelectedRespondent(null)} />
      <ShareModal workspaceId={meta.id} workspaceName={meta.name} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} onShowToast={addToast} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} onShowToast={addToast} />
      <NewHypothesisModal isOpen={isNewHypothesisOpen} onClose={() => setIsNewHypothesisOpen(false)} onAddHypothesis={handleAddHypothesis} onShowToast={addToast} ideaId={meta.id} />
      <FastTrackModal isOpen={isFastTrackOpen} onClose={() => setIsFastTrackOpen(false)} onShowToast={addToast} onRespondentsAdded={handleRespondentsAdded} currentWorkspaceName={meta.name} />
      <CopilotChatBubble meta={meta} respondents={respondents} quotes={quotes} competitors={competitors} hypotheses={hypotheses} onOpenRespondent={setSelectedRespondent} onShowToast={addToast} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
}

// Studio account block — Clerk-wired, screenshot-faithful dark menu, blue-active row
function StudioAccountBlock({ collapsed }: { collapsed: boolean }) {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Stanley canrold";
  const email = user?.primaryEmailAddress?.emailAddress || "stanleycanrold@gmail.com";
  const avatar = (
    <span className="relative flex size-7 shrink-0 overflow-hidden rounded-full" style={{ background: "#E0E7FF" }}>
      {user?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.imageUrl} alt="" className="size-7 rounded-full object-cover" />
      ) : (
        <span className="flex size-7 items-center justify-center text-xs font-semibold" style={{ color: "#4F46E5" }}>
          {name.trim()[0]?.toUpperCase() || "S"}
        </span>
      )}
    </span>
  );

  // Collapsed rail — avatar only with tooltip, menu still anchored
  if (collapsed) {
    return (
      <div ref={ref} className="relative flex flex-col items-center">
        {open && (
          <div role="menu" className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[224px] rounded-xl border shadow-xl overflow-hidden" style={{ background: "#0F172A", borderColor: "#1E293B" }}>
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "#1E293B" }}>
              <p className="text-xs font-semibold truncate text-white">{name}</p>
              <p className="text-[11px] truncate text-slate-400">{email}</p>
            </div>
            <div className="p-1">
              <button onClick={() => { setOpen(false); openUserProfile(); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white text-left">
                <User size={14} /> Manage profile
              </button>
              <a href="/account" onClick={() => setOpen(false)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white">
                <CreditCard size={14} /> Plan & billing
              </a>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white text-left">
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />} {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
            <div className="border-t p-1" style={{ borderColor: "#1E293B" }}>
              <button onClick={() => void signOut({ redirectUrl: "/sign-in" })} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white text-left">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        )}
        <button onClick={() => setOpen((v) => !v)} className="p-1 rounded-full hover:bg-white/10" title={name}>
          {avatar}
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      {open && (
        <div role="menu" aria-label="Account" className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border shadow-xl overflow-hidden animate-in fade-in zoom-in-95" style={{ background: "#0F172A", borderColor: "#1E293B" }}>
          <div className="px-3 py-2.5 border-b" style={{ borderColor: "#1E293B" }}>
            <p className="text-xs font-semibold truncate text-white">{isLoaded ? name : "Stanley canrold"}</p>
            <p className="text-[11px] truncate text-slate-400">{isLoaded ? email : "stanleycanrold@gmail.com"}</p>
          </div>
          <div className="p-1">
            <button onClick={() => { setOpen(false); openUserProfile(); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left cursor-pointer">
              <User size={14} /> Manage profile
            </button>
            <a href="/account" onClick={() => setOpen(false)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
              <CreditCard size={14} /> Plan & billing
            </a>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left cursor-pointer">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />} {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
          <div className="border-t p-1" style={{ borderColor: "#1E293B" }}>
            <button onClick={() => void signOut({ redirectUrl: "/sign-in" })} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left cursor-pointer">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-colors ${open ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200 hover:bg-slate-50"}`}
        style={open ? { borderColor: "#93C5FD", background: "#EFF6FF" } : undefined}
      >
        <span className="relative flex size-7 shrink-0 overflow-hidden rounded-full" style={{ background: "#E0E7FF" }}>
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="size-7 rounded-full object-cover" />
          ) : (
            <span className="flex size-7 items-center justify-center text-xs font-semibold" style={{ color: "#4F46E5" }}>
              {name.trim()[0]?.toUpperCase() || "S"}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 leading-tight text-left">
          <span className="text-xs font-semibold block truncate" style={{ color: TOKENS.textHeading }}>
            {isLoaded ? name : "Stanley canrold"}
          </span>
          <span className="text-[11px] block truncate" style={{ color: TOKENS.textSubdued }}>
            {isLoaded ? email : "stanleycanrold@gmail.com"}
          </span>
        </span>
        <ChevronDown size={12} style={{ color: TOKENS.textSubdued }} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
    </div>
  );
}
