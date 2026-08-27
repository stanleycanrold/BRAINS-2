"use client";
import React, { useState } from 'react';
import { WorkspaceMeta, Respondent, EvidenceQuote, CompetitorWorkaround, Hypothesis } from '../types';
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

interface OverviewTabProps {
  workspace: WorkspaceMeta;
  respondents: Respondent[];
  quotes: EvidenceQuote[];
  competitors: CompetitorWorkaround[];
  hypotheses: Hypothesis[];
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
  onSelectTab,
  onOpenRespondent,
  onOpenFastTrack,
  onShowToast,
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [gateResult, setGateResult] = useState<{
    signal: string;
    score: number;
    reasoning: string;
    riskFactors: Array<{ label: string; detail: string; severity: string }>;
    proposals: Array<{ id: string; title: string; actionableRecommendation: string; impact: string }>;
  } | null>(null);

  const handleRunDecisionGate = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/decision-gate/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: workspace.tagline || workspace.name,
          icp: workspace.targetMarket,
          respondents: respondents,
          currentScore: workspace.overallValidationScore,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGateResult(data);
        if (onShowToast) {
          onShowToast(
            'Decision Gate Audit Complete',
            `Calculated composite score ${data.score}/100 with signal ${data.signal.toUpperCase()}`,
            'success'
          );
        }
      } else {
        throw new Error('Audit endpoint failed');
      }
    } catch (err) {
      console.warn('Decision gate call failed', err);
      if (onShowToast) {
        onShowToast('Decision gate unavailable', 'The audit agent could not run right now. Try again in a moment.', 'error');
      }
    } finally {
      setIsAuditing(false);
    }
  };

  // Every figure below derives from the loaded respondents and quotes; when
  // there is no data the UI shows a dash instead of a plausible number.
  const decisionMakersCount = respondents.filter((r) => r.budgetDecisionMaker).length;
  const decisionMakersPct = respondents.length > 0
    ? Math.round((decisionMakersCount / respondents.length) * 100)
    : 0;

  const avgPainSeverity = respondents.length > 0
    ? respondents.reduce((acc, r) => acc + r.painSeverity, 0) / respondents.length
    : 0;

  const respondentsWithWtp = respondents.filter((r) => r.willingnessToPay > 0);
  const avgWtp = respondentsWithWtp.length > 0
    ? Math.round(respondentsWithWtp.reduce((acc, r) => acc + r.willingnessToPay, 0) / respondentsWithWtp.length)
    : workspace.willingnessToPayAvg;
  const wtpGrounded = avgWtp > 0 && workspace.willingnessToPayModel !== 'anchor_missing' && workspace.willingnessToPayModel !== 'none';

  // Verbatim carousel — wired to the same highly-correlated, question-filtered
  // verbatims as Evidence. Founder sees real pain, never the question prompt.
  const looksLikeQuestionSpot = (s: string) =>
    /\?$/.test(s.trim()) ||
    /^(think about|how often|what|when|why|have you|do you|can you|describe|tell me|consider the last|can you describe)/i.test(s.trim());
  const painScore = (q: (typeof quotes)[number]): number => {
    let s = 0;
    const t = q.text.toLowerCase();
    if (q.category === 'Problem Urgency') s += 3;
    if (q.category === 'Willingness to Pay') s += 2.5;
    if (q.category === 'Existing Friction') s += 2;
    if (q.unprompted || q.whyItMatters?.startsWith('[Unprompted]')) s += 3;
    if (q.sentiment === 'urgent') s += 2;
    if (/\$\d|\d+\s*(hours?|hrs?|weeks?|days?)|payroll|salary|budget/i.test(t)) s += 2;
    if (/last time|we (did|tried|lost|spent|paid|had)|every (time|audit|cycle)/i.test(t)) s += 2;
    return s;
  };
  const rankedVerbatims = [...quotes]
    .filter((q) => !looksLikeQuestionSpot(q.text))
    .sort((a, b) => painScore(b) - painScore(a))
    .slice(0, 5);
  const topQuote = rankedVerbatims[0];
  // Carousel state — auto-advances right-to-left, pauses on hover/focus/reduced-motion
  const [spotlightIndex, setSpotlightIndex] = React.useState(0);
  const [isSpotlightPaused, setIsSpotlightPaused] = React.useState(false);
  React.useEffect(() => {
    if (rankedVerbatims.length <= 1) return;
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || isSpotlightPaused) return;
    const id = window.setInterval(() => setSpotlightIndex((i) => (i + 1) % rankedVerbatims.length), 4200);
    return () => window.clearInterval(id);
  }, [rankedVerbatims.length, isSpotlightPaused]);

  // Counter-evidence should be respondent-owned objection verbatims, highly
  // correlated — never a question prompt. If none are strong, the box
  // hides itself rather than showing the question "Can you describe...".
  const looksLikeQuestion = (s: string) =>
    /\?$/.test(s.trim()) ||
    /^(think about|how often|what|when|why|have you|do you|can you|describe|tell me|consider the last|can you describe)/i.test(s.trim());
  const rankedObjections = [...quotes]
    .filter((q) => !looksLikeQuestion(q.text))
    .filter((q) => q.category === 'Objection & Risk' || q.sentiment === 'negative')
    .sort((a, b) => painScore(b) - painScore(a))
    .filter((q) => painScore(q) >= 4); // only best candidates, not every "Objection" tag
  const objections = rankedObjections;

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
              {workspace.name}
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
              Confirmation rate
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Screened respondents who confirmed the problem is real.
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Willingness to Pay</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {wtpGrounded ? (
              <>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">${avgWtp}</span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </>
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-slate-400">&mdash;</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {workspace.willingnessToPayModel === 'respondent_avg'
              ? `Average of ${respondentsWithWtp.length} respondent estimate${respondentsWithWtp.length === 1 ? '' : 's'} with a money anchor.`
              : workspace.willingnessToPayModel === 'anchored'
              ? 'Pricing-intelligence estimate grounded in evidence.'
              : 'No money anchor in the evidence yet, so no number is shown.'}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Responses Collected</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{workspace.totalRespondents}</span>
            <span className="text-xs font-semibold text-indigo-600">
              {decisionMakersCount} decision maker{decisionMakersCount === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Questionnaire replies and logged interviews this round.
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sample Quality</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{workspace.sampleQualityScore}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Share of responses that passed the quality screen.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Signal Breakdown & Counter-Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Problem Vectors & Signal Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Validation Vector Dimensions — removed: repeats Decision summary */}

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

        {/* Right Column: Counter-Evidence & Spotlight (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Counter-evidence — only rendered when we have highly-correlated objection verbatims.
              Otherwise we omit the box entirely; the verbatim feed immediately below is the
              stronger evidence and the box would only add noise (per screenshot). */}
          {objections.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-rose-200/80 shadow-2xs relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Counter-Evidence</h3>
                  <p className="text-[11px] text-slate-500">Strongest objection verbatims — respondent-owned, highly correlated</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                {objections.slice(0, 2).map((obj, i) => {
                  const clean = obj.text.replace(/^[\s\u2014\u2013\-–—]+\s*/, "").trim();
                  return (
                    <div key={obj.id || i} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
                      <span className="font-bold text-rose-900 block mb-1">
                        {obj.authorRole} at {obj.authorCompany}
                      </span>
                      <p className="text-slate-700 leading-relaxed italic">
                        &ldquo;{clean}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verified Verbatim Spotlight — carousel, wired to ranked verbatims */}
          {rankedVerbatims.length > 0 && (
            <div
              className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xs relative overflow-hidden"
              onMouseEnter={() => setIsSpotlightPaused(true)}
              onMouseLeave={() => setIsSpotlightPaused(false)}
              onFocusCapture={() => setIsSpotlightPaused(true)}
              onBlurCapture={() => setIsSpotlightPaused(false)}
            >
              <Quote className="w-8 h-8 text-indigo-400/40 absolute top-4 right-4" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Verified Verbatim Spotlight
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {rankedVerbatims.length > 1 ? `${spotlightIndex + 1} / ${rankedVerbatims.length}` : "1 signal"}
                </span>
              </div>

              <div className="relative mt-3 min-h-[88px]">
                <div
                  key={rankedVerbatims[spotlightIndex].id}
                  className="animate-in fade-in slide-in-from-right-2 duration-300"
                >
                  <blockquote className="text-sm text-slate-200 italic font-medium leading-relaxed line-clamp-4">
                    &ldquo;{rankedVerbatims[spotlightIndex].text}&rdquo;
                  </blockquote>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={rankedVerbatims[spotlightIndex].authorAvatar}
                    alt={rankedVerbatims[spotlightIndex].authorName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {rankedVerbatims[spotlightIndex].authorName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {rankedVerbatims[spotlightIndex].authorRole}
                      {rankedVerbatims[spotlightIndex].authorCompany ? `, ${rankedVerbatims[spotlightIndex].authorCompany}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const q = rankedVerbatims[spotlightIndex];
                    const resp = respondents.find((r) => r.id === q.respondentId) || respondents[0];
                    if (resp) onOpenRespondent(resp);
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>View Full</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {rankedVerbatims.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  {rankedVerbatims.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSpotlightIndex(i);
                        setIsSpotlightPaused(true);
                        window.setTimeout(() => setIsSpotlightPaused(false), 4000);
                      }}
                      aria-label={`Go to verbatim ${i + 1}`}
                      aria-current={i === spotlightIndex ? "true" : undefined}
                      className={`h-1.5 rounded-full transition-all ${i === spotlightIndex ? "w-6 bg-indigo-400" : "w-1.5 bg-slate-600 hover:bg-slate-500"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
