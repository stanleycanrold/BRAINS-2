"use client";
import React, { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import { signUpWithDraft } from '@/lib/urls';

interface IdeaComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
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
  const [ideaTitle, setIdeaTitle] = useState('');
  const [targetIcp, setTargetIcp] = useState('');
  const [coreProblem, setCoreProblem] = useState('');
  const [targetPrice, setTargetPrice] = useState('249');
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setIdeaTitle(tmpl.title);
    setTargetIcp(tmpl.icp);
    setCoreProblem(tmpl.problem);
  };

  const handleStartRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) {
      onShowToast('Missing Idea Name', 'Please provide a name or concept to test.', 'error');
      return;
    }
    setIsRunningPipeline(true);
    setCurrentStepIndex(0);

    const parsedPrice = parseInt(targetPrice) || 249;

    // The marketing site runs no validation backend. The composed brief is
    // flattened into a single draft and carried across to the app's sign-up,
    // where the real 7-agent pipeline runs against the founder's own account.
    const composedDraft = [
      ideaTitle.trim(),
      targetIcp.trim() ? `Target customer / ICP: ${targetIcp.trim()}` : '',
      coreProblem.trim() ? `Core problem being tested: ${coreProblem.trim()}` : '',
      `Target price assumption: $${parsedPrice}/mo (self-serve tier)`,
    ]
      .filter(Boolean)
      .join('\n');

    // Let the agent-step animation play for a beat, then hand off cross-origin.
    setTimeout(() => {
      window.location.href = signUpWithDraft(composedDraft);
    }, 2100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-scrim backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-raised w-full max-w-2xl rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-sunken text-primary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-on-accent shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-accent">
                Launch BRAINS Multi-Agent Validation
              </h2>
              <p className="text-xs text-tertiary">
                Run our 7-agent pipeline to deconstruct, scrape market complaints, and test ICP readiness.
              </p>
            </div>
          </div>
          {!isRunningPipeline && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-inset text-tertiary hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-subtle text-brand text-xs font-bold border border-brand/30 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Agent Pipeline in Progress...</span>
                </div>
                <h3 className="text-lg font-black text-primary">
                  Validating &ldquo;{ideaTitle}&rdquo;
                </h3>
                <p className="text-xs text-secondary max-w-md mx-auto">
                  Running automated discovery, Mom-Test interviews, Van Westendorp pricing modeling, and counter-evidence audits.
                </p>
              </div>

              {/* Steps Progress */}
              <div className="bg-sunken p-5 rounded-2xl border border-line space-y-3">
                {AGENT_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-raised border border-brand shadow-xs ring-2 ring-brand/10'
                          : isCompleted
                          ? 'bg-success-subtle border border-success/30 text-primary'
                          : 'opacity-40'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCompleted
                            ? 'bg-success text-on-accent'
                            : isCurrent
                            ? 'bg-brand text-on-accent animate-bounce'
                            : 'bg-inset text-secondary'
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
                          <span className="text-xs font-bold text-primary">
                            {step.agent}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-brand uppercase tracking-wider animate-pulse">
                              Processing...
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-success uppercase tracking-wider">
                              Done
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary block mb-2">
                  Or pick a pre-configured high-signal template:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="p-3 bg-sunken hover:bg-brand-subtle/70 border border-line hover:border-brand rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-primary group-hover:text-brand block line-clamp-1">
                        {tmpl.title}
                      </span>
                      <span className="text-[10px] text-secondary line-clamp-2 mt-1">
                        {tmpl.problem}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Idea Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary">
                  Startup Idea / Product Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terraform Drift Copilot, AI Medical Coder, Micro-SaaS CRM"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-sunken border border-line rounded-xl text-xs font-medium text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              {/* Target ICP */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary">
                  Target Customer / ICP (Ideal Customer Profile)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Series A CTOs, Solo Founders, Healthcare Clinic Billers"
                  value={targetIcp}
                  onChange={(e) => setTargetIcp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-sunken border border-line rounded-xl text-xs font-medium text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              {/* Core Problem Statement */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary">
                  Core Problem / Hypothesis Being Tested
                </label>
                <textarea
                  rows={3}
                  placeholder="What is the exact manual pain, unprompted frustration, or financial leak they suffer from today?"
                  value={coreProblem}
                  onChange={(e) => setCoreProblem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-sunken border border-line rounded-xl text-xs font-medium text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              {/* Target Monthly Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary">
                  Target Monthly Subscription Assumption ($/mo)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-secondary">$</span>
                  <input
                    type="number"
                    min="19"
                    max="5000"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-32 px-4 py-2.5 bg-sunken border border-line rounded-xl text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                  <span className="text-xs text-tertiary">/ month (self-serve tier)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-line text-xs font-bold text-primary hover:bg-sunken cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-on-accent rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
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
