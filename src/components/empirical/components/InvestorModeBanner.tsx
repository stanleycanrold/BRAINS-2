"use client";
import React from 'react';
import { ShieldCheck, Sparkles, Copy, ExternalLink, ArrowRight, Check } from 'lucide-react';
import { WorkspaceMeta } from '../types';

interface InvestorModeBannerProps {
  workspace: WorkspaceMeta;
  onOpenIdeaComposer: () => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const InvestorModeBanner: React.FC<InvestorModeBannerProps> = ({
  workspace,
  onOpenIdeaComposer,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyPitchSnippet = () => {
    const summaryText = `[BRAINS Validation Report]
Startup: ${workspace.name}
Verdict: ${workspace.verdict} (${workspace.overallValidationScore}/100)
Sample Size: ${workspace.totalRespondents} Verified Decision Makers (${workspace.sampleQualityScore}% Authenticity Score)
Unprompted Pain Rate: ${workspace.unpromptedPainMentionRate}%
Mean Willingness to Pay: $${workspace.willingnessToPayAvg}/month
Core Signal: ${workspace.verdictReasoning}
Verified via BRAINS Engine: https://brains.im/w/${workspace.id}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    onShowToast('Copied to Clipboard', 'Executive memo snippet ready for pitch deck or investor email.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Top Cryptographic Seal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">
                BRAINS Executive Validation Stamp
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                VERIFIED EMPIRICAL
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Conducted across {workspace.totalRespondents} screened target buyers with verified transcripts and audited counter-evidence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
          <button
            onClick={handleCopyPitchSnippet}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied Memo' : 'Copy Pitch Deck Snippet'}</span>
          </button>

          <button
            onClick={onOpenIdeaComposer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-600-hover text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Validate Your Idea</span>
          </button>
        </div>
      </div>
    </div>
  );
};
