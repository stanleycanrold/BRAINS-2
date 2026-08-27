'use client';

import React, { useState } from 'react';
import { EvidenceQuote, Respondent } from '@/lib/domain/empirical-types';
import {
  Quote,
  Flame,
  ThumbsUp,
  Copy,
  Check,
  Filter,
  ShieldCheck,
  Tag,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Volume2,
  Radio,
  Share2,
  Globe,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface EvidenceTabProps {
  quotes: EvidenceQuote[];
  respondents: Respondent[];
  onOpenRespondent: (respondent: Respondent) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const EvidenceTab: React.FC<EvidenceTabProps> = ({
  quotes,
  respondents,
  onOpenRespondent,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [onlyUnprompted, setOnlyUnprompted] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    'all',
    'Problem Urgency',
    'Willingness to Pay',
    'Existing Friction',
    'Feature Requirement',
    'Objection & Risk',
  ];

  const sourceTypes = [
    { id: 'all', label: 'All Sources' },
    { id: 'interviews', label: '1-on-1 Interviews' },
    { id: 'social_all', label: 'Social Media & Forums' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'hackernews', label: 'Hacker News' },
    { id: 'twitter', label: 'X / Twitter' },
  ];

  const socialChannels = [
    { name: 'Reddit', subtext: 'r/devops, r/SaaS, r/startups, r/sysadmin', count: 18, icon: '🔴', status: 'Active Scan' },
    { name: 'Hacker News', subtext: 'Ask HN, Show HN & GRC debates', count: 12, icon: '🟠', status: 'Active Scan' },
    { name: 'X / Twitter', subtext: 'Engineering complaints & audit fatigue', count: 9, icon: '🔷', status: 'Active Scan' },
    { name: 'GitHub Discussions', subtext: 'Issues, compliance PRs & bash scripts', count: 14, icon: '🐙', status: 'Active Scan' },
    { name: 'G2 / TrustRadius', subtext: 'Legacy GRC negative churn reviews', count: 8, icon: '⭐', status: 'Active Scan' },
  ];

  const filteredQuotes = quotes.filter((q) => {
    const matchCategory = selectedCategory === 'all' || q.category === selectedCategory;
    const matchUnprompted = !onlyUnprompted || q.unprompted;
    
    let matchSource = true;
    if (selectedSourceType === 'interviews') {
      matchSource = q.sourceType === 'In-Depth Interview' || q.sourceType === 'Typeform Survey';
    } else if (selectedSourceType === 'social_all') {
      matchSource = q.sourceType !== 'In-Depth Interview' && q.sourceType !== 'Typeform Survey';
    } else if (selectedSourceType === 'reddit') {
      matchSource = q.sourceType.toLowerCase().includes('reddit');
    } else if (selectedSourceType === 'hackernews') {
      matchSource = q.sourceType.toLowerCase().includes('hacker news');
    } else if (selectedSourceType === 'twitter') {
      matchSource = q.sourceType.toLowerCase().includes('twitter') || q.sourceType.toLowerCase().includes('x');
    }

    return matchCategory && matchSource && matchUnprompted;
  });

  const handleCopyQuote = (quote: EvidenceQuote) => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.authorName} (${quote.authorRole}, ${quote.authorCompany}) [Source: ${quote.sourceType}]`);
    setCopiedId(quote.id);
    onShowToast('Quote copied with citation metadata!', quote.text.slice(0, 50) + '...', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Social Media & Research Agent Monitored Channels Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Channel Social &amp; Community Research Pipeline
              </h3>
              <p className="text-[11px] text-slate-400">
                Autonomous research agents continuously scan public developer discourse and forum threads for unprompted problem evidence.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80 self-start sm:self-auto">
            5 Channels Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {socialChannels.map((ch, i) => (
            <div
              key={i}
              onClick={() => {
                if (ch.name.includes('Reddit')) setSelectedSourceType('reddit');
                else if (ch.name.includes('Hacker')) setSelectedSourceType('hackernews');
                else if (ch.name.includes('Twitter')) setSelectedSourceType('twitter');
                else setSelectedSourceType('social_all');
              }}
              className="bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 p-3 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{ch.icon}</span>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-300">
                  {ch.count} citations
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 mt-1.5 group-hover:text-white">
                {ch.name}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ch.subtext}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Header filter bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Verbatim Evidence &amp; Voice of Customer Feed
            </h2>
            <p className="text-xs text-slate-500">
              Raw, unvarnished quotes transcribed with timestamp and social platform source verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyUnprompted(!onlyUnprompted)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                onlyUnprompted
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Unprompted Signals Only ({quotes.filter((q) => q.unprompted).length})</span>
            </button>
          </div>
        </div>

        {/* Source selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100">
          {sourceTypes.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedSourceType(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSourceType === st.id
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuotes.map((q) => {
          const resp = respondents.find((r) => r.id === q.respondentId);
          const isSocial = q.sourceType.includes('Reddit') || q.sourceType.includes('Hacker') || q.sourceType.includes('Twitter') || q.sourceType.includes('X');
          
          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between hover:shadow-md ${
                q.sentiment === 'urgent'
                  ? 'border-rose-200/90 shadow-2xs hover:border-rose-300'
                  : q.sentiment === 'positive'
                  ? 'border-emerald-200/90 shadow-2xs hover:border-emerald-300'
                  : q.sentiment === 'negative'
                  ? 'border-amber-200/90 shadow-2xs hover:border-amber-300'
                  : 'border-slate-200/90 shadow-2xs'
              }`}
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        q.category === 'Problem Urgency'
                          ? 'bg-rose-100 text-rose-800'
                          : q.category === 'Willingness to Pay'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.category === 'Objection & Risk'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {q.category}
                    </span>

                    {q.unprompted && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                        🔥 Unprompted
                      </span>
                    )}

                    {isSocial && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        💬 Verbatim Social Quote
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {q.sourceType}
                  </span>
                </div>

                {/* Quote Body */}
                <blockquote className="text-sm font-medium text-slate-800 leading-relaxed italic mb-4">
                  &ldquo;{q.text}&rdquo;
                </blockquote>

                {/* Tags & Upvotes */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {q.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                  {q.upvotes && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[10px] font-bold flex items-center gap-1 border border-amber-200/60">
                      <ThumbsUp className="w-2.5 h-2.5" />
                      {q.upvotes} community upvotes
                    </span>
                  )}
                </div>
              </div>

              {/* Author & Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={q.authorAvatar}
                    alt={q.authorName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{q.authorName}</h4>
                    <p className="text-[10px] text-slate-500">
                      {q.authorRole}, {q.authorCompany}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyQuote(q)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Copy quote with citation"
                  >
                    {copiedId === q.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {resp ? (
                    <button
                      onClick={() => onOpenRespondent(resp)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      View Source
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Public Web Citation</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
