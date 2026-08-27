"use client";
import React, { useState } from 'react';
import { Respondent } from '../types';
import { X, ShieldCheck, Building2, User, Clock, Flame } from 'lucide-react';

interface RespondentModalProps {
  respondent: Respondent | null;
  onClose: () => void;
}

export const RespondentModal: React.FC<RespondentModalProps> = ({ respondent, onClose }) => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');

  if (!respondent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-start gap-4">
            <img
              src={respondent.avatar}
              alt={respondent.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{respondent.name}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {respondent.verifiedSource}
                </span>
              </div>
              <p className="text-sm text-slate-600 font-medium mt-0.5">
                {respondent.role} at <span className="text-indigo-600 font-semibold">{respondent.company}</span>
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                {(respondent.companySize || respondent.industry) && (
                  <>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {[respondent.companySize, respondent.industry].filter(Boolean).join(' • ') || 'Not provided'}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {respondent.durationMinutes > 0
                    ? `${respondent.durationMinutes} min interview on ${respondent.interviewDate}`
                    : `Responded ${respondent.interviewDate || 'recently'}`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-white py-3 px-6 text-center">
          <div>
            <span className="text-xs text-slate-400 font-medium">Pain Severity</span>
            <div className="flex items-center justify-center gap-1 text-base font-bold text-rose-600 mt-0.5">
              <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
              {respondent.painSeverity}/10
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Willingness to Pay</span>
            <div className="text-base font-bold text-emerald-600 mt-0.5">
              {respondent.willingnessToPay > 0 ? `$${respondent.willingnessToPay}/mo` : '—'}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Purchase Power</span>
            <div className="text-sm font-semibold text-slate-700 mt-0.5">
              {respondent.budgetDecisionMaker ? 'Decides / influences' : 'Not indicated'}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">ICP Fit</span>
            <div className="text-sm font-semibold text-indigo-600 mt-0.5 capitalize">
              {respondent.icpFit && respondent.icpFit !== 'unknown' ? respondent.icpFit : '—'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors mr-6 ${
              activeTab === 'transcript'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Verbatim Transcript & Key Highlights
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Current Workarounds & Tech Stack
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'transcript' ? (
            <div className="space-y-5">
              {respondent.keyQuote && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1">Key Verbatim Takeaway</p>
                  <p className="text-slate-900 font-medium italic text-sm leading-relaxed">
                    {respondent.keyQuote}
                  </p>
                </div>
              )}

              {/* Calculated signals — what the model inferred from how they answered */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                <div className="text-center">
                  <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#64748B" }}>
                    Pain Signal
                  </div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: respondent.painSeverity >= 7 ? "#DC2626" : respondent.painSeverity >= 4 ? "#D97706" : "#475569" }}>
                    {respondent.painSeverity}/10 {respondent.painSeverity >= 7 ? "High" : respondent.painSeverity >= 4 ? "Moderate" : "Low"}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>
                    From past-behaviour answers
                  </div>
                </div>
                <div className="text-center border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0" style={{ borderColor: "#E2E8F0" }}>
                  <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#64748B" }}>
                    WTP Signal
                  </div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: respondent.willingnessToPay > 0 ? "#059669" : "#64748B" }}>
                    {respondent.willingnessToPay > 0 ? `$${respondent.willingnessToPay}/mo` : "—"}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>
                    {respondent.willingnessToPay > 0 ? "Money anchor found" : "No $ anchor in answers"}
                  </div>
                </div>
                <div className="text-center border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0" style={{ borderColor: "#E2E8F0" }}>
                  <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#64748B" }}>
                    ICP Fit
                  </div>
                  <div className="text-sm font-bold mt-0.5 capitalize" style={{ color: respondent.icpFit === "match" ? "#059669" : respondent.icpFit === "adjacent" ? "#D97706" : "#64748B" }}>
                    {respondent.icpFit && respondent.icpFit !== "unknown" ? respondent.icpFit : "—"}
                  </div>
                  <div className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "#64748B" }} title={respondent.icpFitReasoning}>
                    {respondent.icpFitReasoning ? respondent.icpFitReasoning.slice(0, 60) : "Not scored yet"}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* Group flat transcript into Q → A pairs for readability */}
                {(() => {
                  const pairs: Array<{ q?: string; a: string; highlight?: string }> = [];
                  for (let i = 0; i < respondent.fullTranscript.length; i++) {
                    const line = respondent.fullTranscript[i];
                    if (line.speaker === "Question") {
                      const next = respondent.fullTranscript[i + 1];
                      if (next && next.speaker !== "Question") {
                        pairs.push({ q: line.text, a: next.text, highlight: next.highlight });
                        i++;
                      } else {
                        pairs.push({ q: line.text, a: "", highlight: undefined });
                      }
                    } else {
                      pairs.push({ q: undefined, a: line.text, highlight: line.highlight });
                    }
                  }
                  if (pairs.length === 0) return <p className="text-xs text-slate-500">No transcript yet.</p>;
                  return pairs.map((p, idx) => (
                    <div key={idx} className="rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}>
                      {p.q && (
                        <div className="px-3.5 py-2.5 flex gap-2.5" style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                          <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "#E2E8F0", color: "#475569" }}>
                            Q
                          </span>
                          <p className="text-xs font-medium leading-5" style={{ color: "#334155" }}>
                            {p.q}
                          </p>
                        </div>
                      )}
                      <div className="px-3.5 py-3 flex gap-2.5">
                        <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: p.highlight === "pain" ? "#DC2626" : p.highlight === "budget" ? "#059669" : "#2563EB" }}>
                          A
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#0F172A" }}>
                            {p.a || <span className="italic" style={{ color: "#94A3B8" }}>No answer recorded</span>}
                          </p>
                          {p.highlight && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide" style={{ background: p.highlight === "pain" ? "#FEF2F2" : p.highlight === "budget" ? "#ECFDF5" : "#EFF6FF", color: p.highlight === "pain" ? "#DC2626" : p.highlight === "budget" ? "#059669" : "#2563EB", border: `1px solid ${p.highlight === "pain" ? "#FECACA" : p.highlight === "budget" ? "#A7F3D0" : "#BFDBFE"}` }}>
                              {p.highlight === "pain" ? "Pain signal" : p.highlight === "budget" ? "Money anchor" : p.highlight === "objection" ? "Objection" : p.highlight === "validation" ? "Validation" : p.highlight}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Current Tools In Use</h4>
                <div className="flex flex-wrap gap-2">
                  {respondent.currentTools.length > 0 ? (
                    respondent.currentTools.map((tool, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        {tool}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No tools listed for this respondent.</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Screening Summary</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {respondent.icpFitReasoning ||
                    'This response was run through the quality screen; scores below reflect what the screen produced.'}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                  <span>Quality confidence: <strong className="text-slate-800">{respondent.qualityScore}%</strong></span>
                  <span>Status: <strong className="text-indigo-600">{respondent.sentiment}</strong></span>
                  {respondent.confirmed && (
                    <span>Problem confirmed: <strong className="text-slate-800">{respondent.confirmed}</strong></span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">ID: {respondent.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
