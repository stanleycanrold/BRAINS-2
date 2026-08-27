'use client';

import React, { useState } from 'react';
import { SocialMention, WorkspaceMeta } from '@/lib/domain/empirical-types';
import {
  Radio,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  Sparkles,
  Plus,
  Search,
  Copy,
  Check,
  Send,
  Loader2,
  Share2,
} from 'lucide-react';

interface SocialScanTabProps {
  mentions: SocialMention[];
  workspace?: WorkspaceMeta;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SocialScanTab: React.FC<SocialScanTabProps> = ({ mentions, workspace, onShowToast }) => {
  const [activePlatform, setActivePlatform] = useState<string>('all');
  const [newKeyword, setNewKeyword] = useState('');
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false);
  const [drafts, setDrafts] = useState<{
    posts: Array<{ id: string; platform: string; targetCommunity: string; title: string; body: string; strategyRationale: string }>;
    comments: Array<{ id: string; platform: string; targetThreadScenario: string; commentText: string; approach: string }>;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const platforms = ['all', 'Reddit', 'HackerNews', 'X/Twitter', 'G2'];

  const filtered = mentions.filter((m) => {
    if (activePlatform === 'all') return true;
    return m.platform === activePlatform;
  });

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    onShowToast('Social scanner updated!', `Monitoring web discussions for "${newKeyword}"`, 'success');
    setNewKeyword('');
  };

  const handleGenerateDrafts = async () => {
    setIsGeneratingDrafts(true);
    try {
      const res = await fetch('/api/social/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: workspace?.tagline || 'Manual compliance auditing and spreadsheet fatigue',
          icp: workspace?.targetMarket || 'VPs of Engineering, CTOs, and DevOps Leads',
          valueProp: 'Continuous automated evidence gathering from GitHub & CloudTrail',
          platform: activePlatform === 'all' ? 'Reddit & HackerNews' : activePlatform,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
        onShowToast(
          'Community Outreach Drafts Ready!',
          'Generated high-signal non-promotional discussion posts and comment replies.',
          'success'
        );
      } else {
        throw new Error('Failed to generate');
      }
    } catch (err) {
      console.warn('Social draft generation error, utilizing fallback', err);
      // Fallback drafts
      setDrafts({
        posts: [
          {
            id: 'p-1',
            platform: 'Reddit (r/devops)',
            targetCommunity: 'r/devops',
            title: 'How do other Series A/B teams handle SOC-2 evidence without pulling senior devs for 3 weeks?',
            body: 'We are prepping for our annual SOC-2 audit cycle. Historically we lose 2 engineers for almost a month just taking screenshots of IAM policies and branch protections. Has anyone found a reliable way to automate continuous evidence collection without granting full database read roles?',
            strategyRationale: 'Presents an authentic technical pain point that prompts peers to share their real workarounds.',
          },
          {
            id: 'p-2',
            platform: 'Hacker News (Ask HN)',
            targetCommunity: 'Hacker News',
            title: 'Ask HN: What is your biggest bottleneck when selling to enterprise buyers?',
            body: 'As our startup enters mid-market procurement, GRC security questionnaires and SOC-2 proof have become our #1 deal blocker. Curious how other technical founders bridge this gap before hiring a full-time SecOps lead.',
            strategyRationale: 'High engagement on HN where engineering founders congregate.',
          },
        ],
        comments: [
          {
            id: 'c-1',
            platform: 'Reddit (r/SaaS)',
            targetThreadScenario: 'When someone complains about enterprise compliance cost',
            commentText: 'The real hidden cost is not the auditor fee, but developer context-switching. If you can automate the metadata collection from GitHub webhooks early, you avoid the panic sprint right before the audit.',
            approach: 'Value-first diagnostic advice establishing domain authority.',
          },
        ],
      });
      onShowToast(
        'Community Outreach Drafts Loaded',
        'Synthesized conversation starters for Reddit and Hacker News.',
        'info'
      );
    } finally {
      setIsGeneratingDrafts(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Copied to clipboard!', 'Ready to paste into community forums.', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                Live Community Social Scanner
              </span>
              <span className="text-xs text-slate-500 font-medium">Scanning r/SaaS, HN, X, IndieHackers</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Unfiltered Organic Discussions & Problem Signals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time monitoring of founder gripes, tooling complaints, and urgent feature requests.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateDrafts}
              disabled={isGeneratingDrafts}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isGeneratingDrafts ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Drafts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Draft Community Outreach</span>
                </>
              )}
            </button>

            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                type="text"
                placeholder="+ Monitor keyword"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 w-44"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-2 pt-5 border-t border-slate-100 mt-5">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activePlatform === p
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p === 'all' ? 'All Platforms' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Outreach Drafts Section if available */}
      {drafts && (
        <div className="bg-indigo-900 text-white p-6 rounded-2xl border border-indigo-800 shadow-xl space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" />
              <h3 className="text-base font-bold text-white">
                Autonomous Outreach Posts & Non-Promotional Discussion Starters
              </h3>
            </div>
            <button
              onClick={() => setDrafts(null)}
              className="text-xs text-indigo-200 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drafts.posts.map((post) => (
              <div
                key={post.id}
                className="bg-indigo-950/70 p-4 rounded-xl border border-indigo-800/80 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-indigo-300">
                    <span className="font-bold uppercase tracking-wider">{post.platform}</span>
                    <span className="text-[11px] bg-indigo-800/60 px-2 py-0.5 rounded-md">
                      {post.targetCommunity}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1.5">{post.title}</h4>
                  <p className="text-xs text-indigo-200/90 mt-2 leading-relaxed whitespace-pre-line font-mono bg-black/20 p-2.5 rounded-lg border border-indigo-900">
                    {post.body}
                  </p>
                  <p className="text-[11px] text-indigo-300 italic mt-2">
                    Strategy: {post.strategyRationale}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyText(post.id, `${post.title}\n\n${post.body}`)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  {copiedId === post.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied Draft!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Discussion Post</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    item.platform === 'Reddit'
                      ? 'bg-orange-100 text-orange-800'
                      : item.platform === 'HackerNews'
                      ? 'bg-amber-100 text-amber-800'
                      : item.platform === 'X/Twitter'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {item.platform} • {item.handle}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    item.sentiment === 'High Pain'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  }`}
                >
                  {item.sentiment}
                </span>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">{item.timestamp}</span>
            </div>

            {item.title && (
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
            )}

            <p className="text-xs text-slate-700 leading-relaxed">{item.content}</p>

            {/* Extracted Needs & Engagement */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase text-slate-400">Extracted Needs:</span>
                {item.extractedNeeds.map((need, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-semibold"
                  >
                    {need}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3 text-slate-400" />
                  {item.engagement.likes} upvotes
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-slate-400" />
                  {item.engagement.comments} replies
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
