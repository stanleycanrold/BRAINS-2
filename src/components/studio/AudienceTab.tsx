'use client';

import React, { useState } from 'react';
import { Respondent } from '@/lib/domain/empirical-types';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  DollarSign,
  Flame,
  Clock,
  ArrowUpDown,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  Radio,
} from 'lucide-react';

interface AudienceTabProps {
  respondents: Respondent[];
  targetMarket?: string;
  onOpenRespondent: (respondent: Respondent) => void;
  onOpenFastTrack: () => void;
}

export const AudienceTab: React.FC<AudienceTabProps> = ({
  respondents,
  targetMarket,
  onOpenRespondent,
  onOpenFastTrack,
}) => {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'pain' | 'wtp' | 'quality'>('pain');
  const [showLiveOnly, setShowLiveOnly] = useState<boolean>(false);

  const filteredRespondents = respondents
    .filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.company.toLowerCase().includes(search.toLowerCase()) ||
        r.role.toLowerCase().includes(search.toLowerCase()) ||
        r.keyQuote.toLowerCase().includes(search.toLowerCase());

      const matchSource = sourceFilter === 'all' || r.verifiedSource === sourceFilter;
      const matchUrgency =
        urgencyFilter === 'all' || r.urgencyLevel.toLowerCase().includes(urgencyFilter.toLowerCase());

      return matchSearch && matchSource && matchUrgency;
    })
    .sort((a, b) => {
      if (sortBy === 'pain') return b.painSeverity - a.painSeverity;
      if (sortBy === 'wtp') return b.willingnessToPay - a.willingnessToPay;
      if (sortBy === 'quality') return b.qualityScore - a.qualityScore;
      return 0;
    });

  // Extract distinct industries and roles
  const industries = Array.from(new Set(respondents.map((r) => r.industry))).slice(0, 4);
  const roles = Array.from(new Set(respondents.map((r) => r.role))).slice(0, 4);
  const distinctTools = Array.from(new Set(respondents.flatMap((r) => r.currentTools))).slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sample Data Disclaimer / Baseline Banner */}
      <div className="bg-amber-50/80 border border-amber-200/90 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100/90 rounded-xl text-amber-700 shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900">
                Baseline Sample Profiles &amp; Target Persona Preview
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-900 border border-amber-300/60">
                Sample Data (Demo Mode)
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              These profiles represent illustrative ICP screening parameters. Live verified decision makers, verified LinkedIn/GitHub work identities, and interview audio transcripts will automatically stream and populate here as customer discovery runs.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenFastTrack}
          className="px-3.5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Launch Live Discovery Round</span>
        </button>
      </div>

      {/* Top ICP Profile Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Target Persona Match: 98.4%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {respondents.length} Target Decision Makers Defined
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Ideal Customer Profile (ICP) Criteria Definition
            </h2>
            {targetMarket && (
              <p className="text-xs text-slate-500 mt-0.5">{targetMarket}</p>
            )}
          </div>

          <button
            onClick={onOpenFastTrack}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Recruit Target ICP</span>
          </button>
        </div>

        {/* ICP Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Roles</span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {roles.length > 0 ? roles.join(', ') : 'VP Eng, CTO, Head of DevOps, CISO'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Decision makers who own core workflow velocity</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Company Size & Segment</span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {respondents[0]?.companySize || '10 – 85 Employees (Seed to Series A)'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {industries.length > 0 ? industries.join(' / ') : 'B2B SaaS / Fintech / Cloud'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Workarounds</span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {distinctTools.length > 0 ? distinctTools.join(' • ') : 'Manual Spreadsheets • Legacy SaaS'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active tech stack & temporary solutions</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Primary Purchasing Trigger</span>
            <p className="text-xs font-bold text-slate-800 mt-1">High Urgency Pain & Friction</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Revenue deadlines or regulatory compliance</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by respondent name, company, quote, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Sources</option>
              <option value="Fast Track Verified">Fast Track Verified</option>
              <option value="Self-Sourced Organic">Organic</option>
              <option value="Cold Outreach">Cold Outreach</option>
              <option value="Community Partner">Community Partner</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Urgency:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Urgencies</option>
              <option value="immediate">Immediate (&lt;30 days)</option>
              <option value="medium">Medium (1-3 mos)</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="pain">Sort by Pain Severity</option>
              <option value="wtp">Sort by Willingness to Pay</option>
              <option value="quality">Sort by Quality Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Screened Respondents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Respondent / Profile</th>
                <th className="py-3.5 px-4">Company & Size</th>
                <th className="py-3.5 px-4 text-center">Pain Severity</th>
                <th className="py-3.5 px-4 text-center">WTP / Month</th>
                <th className="py-3.5 px-4">Urgency & Verification</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRespondents.map((resp) => (
                <tr
                  key={resp.id}
                  onClick={() => onOpenRespondent(resp)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={resp.avatar}
                        alt={resp.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {resp.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{resp.role}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{resp.company}</div>
                    <div className="text-[11px] text-slate-500">
                      {resp.companySize} • {resp.industry}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 text-xs">
                      <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      {resp.painSeverity}/10
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-emerald-600 text-sm">
                      ${resp.willingnessToPay}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {resp.budgetDecisionMaker ? 'Budget Holder' : 'Influencer'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        {resp.verifiedSource}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {resp.urgencyLevel.split(' ')[0]} urgency
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRespondent(resp);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Transcript</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRespondents.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No respondents matched the current filters. Try resetting search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
