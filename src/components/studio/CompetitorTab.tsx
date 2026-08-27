'use client';

import React, { useState } from 'react';
import { CompetitorWorkaround } from '@/lib/domain/empirical-types';
import { Shield, Star, AlertCircle, Zap, CheckCircle2, XCircle, ArrowRight, Plus, Sparkles } from 'lucide-react';

interface CompetitorTabProps {
  competitors: CompetitorWorkaround[];
  workspaceName?: string;
  onSelectTab: (tabId: string) => void;
}

export const CompetitorTab: React.FC<CompetitorTabProps> = ({
  competitors,
  workspaceName = 'Our Solution',
  onSelectTab,
}) => {
  const [selectedComp, setSelectedComp] = useState<CompetitorWorkaround | null>(competitors[0] || null);

  // Dynamic calculations from competitors
  const avgSatisfaction = competitors.length > 0
    ? (competitors.reduce((acc, c) => acc + c.satisfactionScore, 0) / competitors.length).toFixed(1)
    : '4.8';

  const totalMarketShare = competitors.reduce((acc, c) => acc + c.marketShareEstimate, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Workaround Gap Index: High
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Incumbent average satisfaction: {avgSatisfaction} / 10
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Incumbent & Workaround Competitive Landscape
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How technical decision makers and prospects currently solve the problem before adopting {workspaceName}.
            </p>
          </div>
        </div>
      </div>

      {/* Competitors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {competitors.map((comp) => (
          <div
            key={comp.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {comp.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">{comp.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">{comp.marketShareEstimate}%</span>
                  <span className="text-[10px] text-slate-400 block">estimated share</span>
                </div>
              </div>

              {/* Satisfaction & Cost */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Satisfaction</span>
                  <div className="flex items-center gap-1 font-bold text-amber-600 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{comp.satisfactionScore} / 10</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Cost Burden</span>
                  <span className="font-semibold text-slate-800 truncate block mt-0.5">
                    {comp.monthlyCostRange}
                  </span>
                </div>
              </div>

              {/* Primary Complaint */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                  Primary User Complaint:
                </span>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{comp.primaryComplaint}</p>
              </div>

              {/* Churn Reasons */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Why Customers Abandon:
                </span>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {comp.whyUsersChurn.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Our Wedge Advantage */}
            <div className="mt-5 pt-4 border-t border-slate-100 bg-indigo-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                    {workspaceName} Wedge Advantage:
                  </span>
                  <p className="text-xs text-indigo-950 font-medium mt-0.5">{comp.ourWedgeAdvantage}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Feature & Go-To-Market Parity Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Dimension</th>
                <th className="py-3 px-4 text-indigo-700 bg-indigo-50/50">{workspaceName}</th>
                {competitors.slice(0, 3).map((c) => (
                  <th key={c.id} className="py-3 px-4">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Developer Self-Serve Onboarding</td>
                <td className="py-3 px-4 bg-indigo-50/30 text-emerald-700 font-bold">✅ Instant Sign-up</td>
                {competitors.slice(0, 3).map((c, i) => (
                  <td key={c.id} className="py-3 px-4">
                    {i === 0 ? '❌ Manual / High Friction' : i === 1 ? '⚠️ Demo Required' : '⚠️ Setup Scripts'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Transparent Pricing</td>
                <td className="py-3 px-4 bg-indigo-50/30 text-emerald-700 font-bold">✅ Published Card Tiers</td>
                {competitors.slice(0, 3).map((c, i) => (
                  <td key={c.id} className="py-3 px-4">
                    {i === 0 ? '✅ $0 (High Labor)' : i === 1 ? '❌ Annual Contracts' : '✅ $0 (Internal Dev)'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Continuous Drift Alerting</td>
                <td className="py-3 px-4 bg-indigo-50/30 text-emerald-700 font-bold">✅ Real-Time Automated</td>
                {competitors.slice(0, 3).map((c, i) => (
                  <td key={c.id} className="py-3 px-4">
                    {i === 0 ? '❌ Manual Spreadsheet' : i === 1 ? '✅ Scheduled Audits' : '❌ Unmonitored'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
