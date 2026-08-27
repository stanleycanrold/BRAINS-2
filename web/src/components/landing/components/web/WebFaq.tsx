"use client";
import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

export const WebFaq: React.FC<{ onOpenIdeaComposer: () => void }> = ({ onOpenIdeaComposer }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Does this work for both consumer (B2C) and business (B2B) ideas?',
      a: 'Yes. Whether you are validating a mobile consumer app, e-commerce brand, marketplace, or B2B workflow tool, we recruit and screen respondents matching your exact customer demographic, behavioral profile, and pain point history.',
    },
    {
      q: 'How does validation work without founder interview scheduling burnout?',
      a: 'We design rigorous, custom Mom-Test question banks tailored to your hypothesis. We then deploy them directly to verified, compensated target customers matching your profile. They provide deep, written and voice-recorded answers about past spend, time lost, and current workarounds.',
    },
    {
      q: 'Why do you pay the target customer profiles?',
      a: 'Compensating target respondents ensures they spend dedicated time providing detailed, unprompted feedback on their real friction, rather than rushing through or giving polite platitudes to be nice.',
    },
    {
      q: 'What if validation proves my idea won’t work?',
      a: 'That is the highest-value outcome: discovering fatal blockers in 48 hours before writing code, rather than burning 6 months of precious runway building something target customers will not buy.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-raised text-primary border-b border-line">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-8 sm:space-y-10">
        {/* Section Style Label */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
            06 / Direct Answers
          </span>
          <span className="text-xs font-mono text-secondary">FAQ</span>
        </div>

        {/* ONE MAIN POSTER MESSAGE */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary leading-tight">
            FAQs
          </h2>
          <p className="text-sm sm:text-base text-secondary">
            Frequently asked questions about our 48-hour testing process.
          </p>
        </div>

        {/* CLEAN ACCORDION */}
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((f, idx) => (
            <div key={idx} className="py-4 sm:py-5">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left flex items-center justify-between gap-3 cursor-pointer group"
              >
                <span className="text-base sm:text-lg font-bold text-primary group-hover:text-brand transition-colors">
                  {f.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-secondary shrink-0 transition-transform duration-200 ${
                    openIdx === idx ? 'rotate-180 text-brand' : ''
                  }`}
                />
              </button>

              {openIdx === idx && (
                <div className="pt-3 text-xs sm:text-sm text-secondary leading-relaxed max-w-2xl">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Final High-Conviction Poster CTA */}
        <div className="p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-brand text-on-accent flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs text-center sm:text-left">
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold">Ready to test your idea or feature?</h3>
            <p className="text-xs sm:text-sm text-on-accent/80">
              Get your 48-hour report, price sweet spots, and verified customer proof.
            </p>
          </div>
          <button
            onClick={onOpenIdeaComposer}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-raised hover:bg-sunken text-brand text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <span>Start 48-Hour Validation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
