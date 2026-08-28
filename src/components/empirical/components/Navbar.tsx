"use client";
import React, { useState } from 'react';
import { WorkspaceMeta } from '../types';
import {
  Share2,
  Download,
  Zap,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ChevronDown,
  Plus,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import type { FullWorkspaceData } from "@/lib/domain/empirical-types";
import { Logo } from './brand/Logo';

interface NavbarProps {
  workspace: WorkspaceMeta;
  allWorkspaces: Record<string, FullWorkspaceData>;
  onSelectWorkspace: (wsId: string) => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenShare: () => void;
  onOpenExport: () => void;
  onOpenFastTrack: () => void;
  onOpenIdeaComposer: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isInvestorMode: boolean;
  onToggleInvestorMode: () => void;
  onSwitchToWeb?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  workspace,
  allWorkspaces,
  onSelectWorkspace,
  activeTab,
  onSelectTab,
  onOpenShare,
  onOpenExport,
  onOpenFastTrack,
  onOpenIdeaComposer,
  searchQuery,
  onSearchChange,
  isInvestorMode,
  onToggleInvestorMode,
  onSwitchToWeb,
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const hypothesisCount = allWorkspaces[workspace.id]?.hypotheses.length ?? 0;

  const tabs = [
    { id: 'overview', label: 'Overview & Verdict', icon: Layers },
    { id: 'audience', label: 'Audience & ICP', badge: String(workspace.totalRespondents), icon: null },
    { id: 'evidence', label: 'Verbatim Quotes', badge: 'Evidence', icon: null },
    { id: 'competitors', label: 'Competitors & Wedge', icon: null },
    { id: 'hypotheses', label: 'Hypotheses & Rework', badge: hypothesisCount > 0 ? String(hypothesisCount) : undefined, icon: null },
    { id: 'social', label: 'Live Social Scan', icon: null },
    { id: 'ai-copilot', label: 'AI Brain Copilot', badge: 'Ask', icon: Sparkles },
    { id: 'simulator', label: 'Pricing Simulator', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff] border-b border-[#dee1e5]">
      {/* Top Banner Bar */}
      <div className="px-4 sm:px-8 py-2 bg-[#14181f] text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToWeb}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <Logo size={14} textColor="text-white" />
          </button>

          <span className="text-[#6b7480] font-mono">/</span>

          {/* Workspace Switcher Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222733] hover:bg-[#2d3340] text-slate-200 text-xs font-semibold transition-all border border-[#333a4a] cursor-pointer"
            >
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{workspace.name.split('—')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isSwitcherOpen && (
              <div
                className="absolute left-0 mt-1.5 w-72 bg-[#1f242e] border border-[#2d3340] rounded-lg shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsSwitcherOpen(false)}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Switch Validation Workspace
                </div>
                {(Object.values(allWorkspaces) as FullWorkspaceData[]).map((ws) => (
                  <button
                    key={ws.meta.id}
                    onClick={() => onSelectWorkspace(ws.meta.id)}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      ws.meta.id === workspace.id
                        ? 'bg-[#2563eb] text-white font-bold'
                        : 'text-slate-300 hover:bg-[#222733] hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate font-semibold">{ws.meta.name.split('—')[0]}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{ws.meta.tagline}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#14181f] text-[#2f8f5b] font-mono font-bold shrink-0">
                      {ws.meta.overallValidationScore}/100
                    </span>
                  </button>
                ))}

                <div className="pt-2 mt-1 border-t border-[#2d3340]">
                  <button
                    onClick={onOpenIdeaComposer}
                    className="w-full px-3 py-2 rounded bg-[#14267a] hover:bg-[#101f66] border border-[#2563eb]/40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Validate Another Idea</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mode Badge */}
          <button
            onClick={onToggleInvestorMode}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all border cursor-pointer ${
              isInvestorMode
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                : 'bg-[#222733] text-slate-300 border-[#333a4a]'
            }`}
          >
            <Eye className="w-3 h-3 text-[#2563eb]" />
            <span>{isInvestorMode ? 'Viewing in Investor Memo Mode' : 'Founder Admin View'}</span>
          </button>

          {onSwitchToWeb && (
            <button
              onClick={onSwitchToWeb}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#222733] hover:bg-[#2d3340] text-slate-200 border border-[#333a4a] cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3 text-[#2563eb]" />
              <span>Founder Web View</span>
            </button>
          )}
        </div>

        {/* Right CTA tools */}
        <div className="flex items-center gap-2.5 text-xs">
          <button
            onClick={onOpenIdeaComposer}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Validate New Idea</span>
          </button>

          <button
            onClick={onOpenFastTrack}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222733] hover:bg-[#2d3340] text-slate-200 font-semibold transition-all border border-[#333a4a] cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Fast Track Panel</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Header */}
      <div className="px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#14181f] tracking-tight">
              {workspace.name}
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-[#f0f9f4] text-[#2f8f5b] border border-[#c4e6d4]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Validation Score: {workspace.overallValidationScore}/100</span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#f7f8fa] text-[#14181f] border border-[#dee1e5]">
              Round #{workspace.currentRound}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#6b7480] bg-[#f7f8fa] px-2 py-0.5 rounded border border-[#dee1e5]">
              <ShieldCheck className="w-3 h-3 text-[#14267a]" />
              Cryptographically Stamped
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6b7480] font-normal mt-1 max-w-3xl leading-relaxed">
            {workspace.tagline}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="relative hidden lg:block">
            <Search className="w-3.5 h-3.5 text-[#9aa2ab] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search evidence, quotes, roles..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#f7f8fa] border border-[#dee1e5] rounded focus:outline-none focus:border-[#14267a] w-56 text-[#14181f] transition-all placeholder:text-[#9aa2ab]"
            />
          </div>

          <button
            onClick={onToggleInvestorMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
              isInvestorMode
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-[#ffffff] text-[#14181f] border-[#dee1e5] hover:bg-[#f7f8fa]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#14267a]" />
            <span>{isInvestorMode ? 'Investor Mode' : 'Investor View'}</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold border border-[#dee1e5] bg-[#ffffff] hover:bg-[#f7f8fa] text-[#14181f] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Memo</span>
          </button>

          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold bg-[#14267a] hover:bg-[#101f66] text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 sm:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#dee1e5] bg-[#f7f8fa]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-[#14267a] text-[#14267a] font-bold bg-[#ffffff]'
                  : 'border-transparent text-[#6b7480] hover:text-[#14181f] hover:bg-[#eef0f2]'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#f0f3f8] text-[#14267a]'
                      : 'bg-[#eef0f2] text-[#6b7480]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
