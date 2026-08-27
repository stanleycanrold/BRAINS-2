'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  X,
  Play,
  CheckCircle2,
  Brain,
  Search,
  MessageSquare,
  ShieldCheck,
  Zap,
  TrendingUp,
  ArrowRight,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

interface IdeaComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

/** Draft persisted across a sign-in round-trip so nothing typed is lost. */
export function saveComposerDraft(draft: {
  ideaTitle: string;
  targetIcp: string;
  coreProblem: string;
  targetPrice: string;
}) {
  try {
    sessionStorage.setItem('brains.composer.draft', JSON.stringify(draft));
  } catch {
    /* private mode - the draft simply does not survive */
  }
}

export function readComposerDraft(): {
  ideaTitle: string;
  targetIcp: string;
  coreProblem: string;
  targetPrice: string;
} | null {
  try {
    const raw = sessionStorage.getItem('brains.composer.draft');
    if (!raw) return null;
    sessionStorage.removeItem('brains.composer.draft');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const TEMPLATES = [
  {
    title: 'Cloud Cost Copilot for Kubernetes',
    icp: 'DevOps & FinOps Leads at Growth Startups ($20k+/mo cloud spend)',
    problem: 'Silent egress fees and un-reclaimed pod memory waste 35% of AWS bill.',
    pricing: '$349/mo flat + 5% of proven cloud savings',
  },
  {
    title: 'Autonomous SQL Migration Agent',
    icp: 'Engineering Directors migrating legacy Oracle/MySQL to Postgres/CockroachDB',
    problem: 'Manual stored procedure conversions take 6+ months and create downtime bugs.',
    pricing: '$999/mo per database cluster during migration',
  },
  {
    title: 'AI Cold Outreach Proof-of-Work Verification',
    icp: 'B2B Sales Leaders (Series A to B SDR teams)',
    problem: 'Generic AI spam gets email domains blacklisted; need verified prospect intent.',
    pricing: '$199/mo per 5 SDR seats',
  },
];

const AGENT_STEPS = [
  {
    agent: 'Extraction & ICP Agent',
    icon: Brain,
    detail: 'Deconstructing core problem, value wedge, and target buyer persona...',
  },
  {
    agent: 'Research & Competitor Scraper',
    icon: Search,
    detail: 'Scanning 400+ SaaS alternatives, legacy workarounds, and enterprise GRC tools...',
  },
  {
    agent: 'Signal Scan & Social Miner',
    icon: MessageSquare,
    detail: 'Mining Reddit (r/SaaS, r/devops), Hacker News, and X for unprompted complaints...',
  },
  {
    agent: 'Mom-Test Questionnaire Agent',
    icon: ShieldCheck,
    detail: 'Synthesizing unbiased, non-leading interview questions focused on past behavior...',
  },
  {
    agent: 'Panel Diarization & Fast-Track Ingestion',
    icon: Zap,
    detail: 'Screening 114 verified decision-maker transcripts with cryptographic timestamps...',
  },
  {
    agent: 'Synthesis & Van Westendorp Pricing Math',
    icon: TrendingUp,
    detail: 'Modeling price resistance curves, sweet-spot elasticity, and feature ranking...',
  },
  {
    agent: 'Decision Gate & Verdict Engine',
    icon: CheckCircle2,
    detail: 'Auditing counter-evidence, red flags, and computing composite validation score...',
  },
];

export const IdeaComposerModal: React.FC<IdeaComposerModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const router = useRouter();
  const [ideaTitle, setIdeaTitle] = useState('');
  const [targetIcp, setTargetIcp] = useState('');
  const [coreProblem, setCoreProblem] = useState('');
  const [targetPrice, setTargetPrice] = useState('249');
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunningPipeline) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < AGENT_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isRunningPipeline]);

  // Prefill from a draft saved before an interrupted sign-in.
  useEffect(() => {
    if (!isOpen) return;
    const draft = readComposerDraft();
    if (draft) {
      setIdeaTitle(draft.ideaTitle);
      setTargetIcp(draft.targetIcp);
      setCoreProblem(draft.coreProblem);
      setTargetPrice(draft.targetPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setIdeaTitle(tmpl.title);
    setTargetIcp(tmpl.icp);
    setCoreProblem(tmpl.problem);
  };

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) {
      onShowToast('Missing Idea Name', 'Please provide a name or concept to test.', 'error');
      return;
    }
    setIsRunningPipeline(true);
    setCurrentStepIndex(0);
    setPipelineError(null);

    try {
      const response = await fetch('/api/studio/validate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaTitle: ideaTitle.trim(),
          targetIcp: targetIcp.trim(),
          coreProblem: coreProblem.trim(),
          targetPrice: parseInt(targetPrice) || 249,
        }),
      });

      if (response.status === 401) {
        saveComposerDraft({
          ideaTitle,
          targetIcp,
          coreProblem,
          targetPrice,
        });
        onShowToast('Sign in to validate', 'Your idea is saved - pick up right after sign in.', 'info');
        router.push('/sign-in?redirect=/studio');
        return;
      }

      if (response.status === 409) {
        const data = await response.json().catch(() => null);
        setIsRunningPipeline(false);
        onShowToast(
          'Similar idea already exists',
          data?.duplicate
            ? `"${data.duplicate.title}" matched at ${data.duplicate.similarity}%. Open it from the workspace switcher instead.`
            : 'A very similar idea is already being validated.',
          'error',
        );
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'The pipeline could not start.');
      }

      const { id } = (await response.json()) as { id: string };

      // Let the visual agent steps finish their sweep, then hand over to the
      // studio where research results stream in live.
      setTimeout(() => {
        setIsRunningPipeline(false);
        onClose();
        onShowToast(
          'Validation Round Live',
          `Workspace created for "${ideaTitle}". Market research is running now.`,
          'success',
        );
        router.push(`/studio/${id}`);
      }, 1200);
    } catch (err) {
      console.warn('Validation pipeline failed to start', err);
      setIsRunningPipeline(false);
      setPipelineError(
        err instanceof Error ? err.message : 'Something went wrong starting the pipeline.',
      );
      onShowToast(
        'Could not start validation',
        err instanceof Error ? err.message : 'Please try again.',
        'error',
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Launch BRAINS Multi-Agent Validation
              </h2>
              <p className="text-xs text-slate-400">
                Run our 7-agent pipeline to deconstruct, scrape market complaints, and test ICP readiness.
              </p>
            </div>
          </div>
          {!isRunningPipeline && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isRunningPipeline ? (
            /* Running Live Pipeline Animation */
            <div className="py-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Agent Pipeline in Progress...</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Validating &ldquo;{ideaTitle}&rdquo;
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Running automated discovery, Mom-Test interviews, Van Westendorp pricing modeling, and counter-evidence audits.
                </p>
              </div>

              {/* Steps Progress */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                {AGENT_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const isPending = idx > currentStepIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-white border border-indigo-300 shadow-xs ring-2 ring-indigo-500/10'
                          : isCompleted
                          ? 'bg-emerald-50/50 border border-emerald-200 text-emerald-950'
                          : 'opacity-40'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-indigo-600 text-white animate-bounce'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isCurrent ? (
                          <Icon className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {step.agent}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider animate-pulse">
                              Processing...
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                              Done
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleStartRun} className="space-y-5">
              {/* Quick Templates */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Or pick a pre-configured high-signal template:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 block line-clamp-1">
                        {tmpl.title}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                        {tmpl.problem}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Idea Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Startup Idea / Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terraform Drift Copilot, AI Medical Coder, Micro-SaaS CRM"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Target ICP */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Target Customer / ICP (Ideal Customer Profile)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Series A CTOs, Solo Founders, Healthcare Clinic Billers"
                  value={targetIcp}
                  onChange={(e) => setTargetIcp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Core Problem Statement */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Core Problem / Hypothesis Being Tested
                </label>
                <textarea
                  rows={3}
                  placeholder="What is the exact manual pain, unprompted frustration, or financial leak they suffer from today?"
                  value={coreProblem}
                  onChange={(e) => setCoreProblem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Target Monthly Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Target Monthly Subscription Assumption ($/mo)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    min="19"
                    max="5000"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <span className="text-xs text-slate-400">/ month (self-serve tier)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Full 7-Agent Validation</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
