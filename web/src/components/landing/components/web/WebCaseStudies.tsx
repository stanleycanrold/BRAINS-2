"use client";
import React from 'react';
import { ArrowRight, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

export const WebCaseStudies: React.FC<{ onOpenContact?: () => void }> = () => {
  return (
    <section className="py-16 sm:py-20 bg-raised text-primary border-b border-line">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-8 sm:space-y-10">
        {/* Section Style Label */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
            05 / Real Founder Outcomes
          </span>
          <span className="text-xs font-mono text-secondary">Both Outcomes Are Wins</span>
        </div>

        {/* ONE MAIN POSTER MESSAGE */}
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary leading-tight">
            Save months of dev burn, or pre-sell your MVP.
          </h2>
          <p className="text-sm sm:text-base text-secondary leading-relaxed">
            Every validation ends in either saving your life savings from a bad idea, or giving you the exact blueprint to pre-sell real buyers.
          </p>
        </div>

        {/* 2 POSTER CASE STUDIES WITH AUTHENTIC PHOTOGRAPHY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
          {/* CASE 1: THE KILL DECISION */}
          <div className="rounded-2xl sm:rounded-3xl bg-danger-subtle border border-danger-border overflow-hidden flex flex-col justify-between shadow-xs">
            <div className="relative h-40 bg-[#1c1917]">
              <img
                src="/images/founder_listening_1787423888492.jpg"
                alt="Founder listening to tough truth"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-full bg-danger text-on-accent text-[11px] font-mono font-bold uppercase flex items-center gap-1 shadow-xs">
                  <X className="w-3 h-3" />
                  <span>KILL DECISION</span>
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-secondary">Consumer Mobile App</div>
                <h3 className="text-xl font-bold text-primary">DailyPace Audio</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Founder’s running group praised the concept. But 48-hour testing with 30 marathoners proved none had ever paid for audio cues. The founder killed the project in 48 hours and preserved full runway.
                </p>
              </div>

              <div className="pt-3 border-t border-danger-border flex items-center justify-between font-mono">
                <span className="text-[11px] text-secondary">Outcome:</span>
                <span className="text-xs font-bold text-danger">4 Months Dev Burn Saved</span>
              </div>
            </div>
          </div>

          {/* CASE 2: THE PIVOT & GO DECISION */}
          <div className="rounded-2xl sm:rounded-3xl bg-success-subtle border border-success/30 overflow-hidden flex flex-col justify-between shadow-xs">
            <div className="relative h-40 bg-[#1c1917]">
              <img
                src="/images/founder_relief_1787423917183.jpg"
                alt="Founder experiencing relief and clarity"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-full bg-success text-on-accent text-[11px] font-mono font-bold uppercase flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3" />
                  <span>PIVOT &amp; PRE-SELL</span>
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-secondary">Developer CLI Tool</div>
                <h3 className="text-xl font-bold text-primary">AutoAudit CLI</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Founders planned a heavy 6-month web dashboard. Customer validation proved target buyers only wanted a fast terminal CLI. Founders pivoted spec and secured 6 paid pre-orders before coding.
                </p>
              </div>

              <div className="pt-3 border-t border-success/30 flex items-center justify-between font-mono">
                <span className="text-[11px] text-secondary">Outcome:</span>
                <span className="text-xs font-bold text-success">6 Pre-Orders Before Coding</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
