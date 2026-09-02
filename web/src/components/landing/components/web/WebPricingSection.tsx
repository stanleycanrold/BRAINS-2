"use client";
import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

export const WebPricingSection: React.FC<{ onOpenContact: () => void }> = ({
  onOpenContact,
}) => {
  return (
    <section id="pricing" className="py-24 bg-page text-primary border-b border-line">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-12">
        {/* Section Style Label */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
            06 / Transparent Pricing
          </span>
          <span className="text-xs font-mono text-secondary">Flat Rate • No Subscriptions Required</span>
        </div>

        {/* ONE MAIN POSTER MESSAGE */}
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary leading-[1.05]">
            $299 flat. 48 hours. <br />
            <span className="text-brand">Save $150,000 of misguided dev burn.</span>
          </h2>
          <p className="text-lg text-secondary leading-relaxed">
            Less than a single day of contractor wages to know with certainty if your target customer profile will pay.
          </p>
        </div>

        {/* 3 CLEAN BILLBOARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-4">
          {/* Tier 1: Free Audit */}
          <div className="p-8 rounded-3xl bg-raised border border-line flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-secondary uppercase">Free Tier</span>
              <h3 className="text-xl font-bold text-primary">Hypothesis Scan</h3>
              <div className="text-4xl font-extrabold font-mono text-primary">$0</div>
              <ul className="space-y-2 pt-4 border-t border-line text-xs text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Mom-Test question generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Target customer criteria builder</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Interactive Studio sample</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenContact}
              className="w-full py-3 rounded-xl bg-page hover:bg-sunken border border-line text-xs font-bold text-primary transition-all cursor-pointer"
            >
              Contact us
            </button>
          </div>

          {/* Tier 2: The 48-Hour Sprint (HERO TIER) */}
          <div className="p-8 rounded-3xl bg-raised border-2 border-brand shadow-lg flex flex-col justify-between space-y-6 relative">
            <span className="absolute -top-3 left-8 px-3 py-0.5 rounded-full bg-brand text-on-accent text-[10px] font-mono font-bold uppercase">
              Most Popular
            </span>

            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-brand uppercase">Standard Sprint</span>
              <h3 className="text-xl font-bold text-primary">48-Hour ICP Validation Sprint</h3>
              <div className="text-4xl font-extrabold font-mono text-brand">$299</div>
              <ul className="space-y-2 pt-4 border-t border-line text-xs text-primary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>30+ paid target customer profile responses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Custom Mom-Test non-leading question bank</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Van Westendorp pricing sensitivity curves</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>1-Page Investor Due Diligence Memo</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenContact}
              className="w-full py-3.5 rounded-xl bg-brand hover:bg-brand-hover text-on-accent text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Contact us</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tier 3: Venture Studio */}
          <div className="p-8 rounded-3xl bg-raised border border-line flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-secondary uppercase">Venture &amp; Studio</span>
              <h3 className="text-xl font-bold text-primary">Studio Pass</h3>
              <div className="text-4xl font-extrabold font-mono text-primary">$799<span className="text-sm text-secondary">/mo</span></div>
              <ul className="space-y-2 pt-4 border-t border-line text-xs text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>4 concurrent idea pipelines</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>150+ monthly paid target profile responses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Custom Slack validation copilot</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenContact}
              className="w-full py-3 rounded-xl bg-page hover:bg-sunken border border-line text-xs font-bold text-primary transition-all cursor-pointer"
            >
              Contact us
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
