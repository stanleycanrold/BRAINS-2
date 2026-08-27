"use client";
import React, { useState } from 'react';
import { SocialMention, WorkspaceMeta } from '../types';
import {
  Radio,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';

interface SocialScanTabProps {
  mentions: SocialMention[];
  workspace?: WorkspaceMeta;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SocialScanTab: React.FC<SocialScanTabProps> = ({ mentions, workspace, onShowToast }) => {
  const [activePlatform, setActivePlatform] = useState<string>('all');
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false);
  const [drafts, setDrafts] = useState<{
    posts: Array<{ id: string; platform: string; targetCommunity: string; title: string; body: string; strategyRationale: string }>;
    comments: Array<{ id: string; platform: string; targetThreadScenario: string; commentText: string; approach: string }>;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Platform filter reflects only platforms that actually produced signals.
  const platforms = ['all', ...Array.from(new Set(mentions.map((m) => m.platform)))];

  const filtered = mentions.filter((m) => {
    if (activePlatform === 'all') return true;
    return m.platform === activePlatform;
  });

  const handleGenerateDrafts = async () => {
    setIsGeneratingDrafts(true);
    try {
      const res = await fetch('/api/social/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: workspace?.tagline || workspace?.name || '',
          icp: workspace?.targetMarket || '',
          platform: activePlatform === 'all' ? 'Reddit & HackerNews' : activePlatform,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
        onShowToast(
          'Community Outreach Drafts Ready!',
          'Generated high-signal non-promotional discussion posts.',
          'success'
        );
      } else {
        throw new Error('Failed to generate');
      }
    } catch (err) {
      console.warn('Social draft generation failed', err);
      onShowToast(
        'Draft generation failed',
        'The drafting agent could not run right now. Try again in a moment.',
        'error'
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
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600-subtle text-indigo-700 border border-indigo-200">
                <Radio className="w-3.5 h-3.5 text-indigo-600" />
                {mentions.length} {mentions.length === 1 ? 'signal' : 'signals'} collected
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Community Signals & Organic Problem Mentions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verbatim quotes the research pass found in public discussions, merged with replies
              logged from your outreach channels.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateDrafts}
              disabled={isGeneratingDrafts}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-600-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
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
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-2 pt-5 border-t border-slate-200 mt-5">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activePlatform === p
                  ? 'bg-white text-white font-bold'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-200'
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
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-600-hover text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
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
                      : 'bg-slate-50 text-slate-900'
                  }`}
                >
                  {item.platform} • {item.handle}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    item.sentiment === 'High Pain'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-indigo-600-subtle text-indigo-600 border border-indigo-200'
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

            <p className="text-xs text-slate-500 leading-relaxed">{item.content}</p>

            {/* Extracted Needs & Engagement */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.extractedNeeds.length > 0 && (
                  <span className="text-[10px] font-bold uppercase text-slate-400">Extracted Needs:</span>
                )}
                {item.extractedNeeds.map((need, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-indigo-600-subtle text-indigo-700 rounded-md text-[10px] font-semibold"
                  >
                    {need}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                {/* Engagement only shows when it was actually recorded. */}
                {item.engagement.likes > 0 && (
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-slate-400" />
                    {item.engagement.likes} upvotes
                  </span>
                )}
                {item.engagement.comments > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    {item.engagement.comments} replies
                  </span>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Source
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-10 text-center">
            <p className="text-sm font-semibold text-slate-500">No community signals yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Once research runs, verbatim quotes it finds in public discussions appear here,
              alongside replies you log from your own outreach.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
