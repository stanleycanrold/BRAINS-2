"use client";
import React, { useState } from 'react';
import { Hypothesis } from '../types';
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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600-subtle text-indigo-700 border border-indigo-200">
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-600-hover text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hypothesis</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-5 border-t border-slate-200 mt-5 flex-wrap">
          {['all', 'Validated', 'Partially Validated', 'Disproven', 'Testing'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === st
                  ? 'bg-white text-white font-bold'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Hypotheses' : st}
            </button>
          ))}
        </div>
      </div>

      {hypotheses.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-10 text-center">
          <p className="text-sm font-semibold text-slate-500">No hypotheses yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Research generates hypotheses automatically, or add your own founder assumptions with
            the button above to test them against incoming evidence.
          </p>
        </div>
      )}

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
                        : hyp.status === 'Partially Validated'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {hyp.status === 'Validated' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {hyp.status === 'Disproven' && <XCircle className="w-3.5 h-3.5" />}
                    {(hyp.status === 'Testing' || hyp.status === 'Partially Validated') && (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {hyp.status}
                  </span>

                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500">
                    Category: {hyp.category}
                  </span>

                  {hyp.basis && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-600-subtle text-indigo-700 border border-indigo-100">
                      {hyp.basis === 'research' ? 'From research' : 'Founder assumption'}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {hyp.statement}
                </h3>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Evidence Balance</span>
                    <span>
                      <strong className="text-emerald-700">{hyp.supportingEvidenceCount} supporting</strong> /{' '}
                      <strong className="text-rose-700">{hyp.counterEvidenceCount} counter</strong>
                    </span>
                  </div>
                  {hyp.supportingEvidenceCount + hyp.counterEvidenceCount > 0 ? (
                    <>
                      <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${
                              (hyp.supportingEvidenceCount /
                                (hyp.supportingEvidenceCount + hyp.counterEvidenceCount)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      {((hyp.supporting && hyp.supporting.length > 0) ||
                        (hyp.counter && hyp.counter.length > 0)) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                          {hyp.supporting && hyp.supporting.length > 0 && (
                            <ul className="space-y-1">
                              {hyp.supporting.map((s, i) => (
                                <li key={`s-${i}`} className="flex items-start gap-1.5 text-slate-500">
                                  <span className="text-emerald-500 mt-0.5">+</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {hyp.counter && hyp.counter.length > 0 && (
                            <ul className="space-y-1">
                              {hyp.counter.map((c, i) => (
                                <li key={`c-${i}`} className="flex items-start gap-1.5 text-slate-500">
                                  <span className="text-rose-500 mt-0.5">−</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400 italic">No evidence evaluated yet - this round has not been tested.</p>
                  )}
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    <strong className="text-slate-900 font-semibold">How it gets tested:</strong> {hyp.testMethod}
                  </p>
                  {hyp.takeaway && (
                    <p>
                      <strong className="text-slate-900 font-semibold">Key Takeaway:</strong> {hyp.takeaway}
                    </p>
                  )}
                </div>
              </div>

              {/* Confidence Score Pill */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[120px] shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Confidence
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">
                  {hyp.confidenceScore}%
                </span>
                <span className="text-[10px] text-slate-500">Agent estimate from evidence</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
