"use client";
import React from 'react';
import { ShieldCheck, DollarSign, ArrowRight, CheckCircle2, FileCheck, FileText } from 'lucide-react';

export const WebDashboardSnapshots: React.FC<{
  onOpenContact: () => void;
}> = ({ onOpenContact }) => {
  return (
    <section className="py-16 sm:py-20 bg-raised text-primary border-b border-line">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-8 sm:space-y-10">
        {/* Section Style Label */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
            03 / What You Receive
          </span>
          <span className="text-xs font-mono text-secondary">Ready in 48 Hours</span>
        </div>

        {/* ONE MAIN POSTER MESSAGE */}
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary leading-tight">
            A clear GO or STOP decision.
          </h2>
          <p className="text-sm sm:text-base text-secondary leading-relaxed">
            Empirical clarity backed by verbatim quotes from target customers, validated pricing recommendations, and a definitive confidence score.
          </p>
        </div>

        {/* POSTER BLUEPRINT CARD */}
        <div className="border-2 border-primary rounded-2xl sm:rounded-3xl p-5 sm:p-8 bg-page shadow-xs space-y-6">
          {/* Top Verdict Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-line">
            <div>
              <span className="text-[11px] font-mono font-bold text-secondary uppercase tracking-wider block">
                Decision Report #2026-08
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-primary mt-0.5 flex items-center gap-2.5">
                <span>DECISION: STRONG GO</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-success-subtle text-success border border-success/30 font-bold">
                  86% Score
                </span>
              </h3>
            </div>

            <button
              onClick={onOpenContact}
              className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-on-accent text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Contact us</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Unified Pillar Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Verbatim Responses */}
            <div className="bg-raised p-4 sm:p-5 rounded-xl border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-brand">1. Real Quotes</span>
                <FileText className="w-4 h-4 text-brand" />
              </div>
              <p className="text-xs text-primary leading-relaxed italic">
                “We spent 3 full weeks pulling manual records and lost $16,800. An automated tool is an instant buy for us.”
              </p>
              <div className="text-[10px] font-mono text-secondary">Elena R. • Verified Target Customer</div>
            </div>

            {/* Pillar 2: The Price Elasticity */}
            <div className="bg-raised p-4 sm:p-5 rounded-xl border border-line space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-success">2. Price Sweet Spot</span>
              <div className="space-y-1">
                <div className="text-xl font-bold font-mono text-primary">$249 / mo</div>
                <div className="text-[11px] text-secondary">Optimal revenue ceiling based on price sensitivity curve.</div>
              </div>
              <div className="w-full h-1.5 rounded bg-inset overflow-hidden">
                <div className="h-full bg-success w-[85%]"></div>
              </div>
            </div>

            {/* Pillar 3: The Fatal Risks */}
            <div className="bg-raised p-4 sm:p-5 rounded-xl border border-line space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-danger">3. Key Blocker Solved</span>
              <p className="text-xs text-secondary leading-relaxed">
                78% hated bloated web dashboards. <strong className="text-primary">Action:</strong> Ship strictly as a simple CLI tool.
              </p>
              <div className="text-[10px] font-mono text-success font-semibold">6 Pre-Orders Secured</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
