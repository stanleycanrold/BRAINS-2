'use client';

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useStudioEntry } from '@/components/landing/MarketingShell';

/**
 * About, rebuilt in the empirical design language: the same section rhythm
 * as the landing (mono eyebrow label rows, white billboards on #f7f8fa,
 * #14267a accents), carrying the site's original copy verbatim.
 */

const RULES = [
  {
    title: 'We never soften a weak signal to be encouraging',
    body: 'If the research turns up little evidence anyone has the problem, the report says so plainly. A founder who hears what they wanted to hear from us has learned nothing they could not have gotten from a friend.',
  },
  {
    title: 'We show the case against as deliberately as the case for',
    body: 'Research that only collects agreement is flattery. Every report keeps the strongest counter-evidence in its own section, so it cannot quietly get folded into a positive summary.',
  },
  {
    title: 'We screen responses for quality, not for agreement',
    body: 'A generic or clearly automated survey response does not count toward your score, whichever way it answered. Rejecting only the negative ones would bias every score upward, which is the most damaging thing a validation product could do.',
  },
  {
    title: 'We never invent a source to fill a gap',
    body: 'If live search turns up nothing, the report is flagged as unsourced rather than dressed up with plausible-sounding citations. An invented statistic is a trust problem, not a formatting one.',
  },
  {
    title: 'A low score is a reason to sharpen, not a verdict on you',
    body: 'Validation is a loop. If the signal is weak, the idea can be reworked and run again with no limit on rounds, and every past version stays readable, including the ones that did not pass.',
  },
  {
    title: 'We never post anywhere as you',
    body: 'We draft, you publish, in every tier, permanently. Communities can tell when they are being farmed by a bot, and getting your account banned would cost you the exact audience you are trying to reach.',
  },
];

export function AboutBody() {
  const { openComposer } = useStudioEntry();

  return (
    <div className="bg-page text-primary">
      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-6">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
            About
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Evidence over opinion.
          </h1>
          <p className="text-lg text-secondary leading-relaxed max-w-2xl">
            Most people building something new ask friends, post on social, or
            start building and hope. All three feel like validation and none of
            them are. BRAINS AI exists to replace that feeling with something
            you can check.
          </p>
        </div>
      </section>

      {/* Rules */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
              What we refuse to do
            </span>
            <span className="text-xs font-mono text-secondary">
              Rules we hold even when they cost us
            </span>
          </div>

          <p className="text-lg text-secondary leading-relaxed max-w-3xl">
            A validation tool that tells founders what they want to hear is not
            a validation tool. These are the positions that make the product
            genuinely useful, and each one makes it look worse in the short
            term.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RULES.map((rule) => (
              <div
                key={rule.title}
                className="p-7 rounded-3xl bg-raised border border-line space-y-3"
              >
                <h3 className="text-base font-bold text-primary">
                  {rule.title}
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  {rule.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Narrow scope */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
              What we are narrow about
            </span>
            <span className="text-xs font-mono text-secondary">
              One risk, reduced well
            </span>
          </div>

          <div className="max-w-3xl space-y-5">
            <p className="text-lg text-secondary leading-relaxed">
              A validation round measures one thing: whether the problem is
              real to the people who have it. Whether they describe it
              unprompted, whether they already spend money or hours on it, and
              whether you can find enough of them in a place you can name.
            </p>
            <p className="text-lg text-secondary leading-relaxed">
              Pricing, distribution, timing and execution all sit outside that.
              We would rather do the one thing properly and say where it stops
              than stretch a score across questions it was never measuring.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="p-10 sm:p-14 rounded-3xl bg-brand text-on-accent space-y-6">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] max-w-2xl">
              If that is the kind of answer you want, try it.
            </h2>
            <button
              onClick={openComposer}
              className="px-6 py-3.5 rounded-xl bg-on-accent text-brand hover:bg-on-accent/90 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>Validate your idea</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-sm text-on-accent/70 flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Free to start. No card. Nothing you type is lost at signup.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
