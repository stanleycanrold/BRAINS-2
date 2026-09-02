'use client';

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useStudioEntry } from '@/components/landing/MarketingShell';

/**
 * How it works, restyled in the empirical design language. The four steps
 * are the same four the product's own top bar shows a signed-in founder,
 * and the copy is carried verbatim from the previous design.
 */

const STEPS = [
  {
    n: '01',
    title: "Describe what you're building",
    body: 'A paragraph is enough. What the situation is, and what goes wrong today. Not the whole product if only one feature is uncertain: describe just that part.',
    points: [
      'Attach a deck, notes, or a link and we read them for context',
      'Tell us who it is for and where they are, so research looks in the right market',
      'Your idea is saved before any agent runs, so nothing is lost if a step fails',
    ],
  },
  {
    n: '02',
    title: 'We research whether the problem is real',
    body: 'Real search, not a model guessing from memory. We name the products that already solve this and the gap they leave, and surface the case against the idea as deliberately as the case for it.',
    points: [
      'Every claim links to where we found it',
      'What people do instead today, which is usually the real competition',
      'The strongest counter-evidence, kept where it cannot be buried',
      'A proposed sharpening of the idea, which you accept or reject',
      'When live search turns up nothing, the report says so rather than inventing sources',
    ],
  },
  {
    n: '03',
    title: 'You get answers from real people',
    body: 'Two routes, one report. Gather answers yourself with questions we write and a link you share, or hand the whole thing over and have the conversations sourced and run for you.',
    points: [
      'Questions built from your research, editable, in your own words if you prefer',
      'The communities where your buyers already gather, named with a real thread',
      'A public link that needs no signup to answer',
      'Every response screened for quality before it counts toward anything',
      'Both routes feed the same pool and the same score',
    ],
  },
  {
    n: '04',
    title: 'You get a score, and the reasoning behind it',
    body: 'Never a bare number. Half of your respondents confirming the problem is the line: clear it and you get a go-ahead, miss it and you get a diagnosis of which part failed.',
    points: [
      'The confirmation rate, and how we got to the number',
      'Patterns that came up repeatedly, and the push-back you heard',
      'Risk factors named, with the six things that adjust a score',
      'Every raw response, tagged confirmed, unsure or no, with its source',
      'Proceed, rework or stop is always your call',
    ],
  },
];

export function HowItWorksBody() {
  const { openContact } = useStudioEntry();

  return (
    <div className="bg-page text-primary">
      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-6">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
            How it works
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Four steps, and nothing hidden in any of them.
          </h1>
          <p className="text-lg text-secondary leading-relaxed max-w-2xl">
            The research, the questions, and every individual response stay
            visible to you the whole way through. These are the same four
            stages the product shows you while a round is running.
          </p>
        </div>
      </section>

      {/* The round */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
              The round
            </span>
            <span className="text-xs font-mono text-secondary">
              From a paragraph to a decision you can defend
            </span>
          </div>

          <p className="text-lg text-secondary leading-relaxed max-w-3xl">
            Most of it is free, self-paced, and repeatable as many times as you
            need.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="p-8 rounded-3xl bg-raised border border-line space-y-5"
              >
                <div className="flex items-baseline gap-4">
                  <span className="text-sm font-mono font-bold text-mark">
                    {step.n}
                  </span>
                  <h2 className="text-xl font-bold text-primary">
                    {step.title}
                  </h2>
                </div>
                <p className="text-sm text-secondary leading-relaxed">
                  {step.body}
                </p>
                <ul className="space-y-2.5 border-t border-line pt-5">
                  {step.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 text-sm text-primary"
                    >
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-success" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* After the score */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
              After the score
            </span>
            <span className="text-xs font-mono text-secondary">
              A loop, not a verdict
            </span>
          </div>

          <div className="max-w-3xl space-y-5">
            <p className="text-lg text-secondary leading-relaxed">
              If the signal is weak you get a diagnosis of which part failed:
              the problem statement, the audience, or the problem itself.
              Sharpen it and run the round again. There is no limit on rounds,
              and every version you have been through stays readable, including
              the ones that did not pass.
            </p>
            <p className="text-lg text-secondary leading-relaxed">
              The final call is always yours. You can rework after a go-ahead,
              or build anyway after a rethink. The product records the decision
              and the reasoning behind the number, but it does not make the
              decision for you.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="p-10 sm:p-14 rounded-3xl bg-brand text-on-accent space-y-6">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] max-w-2xl">
              See it run on your own idea.
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openContact}
                className="px-6 py-3.5 rounded-xl bg-on-accent text-brand hover:bg-on-accent/90 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Contact us</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://calendar.app.google/PmNmyQbGWNgM5cfz7"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl border border-on-accent/40 text-on-accent text-sm font-bold hover:bg-on-accent/10 transition-all inline-flex items-center gap-2"
              >
                Book a meeting
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
