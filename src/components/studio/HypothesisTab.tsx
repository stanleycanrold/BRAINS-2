'use client';

import React, { useState } from 'react';
import { Hypothesis } from '@/lib/domain/empirical-types';
import { Target, Plus, CheckCircle2, XCircle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

interface HypothesisTabProps {
  hypotheses: Hypothesis[];
  onOpenNewHypothesis: () => void;
}

export const HypothesisTab: React.FC<HypothesisTabProps> = ({ hypotheses, onOpenNewHypothesis }) => {
  const [filter, setFilter] = useState<string>('all');

  const filtered = hypotheses.filter((h) => {
    if (filter === 'all') return true;
    return h.status === filter;
  });

  const validatedCount = hypotheses.filter((h) => h.status === 'Validated').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Assumption Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {validatedCount} of {hypotheses.length} Hypotheses Validated
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">Core Business Hypotheses & Evidence Tracking</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Testing problem urgency, pricing ceiling, and go-to-market friction against verified data.
            </p>
          </div>

          <button
            onClick={onOpenNewHypothesis}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hypothesis</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-5 border-t border-slate-100 mt-5">
          {['all', 'Validated', 'Disproven', 'Testing'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === st
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Hypotheses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Hypotheses Cards Grid */}
      <div className="space-y-4">
        {filtered.map((hyp) => (
          <div
            key={hyp.id}
            className={`bg-white rounded-2xl p-6 border shadow-2xs transition-all ${
              hyp.status === 'Validated'
                ? 'border-emerald-200 hover:border-emerald-300'
                : hyp.status === 'Disproven'
                ? 'border-rose-200 hover:border-rose-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      hyp.status === 'Validated'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : hyp.status === 'Disproven'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {hyp.status === 'Validated' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {hyp.status === 'Disproven' && <XCircle className="w-3.5 h-3.5" />}
                    {hyp.status === 'Testing' && <AlertCircle className="w-3.5 h-3.5" />}
                    {hyp.status}
                  </span>

                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    Category: {hyp.category}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {hyp.statement}
                </h3>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Evidence Balance</span>
                    <span>
                      <strong className="text-emerald-700">{hyp.supportingEvidenceCount} supporting</strong> /{' '}
                      <strong className="text-rose-700">{hyp.counterEvidenceCount} counter</strong>
                    </span>
                  </div>
                  <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${
                          hyp.supportingEvidenceCount + hyp.counterEvidenceCount > 0
                            ? (hyp.supportingEvidenceCount /
                                (hyp.supportingEvidenceCount + hyp.counterEvidenceCount)) *
                              100
                            : 50
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <p>
                    <strong className="text-slate-900 font-semibold">Test Methodology:</strong> {hyp.testMethod}
                  </p>
                  <p>
                    <strong className="text-slate-900 font-semibold">Key Takeaway:</strong> {hyp.takeaway}
                  </p>
                </div>
              </div>

              {/* Confidence Score Pill */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center min-w-[120px] shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Confidence
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">
                  {hyp.confidenceScore}%
                </span>
                <span className="text-[10px] text-slate-500">Statistically verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
