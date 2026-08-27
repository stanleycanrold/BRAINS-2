'use client';

import React, { useState } from 'react';
import { Respondent } from '@/lib/domain/empirical-types';
import { X, Play, Pause, ShieldCheck, DollarSign, Building2, User, Clock, AlertTriangle, CheckCircle, Flame, Tag } from 'lucide-react';

interface RespondentModalProps {
  respondent: Respondent | null;
  onClose: () => void;
}

export const RespondentModal: React.FC<RespondentModalProps> = ({ respondent, onClose }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
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
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {respondent.companySize} • {respondent.industry}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {respondent.durationMinutes} min interview on {respondent.interviewDate}
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
              ${respondent.willingnessToPay}/mo
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Purchase Power</span>
            <div className="text-sm font-semibold text-slate-700 mt-0.5">
              {respondent.budgetDecisionMaker ? 'Decision Maker ✅' : 'Influencer Only'}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Buying Urgency</span>
            <div className="text-sm font-semibold text-indigo-600 mt-0.5">
              {respondent.urgencyLevel.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* Simulated Audio Player Bar */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center transition-colors shadow-md cursor-pointer"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
            </button>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {isPlayingAudio ? 'Playing Verified Audio Tape snippet...' : 'Interview Audio Tape (Encrypted)'}
              </p>
              <p className="text-[11px] text-slate-400">Timestamp 02:14 - 04:30 • Verified Audio Hash #9A41</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className={`h-full bg-indigo-500 rounded-full transition-all duration-300 ${
                  isPlayingAudio ? 'w-3/5 animate-pulse' : 'w-1/4'
                }`}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400">03:40</span>
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
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1">Key Verbatim Takeaway</p>
                <p className="text-slate-900 font-medium italic text-sm">
                  {respondent.keyQuote}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {respondent.fullTranscript.map((line, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl text-sm transition-colors ${
                      line.highlight === 'pain'
                        ? 'bg-rose-50/80 border border-rose-200'
                        : line.highlight === 'validation'
                        ? 'bg-emerald-50/80 border border-emerald-200'
                        : line.highlight === 'objection'
                        ? 'bg-amber-50/80 border border-amber-200'
                        : 'bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {line.speaker}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">{line.timestamp}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{line.text}</p>
                    {line.highlight && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                        {line.highlight === 'pain' && (
                          <span className="text-rose-600">🔥 Burning Problem Signal</span>
                        )}
                        {line.highlight === 'validation' && (
                          <span className="text-emerald-700">✅ Direct Purchase Intent</span>
                        )}
                        {line.highlight === 'objection' && (
                          <span className="text-amber-700">⚠️ Risk / Objection Point</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Current Tools In Use</h4>
                <div className="flex flex-wrap gap-2">
                  {respondent.currentTools.map((tool, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Validation Screening Notes</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verified respondent from Fast Track B2B engineering pool. Audio was transcribed and processed via NexaBrains Anti-Hallucination Pipeline with strictly unprompted, objective questions.
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                  <span>Authenticity Score: <strong className="text-slate-800">{respondent.qualityScore}%</strong></span>
                  <span>Sentiment Index: <strong className="text-indigo-600">{respondent.sentiment}</strong></span>
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
