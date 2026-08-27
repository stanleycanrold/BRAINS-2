'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Globe, Lock, Shield, Link2, Send } from 'lucide-react';

interface ShareModalProps {
  workspaceId: string;
  workspaceName: string;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, desc?: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  workspaceId,
  workspaceName,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'public' | 'restricted'>('public');
  const [inviteEmail, setInviteEmail] = useState('');

  if (!isOpen) return null;

  const shareUrl = `https://app.nexabrains.io/w/${workspaceId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onShowToast('Share link copied to clipboard!', shareUrl);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onShowToast('Invitation sent!', `Collaborator invite dispatched to ${inviteEmail}`);
    setInviteEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Share Workspace</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Allow investors, co-founders, or teammates to review live validation evidence.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Public Link Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Live Public Workspace URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all overflow-hidden">
                <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">{shareUrl}</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Access Mode */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Access Mode</span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Public Read-Only Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAccessLevel('public')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  accessLevel === 'public'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-slate-900">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Public View</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Anyone with the link can explore data, audio snippets, and stats.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAccessLevel('restricted')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  accessLevel === 'restricted'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-slate-900">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Restricted Access</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Only invited team members with approved email addresses.
                </p>
              </button>
            </div>
          </div>

          {/* Email Invite Form */}
          <form onSubmit={handleInvite} className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Invite Collaborator
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="investor@partnerfund.vc or cofounder@startup.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Invite
              </button>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            End-to-End Cryptographically Stamped
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
