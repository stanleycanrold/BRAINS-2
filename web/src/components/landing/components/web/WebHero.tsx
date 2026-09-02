"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ShieldCheck, DollarSign, Clock, CheckCircle2, Radio, Users2, Sparkles } from 'lucide-react';

interface WebHeroProps {
  onOpenStudio: () => void;
  onOpenIdeaComposer: () => void;
  onTrySandbox?: (idea: string) => void;
}

const ROTATING_TARGETS = ['idea', 'feature', 'MVP'];

export const WebHero: React.FC<WebHeroProps> = ({
  onOpenStudio,
  onOpenIdeaComposer,
}) => {
  const [targetIndex, setTargetIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTargetIndex((prev) => (prev + 1) % ROTATING_TARGETS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const currentTarget = ROTATING_TARGETS[targetIndex];

  return (
    <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 bg-raised text-primary border-b border-line relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--surface-sunken)_1px,transparent_1px),linear-gradient(to_bottom,var(--surface-sunken)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10 space-y-10">
        {/* Top Header */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="mk-rise inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sunken border border-line text-xs font-mono text-brand">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="font-bold tracking-wide uppercase">All-in-One Validation Platform • 48-Hour Turnaround</span>
          </div>

          {/* Display face and rise-in ported from the original hero: the
              General Sans display cut at clamp(38px, 6.2vw, 74px) with tight
              tracking is what gives the headline its weight; the raw utility
              stack read flat by comparison. */}
          <h1 className="type-display-2xl mk-rise text-balance text-primary">
            Validate your{' '}
            <span className="inline-grid grid-cols-1 grid-rows-1 text-brand align-baseline overflow-hidden py-1 -my-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentTarget}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="col-start-1 row-start-1"
                >
                  {currentTarget}
                </motion.span>
              </AnimatePresence>
            </span>{' '}
            with ideal customers <br />
            <span className="italic font-serif font-normal text-brand">in 48 hours.</span>
          </h1>

          <p className="mk-rise mk-delay-1 type-body-xl text-secondary max-w-2xl mx-auto">
            Unbiased feedback and empirical willingness-to-pay from verified ICPs — so you build what customers actually want to buy.
          </p>
        </div>

        {/* Primary CTA — search input removed per founder request; validation starts via composer */}
        <div className="mk-rise mk-delay-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenIdeaComposer}
            className="px-7 py-3.5 bg-brand hover:bg-brand-hover text-on-accent text-sm font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <span>Validate your idea in 48h</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenStudio}
            className="px-7 py-3.5 bg-raised border border-line hover:bg-sunken text-primary text-sm font-bold rounded-xl transition-colors cursor-pointer"
          >
            Explore live demo
          </button>
        </div>

        {/* 3-Pillar Foolproof Deliverable Cards (Social Scan + Paid Target Discovery + Decision Gate) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {/* Pillar 1: Social & Market Scan */}
          <div className="p-5 rounded-2xl bg-raised border border-line shadow-xs space-y-2 hover:border-brand/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-brand-subtle border border-line flex items-center justify-center text-brand">
              <Radio className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">1. Social &amp; Market Scan</h3>
              <span className="text-[10px] font-mono font-bold text-brand uppercase bg-brand-subtle px-1.5 py-0.5 rounded">
                Live Pulse
              </span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Mines organic complaints, competitor teardowns, and manual workarounds across Reddit, X, and forums.
            </p>
          </div>

          {/* Pillar 2: Target Customer Discovery */}
          <div className="p-5 rounded-2xl bg-raised border border-line shadow-xs space-y-2 hover:border-brand/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-success-subtle border border-line flex items-center justify-center text-success">
              <Users2 className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">2. Target Customer Discovery</h3>
              <span className="text-[10px] font-mono font-bold text-success uppercase bg-success-subtle px-1.5 py-0.5 rounded">
                Mom-Test
              </span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Calibrated past-behavior questions sent to verified target customer profiles with completely automated discovery.
            </p>
          </div>

          {/* Pillar 3: Empirical Decision Gate */}
          <div className="p-5 rounded-2xl bg-raised border border-line shadow-xs space-y-2 hover:border-brand/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-caution-subtle border border-line flex items-center justify-center text-caution">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">3. GO / KILL Decision</h3>
              <span className="text-[10px] font-mono font-bold text-caution uppercase bg-caution-subtle px-1.5 py-0.5 rounded">
                48h Result
              </span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Price sensitivity curves, statistical confidence scores, and an actionable decision summary.
            </p>
          </div>
        </div>

        {/* Compact Audited Report Preview Strip */}
        <div className="bg-page border border-line rounded-2xl p-4 sm:p-5 shadow-xs max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <img
              src="/images/target_buyer_feedback_1787427041920.jpg"
              alt="Verified Target Customer Profile"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-line"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-mono font-bold text-primary">
                  Audited Report Sample • GO Decision (86% Confidence)
                </span>
              </div>
              <p className="text-xs text-secondary truncate max-w-md">
                “Lost 3 weeks pulling manual logs. Will purchase CLI automation on card immediately.”
              </p>
            </div>
          </div>

          <button
            onClick={onOpenStudio}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-raised border border-line hover:bg-sunken text-xs font-bold text-brand flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <span>Explore Live Studio Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-10 text-xs text-secondary font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>100% Screened Target Profiles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand" />
            <span>48-Hour Turnaround</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Automated Sourcing &amp; Discovery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-caution" />
            <span>All Business Models (B2B &amp; B2C)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
