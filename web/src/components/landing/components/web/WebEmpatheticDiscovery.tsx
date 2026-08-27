"use client";
import React from 'react';
import { ArrowRight, Quote, ShieldCheck, DollarSign, CheckCircle2, UserCheck, Lock } from 'lucide-react';

interface WebEmpatheticDiscoveryProps {
  onOpenStudio: () => void;
  onOpenIdeaComposer: () => void;
}

export const WebEmpatheticDiscovery: React.FC<WebEmpatheticDiscoveryProps> = ({
  onOpenStudio,
  onOpenIdeaComposer,
}) => {
  return (
    <section className="py-16 sm:py-20 bg-page text-primary border-b border-line relative">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-8 sm:space-y-10">
        {/* Section Style Label */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-caution">
            01 / Verified Target Profiles
          </span>
          <span className="text-xs font-mono text-tertiary">Any Business or Niche</span>
        </div>

        {/* POSTER HEADLINE */}
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-3xl sm:text-5xl font-serif font-medium text-primary tracking-tight leading-tight">
            Real feedback from <br />
            <span className="italic text-caution">your exact target buyers.</span>
          </h2>
          <p className="text-sm sm:text-base text-secondary leading-relaxed">
            Every respondent is a verified professional or consumer matching your exact target criteria who actively deals with this problem today.
          </p>
        </div>

        {/* POSTER HERO VISUAL: Image + Profile Breakdown */}
        <div className="bg-raised border border-line rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Real Target Buyer Photo & Quote */}
          <div className="lg:col-span-7 relative flex flex-col justify-between overflow-hidden bg-[#1c1917] text-white">
            <img
              src="/images/decision_maker_interview_1787423903827.jpg"
              alt="Verified Target Customer Profile"
              referrerPolicy="no-referrer"
              className="w-full h-64 lg:h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917] via-[#1c1917]/60 to-transparent p-6 sm:p-8 flex flex-col justify-end space-y-3">
              <Quote className="w-6 h-6 text-[#d6cdb8]" />
              <blockquote className="text-base sm:text-lg font-serif text-white leading-snug">
                “Existing tools waste hours of manual work every week. If a product actually solves this for my team, I will adopt it immediately.”
              </blockquote>

              <div className="pt-3 border-t border-white/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Elena Rostova</h4>
                  <p className="text-[11px] text-[#d6cdb8]">Sample Verified Target Customer</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#8c6b38]/40 border border-[#8c6b38] text-[#f4ede2] font-mono text-[10px] font-bold">
                  Screened &amp; Verified
                </span>
              </div>
            </div>
          </div>

          {/* Right: Target Profile Screening Specs */}
          <div className="lg:col-span-5 p-6 sm:p-7 bg-sunken flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-caution uppercase tracking-wider block">
                How We Screen Respondents
              </span>
              <ul className="space-y-3 text-xs text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-caution shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-primary block">Exact Customer Match</strong>
                    <span>From everyday consumers to enterprise VPs, screened for your exact criteria.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-caution shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-primary block">Active Problem History</strong>
                    <span>Must have actively spent time or tried workarounds to fix this problem recently.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-caution shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-primary block">Unbiased, Honest Truth</strong>
                    <span>Incentivized respondents provide candid, unprompted feedback without polite flattery.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-raised border border-line flex items-center justify-between text-xs font-mono">
                <span className="text-tertiary">Real Humans</span>
                <span className="text-caution font-bold">100% Human • 0% Bots</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-raised border border-line flex items-center justify-between text-xs font-mono">
                <span className="text-tertiary">Verification</span>
                <span className="text-success font-bold">Identity &amp; Profile Checked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Single Footer Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs sm:text-sm font-serif italic text-tertiary text-center sm:text-left">
            Completely automated candidate sourcing. We recruit and compensate 30+ verified respondents for you.
          </p>
          <button
            onClick={onOpenIdeaComposer}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-page hover:bg-primary/90 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <span>Set Target Customer Criteria</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
