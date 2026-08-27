"use client";
import React from 'react';
import { CompetitorWorkaround } from '../types';
import { Zap, ExternalLink } from 'lucide-react';

interface CompetitorTabProps {
  competitors: CompetitorWorkaround[];
  workspaceName?: string;
  onSelectTab: (tabId: string) => void;
}

export const CompetitorTab: React.FC<CompetitorTabProps> = ({
  competitors,
  workspaceName = 'Our Solution',
}) => {
  // Two honest groups: named tools research found, and what people actually
  // do instead today. Stats only render when research produced them.
  const tools = competitors.filter((c) => c.category !== 'Manual Workflow');
  const workarounds = competitors.filter((c) => c.category === 'Manual Workflow');

  const renderCard = (comp: CompetitorWorkaround) => (
    <div
      key={comp.id}
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500">
              {comp.category}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1.5">{comp.name}</h3>
          </div>
          {/* Stats the research never produced stay hidden, not zeroed. */}
          {comp.marketShareEstimate > 0 && (
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900">{comp.marketShareEstimate}%</span>
              <span className="text-[10px] text-slate-400 block">estimated share</span>
            </div>
          )}
        </div>

        {(comp.satisfactionScore > 0 || comp.monthlyCostRange) && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {comp.satisfactionScore > 0 && (
              <div>
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Satisfaction</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {comp.satisfactionScore} / 10
                </span>
              </div>
            )}
            {comp.monthlyCostRange && (
              <div>
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Cost Burden</span>
                <span className="font-semibold text-slate-900 truncate block mt-0.5">
                  {comp.monthlyCostRange}
                </span>
              </div>
            )}
          </div>
        )}

        {comp.primaryComplaint && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              {comp.category === 'Manual Workflow' ? 'Why It Persists:' : 'Primary User Complaint:'}
            </span>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{comp.primaryComplaint}</p>
          </div>
        )}

        {comp.whyUsersChurn.length > 0 && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Why Customers Abandon:
            </span>
            <ul className="mt-1 space-y-1 text-xs text-slate-500">
              {comp.whyUsersChurn.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-500 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {comp.sourceUrl && (
          <a
            href={comp.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <ExternalLink className="w-3 h-3" />
            Evidence source
          </a>
        )}
      </div>

      {comp.ourWedgeAdvantage && (
        <div className="mt-5 pt-4 border-t border-slate-200 bg-indigo-600-subtle/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
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
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {tools.length} named {tools.length === 1 ? 'tool' : 'tools'} • {workarounds.length}{' '}
                {workarounds.length === 1 ? 'workaround' : 'workarounds'}
              </span>
              <span className="text-xs text-slate-500 font-medium">From the research pass</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Incumbent & Workaround Competitive Landscape
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How prospects currently solve the problem before adopting {workspaceName}.
            </p>
          </div>
        </div>
      </div>

      {competitors.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-10 text-center">
          <p className="text-sm font-semibold text-slate-500">No competitor research yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Once research runs, the tools and workarounds it finds appear here.
          </p>
        </div>
      )}

      {tools.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Direct Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{tools.map(renderCard)}</div>
        </div>
      )}

      {workarounds.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Current Workarounds - what people do instead
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{workarounds.map(renderCard)}</div>
        </div>
      )}
    </div>
  );
};
