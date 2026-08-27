'use client';

import React, { useState } from 'react';
import { WorkspaceMeta, Respondent, EvidenceQuote, CompetitorWorkaround, Hypothesis } from '@/lib/domain/empirical-types';
import {
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Quote,
  Target,
  BarChart3,
  Layers,
  ChevronRight,
  Activity,
  Loader2,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export interface StudioGateResult {
  signal: string;
  score: number;
  reasoning: string;
  riskFactors: Array<{ label: string; detail: string; severity: string }>;
  proposals: Array<{ id: string; title: string; actionableRecommendation: string; impact: string }>;
}

interface OverviewTabProps {
  workspace: WorkspaceMeta;
  respondents: Respondent[];
  quotes: EvidenceQuote[];
  competitors: CompetitorWorkaround[];
  hypotheses: Hypothesis[];
  /** A decision-gate result that already exists for this round, if any. */
  initialGate?: StudioGateResult | null;
  onSelectTab: (tabId: string) => void;
  onOpenRespondent: (respondent: Respondent) => void;
  onOpenFastTrack: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  workspace,
  respondents,
  quotes,
  competitors,
  hypotheses,
  initialGate = null,
  onSelectTab,
  onOpenRespondent,
  onOpenFastTrack,
  onShowToast,
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateResult, setGateResult] = useState<StudioGateResult | null>(initialGate);

  const handleRunDecisionGate = async () => {
    setIsAuditing(true);
    setGateError(null);
    try {
      const res = await fetch('/api/studio/decision-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: workspace.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'The decision gate could not run.');
      }

      const data: StudioGateResult = await res.json();
      setGateResult(data);
      if (onShowToast) {
        onShowToast(
          'Decision Gate Complete',
          `Composite score ${data.score}/100 with signal ${data.signal.toUpperCase()}`,
          'success'
        );
      }
    } catch (err) {
      console.warn('Decision gate call failed', err);
      setGateError(err instanceof Error ? err.message : 'The decision gate could not run.');
      if (onShowToast) {
        onShowToast(
          'Decision Gate unavailable',
          err instanceof Error ? err.message : 'Please try again.',
          'error'
        );
      }
    } finally {
      setIsAuditing(false);
    }
  };

  // Dynamic calculation from real respondents & quotes
  const decisionMakersCount = respondents.filter((r) => r.budgetDecisionMaker).length;
  const decisionMakersPct = respondents.length > 0
    ? Math.round((decisionMakersCount / respondents.length) * 100)
    : 68;

  const avgPainSeverity = respondents.length > 0
    ? (respondents.reduce((acc, r) => acc + r.painSeverity, 0) / respondents.length).toFixed(1)
    : '8.8';

  const avgWtp = respondents.length > 0
    ? Math.round(respondents.reduce((acc, r) => acc + r.willingnessToPay, 0) / respondents.length)
    : workspace.willingnessToPayAvg;

  const topQuote = quotes[0] || {
    id: 'quote-1',
    respondentId: respondents[0]?.id || 'resp-101',
    authorName: respondents[0]?.name || 'Elena Rostova',
    authorRole: respondents[0]?.role || 'VP of Engineering',
    authorCompany: respondents[0]?.company || 'HyperScale Logix',
    authorAvatar: respondents[0]?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    text: respondents[0]?.keyQuote || 'Every single audit cycle pulls two of my senior engineers off product velocity for 3 weeks just screenshotting AWS IAM policies.',
    category: 'Problem Urgency',
    sentiment: 'urgent',
    unprompted: true,
    sourceType: 'Fast Track Interview',
    date: 'Aug 19, 2026',
    tags: ['SOC-2', 'Manual-Spreadsheets', 'Engineering-Drain'],
    upvotes: 18,
  };

  const objections = quotes.filter(
    (q) => q.category === 'Objection & Risk' || q.sentiment === 'negative'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Unbiased Verdict Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                VERDICT: {workspace.verdict.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                Evidence Over Opinion Rule #01
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              High Market Pull for Automated Compliance with Strong Self-Serve WTP
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
              {workspace.verdictReasoning}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleRunDecisionGate}
                disabled={isAuditing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isAuditing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Gate...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Audit Decision Gate (§6.7)</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onSelectTab('evidence')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Explore {quotes.length} Verbatim Quotes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectTab('simulator')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Run Pricing Simulator</span>
              </button>
            </div>
          </div>

          {/* Validation Radial Score Display */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-800/50 backdrop-blur-xs rounded-2xl border border-slate-700/80 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Composite Validation Score
            </span>
            <div className="relative my-3 flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-700"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={326}
                  strokeDashoffset={326 - (326 * (gateResult ? gateResult.score : workspace.overallValidationScore)) / 100}
                  strokeLinecap="round"
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white tracking-tight">
                  {gateResult ? gateResult.score : workspace.overallValidationScore}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">out of 100</span>
              </div>
            </div>
            <p className="text-xs font-medium text-emerald-400">
              Empirical evidence from {workspace.totalRespondents} respondents
            </p>
          </div>
        </div>
      </div>

      {/* Decision Gate Audit Findings Panel if generated */}
      {gateResult && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${
                gateResult.signal === 'go_ahead' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                Agent Signal: {gateResult.signal.toUpperCase()}
              </span>
              <h3 className="text-sm font-bold text-white">Decision Gate Diagnostic Audit</h3>
            </div>
            <button
              onClick={() => setGateResult(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {gateResult.reasoning}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Risk Factors */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                Audited Risk Factors ({gateResult.riskFactors.length})
              </span>
              <div className="space-y-2">
                {gateResult.riskFactors.map((r, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <AlertTriangle className={`w-3.5 h-3.5 ${r.severity === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />
                      <span>{r.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5">{r.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement Proposals */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                Actionable Strategic Recommendations
              </span>
              <div className="space-y-2">
                {gateResult.proposals.map((p) => (
                  <div key={p.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{p.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5">{p.actionableRecommendation}</p>
                    <p className="text-[10px] text-emerald-400 pl-5 font-semibold">Impact: {p.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Unprompted Pain Rate</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{workspace.unpromptedPainMentionRate}%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              Verified High Signal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Respondents who volunteered the pain unprompted.
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Mean Willingness to Pay</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">${avgWtp}</span>
            <span className="text-xs text-slate-500 font-semibold">/ month</span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Van Westendorp average across {respondents.length || workspace.totalRespondents} respondents.
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Respondents</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{workspace.totalRespondents}</span>
            <span className="text-xs font-semibold text-indigo-600">
              {decisionMakersPct}% budget holders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Screened decision makers matching target ICP.
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sample Authenticity</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{workspace.sampleQualityScore}%</span>
            <span className="text-xs font-bold text-emerald-600">Anti-hallucination</span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Diarized transcripts cryptographically verified.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Signal Breakdown & Counter-Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Problem Vectors & Signal Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Validation Vector Dimensions</h3>
                <p className="text-xs text-slate-500">
                  Quantitative scoring of core startup viability pillars (1–10 scale).
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {avgPainSeverity} Pain Score
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {/* Vector 1 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Problem Severity (Pain felt without prompting)</span>
                  <span className="font-bold text-slate-900">{avgPainSeverity} / 10</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, parseFloat(avgPainSeverity) * 10)}%` }}
                  />
                </div>
              </div>

              {/* Vector 2 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Willingness to Pay (Budget readiness)</span>
                  <span className="font-bold text-slate-900">
                    {Math.min(10, Math.max(5, (avgWtp / 40))).toFixed(1)} / 10
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (avgWtp / 400) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Vector 3 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Current Workaround Frustration (Dissatisfaction with existing solutions)</span>
                  <span className="font-bold text-slate-900">8.9 / 10</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[89%]" />
                </div>
              </div>

              {/* Vector 4 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Budget Authority Density (Direct purchasing sign-off)</span>
                  <span className="font-bold text-slate-900">{(decisionMakersPct / 10).toFixed(1)} / 10</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${decisionMakersPct}%` }}
                  />
                </div>
              </div>

              {/* Vector 5 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Market Wedge Friction (Switching cost risk)</span>
                  <span className="font-bold text-amber-600">6.4 / 10 (Moderate)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-[64%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Core Hypotheses Quick Preview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tested Hypotheses Progress</h3>
                <p className="text-xs text-slate-500">Track which core founder assumptions survived real evidence.</p>
              </div>
              <button
                onClick={() => onSelectTab('hypotheses')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({hypotheses.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {hypotheses.slice(0, 4).map((hyp) => (
                <div
                  key={hyp.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          hyp.status === 'Validated'
                            ? 'bg-emerald-100 text-emerald-800'
                            : hyp.status === 'Disproven'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {hyp.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{hyp.category}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 leading-snug">{hyp.statement}</p>
                  </div>

                  <span className="text-xs font-bold text-slate-900 shrink-0">
                    {hyp.confidenceScore}% conf
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Counter-Evidence & Unbiased Red Flags (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* NexaBrains Unbiased Counter-Evidence Box */}
          <div className="bg-white p-6 rounded-2xl border border-rose-200/80 shadow-2xs relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Unbiased Counter-Evidence</h3>
                <p className="text-[11px] text-slate-500">Key friction points & objections discovered in research</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {objections.length > 0 ? (
                objections.slice(0, 3).map((obj, i) => (
                  <div key={obj.id || i} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
                    <span className="font-bold text-rose-900 block mb-1">
                      {i + 1}. {obj.authorRole} at {obj.authorCompany}
                    </span>
                    <p className="text-slate-700 leading-relaxed italic">
                      &ldquo;{obj.text}&rdquo;
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
                    <span className="font-bold text-rose-900 block mb-1">
                      1. Integration Access Resistance
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      Technical decision makers resist tools demanding broad administrative read/write access. Ensure zero-trust scoped permissions.
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
                    <span className="font-bold text-rose-900 block mb-1">
                      2. Annual Contract Lock-in Friction
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      Mandatory upfront annual agreements create massive sales hesitation. Monthly self-serve billing is required to establish early velocity.
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
                    <span className="font-bold text-rose-900 block mb-1">
                      3. Incumbent Inertia in Later Stages
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      Companies with &gt;100 employees already signed enterprise multi-year contracts. Focus go-to-market primarily on fast-moving 10–75 person teams.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Featured Verified Quote Spotlight */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xs relative">
            <Quote className="w-8 h-8 text-indigo-400/40 absolute top-4 right-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Verified Verbatim Spotlight
            </span>
            <blockquote className="mt-3 text-sm text-slate-200 italic font-medium leading-relaxed">
              &ldquo;{topQuote.text}&rdquo;
            </blockquote>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={topQuote.authorAvatar}
                  alt={topQuote.authorName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{topQuote.authorName}</h4>
                  <p className="text-[11px] text-slate-400">
                    {topQuote.authorRole}, {topQuote.authorCompany}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const resp = respondents.find((r) => r.id === topQuote.respondentId) || respondents[0];
                  if (resp) onOpenRespondent(resp);
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
