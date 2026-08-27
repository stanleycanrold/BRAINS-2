'use client';

import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { useStudioEntry } from './MarketingShell';
import { signUpUrl } from '@/lib/urls';

/**
 * The published pricing facts from the site's original pricing page, folded
 * under the empirical pricing billboards above. Same design language: mono
 * eyebrow label rows, white billboards on #f7f8fa, #14267a accents.
 *
 * These figures are the published starting rates, maintained by hand - web
 * has no database access, so if Ops retunes a rate, this file is edited too.
 */

const INCLUDED = [
  'A research brief with every claim linked to its source',
  'The communities where your problem is already discussed, named',
  'The case against the idea, in its own section',
  'Non-leading questions written from the findings, editable',
  'A share link anyone can answer without signing up',
  'Every response screened for quality before it counts',
  'A score with its reasoning, the themes, and the risk factors',
  'Every raw answer, tagged and readable, with its source',
  'Unlimited rework rounds, with every past version kept',
];

const TRACKS = [
  {
    id: 'self-serve',
    name: 'Self-serve',
    price: 'Free',
    priceNote: 'No card, no time limit',
    tagline: 'You find the people.',
    body: 'Everything above, and you gather the responses yourself using the questions and the share link. The report is the same one a paid round produces.',
    cta: { label: 'Start free', href: signUpUrl },
  },
  {
    id: 'fast-track',
    name: 'Fast Track',
    price: 'Priced per round',
    priceNote: 'Itemised before you pay',
    tagline: 'We find the people.',
    body: 'Respondents sourced to match your market, conversations run and screened, and the validation round back on your dashboard in one to two weeks.',
    cta: null,
  },
  {
    id: 'social-scan',
    name: 'Continued Social Scan',
    price: 'Monthly',
    priceNote: 'Cancel whenever',
    tagline: 'The research keeps running.',
    body: 'The scan does not stop when the score lands. The communities the research named stay watched, and you get told when the problem shows up again.',
    cta: null,
  },
];

const AUDIENCE_TIERS = [
  {
    tier: 'General consumer',
    rate: '$40',
    example: 'Pet owners, commuters, home cooks, parents of school-age children',
    why: 'Large, easy to reach, and willing to talk without a professional incentive.',
  },
  {
    tier: 'Vertical B2B',
    rate: '$90',
    example: 'Independent dental practices, regional logistics firms, small law offices',
    why: 'A working professional giving up billable time, found through narrower channels.',
  },
  {
    tier: 'Highly specialised',
    rate: '$180',
    example: 'Hospital procurement leads, semiconductor process engineers, actuaries',
    why: 'Few of them exist, they are hard to reach, and their time is expensive.',
  },
];

const SCAN_VALUE = [
  {
    title: 'The rooms, already found',
    body: 'You stop opening twenty tabs looking for where your customers gather. The scan carries the communities the research named and keeps adding the ones that turn up later.',
  },
  {
    title: 'The moment, not just the place',
    body: 'A thread where somebody has just described your problem is worth more than the same thread next month. You get told while the question is still open.',
  },
  {
    title: 'Drafts that teach, never pitch',
    body: 'Each draft answers the question that was actually asked, using what you know about the problem. No product mention unless somebody asks. That is what gets upvoted rather than removed.',
  },
  {
    title: 'Credibility that compounds into leads',
    body: 'Being the person who gave a genuinely useful answer in a room full of your buyers is how founders get their first customers. The scan puts you in those rooms every week instead of once.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is the free tier actually free, or a trial?',
    answer:
      'Actually free. The research, the questions, the share link and the full scored report cost nothing, with no time limit and no card. Paying changes who does the legwork of reaching people. It does not change what the report contains or how the score is calculated.',
  },
  {
    question: 'Why is it priced per validation round?',
    answer:
      'Because you are buying a decision-ready answer, not a pile of conversations. Sourcing and running conversations is one cost, and turning them into a defensible answer is another that barely changes with volume. A round of six and a round of thirty need almost the same analysis. Pricing only per response would either overcharge small rounds or make large ones look artificially cheap.',
  },
  {
    question: 'What makes one round cost more than another?',
    answer:
      'How hard your audience is to reach, and how much evidence you want. A general-consumer round starts at $40 a response. A highly specialised professional audience runs to $180 because there are fewer of them and their time costs more. You choose the number of responses, and see the itemised total before anything is charged.',
  },
  {
    question: 'How many responses do I actually need?',
    answer:
      'Ten to fifteen for most products, and the report flags anything under ten as a thin sample rather than quietly rounding the score up. Three is the floor we will run. More responses buy confidence, not a different verdict, so there is a real point past which extra spend stops changing the decision.',
  },
  {
    question: 'Is Fast Track a subscription?',
    answer:
      'No. It is paid per round, per idea. Nothing starts until the payment clears, and the order is tied to the specific set of questions it was bought for. Continued Social Scan is the only recurring thing we sell, and it is cancellable at any time.',
  },
  {
    question: 'Will you post in those communities for me?',
    answer:
      'Never, in any tier, and that is permanent rather than a limit we intend to relax. We draft, you publish. Communities can tell when they are being farmed by a bot, and getting your account banned would cost you the exact audience you are trying to reach.',
  },
];

function LabelRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-4">
      <span className="text-xs font-mono font-bold tracking-widest uppercase text-brand">
        {left}
      </span>
      <span className="text-xs font-mono text-secondary">{right}</span>
    </div>
  );
}

export function PricingDetails() {
  const { openComposer } = useStudioEntry();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-page text-primary">
      {/* What you get */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <LabelRow
            left="What you get"
            right="Every round produces the same thing"
          />
          <p className="text-lg text-secondary leading-relaxed max-w-3xl">
            This list does not change between tiers. Nothing is held back on
            the free one, and nothing extra is unlocked by paying. The only
            variable is who does the legwork of reaching people.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INCLUDED.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 p-5 rounded-2xl bg-raised border border-line"
              >
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-success" />
                <span className="text-sm text-primary">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three tracks */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <LabelRow left="How it runs" right="Three ways to get there" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {TRACKS.map((track) => (
              <div
                key={track.id}
                id={track.id}
                className="p-8 rounded-3xl bg-raised border border-line flex flex-col space-y-4 scroll-mt-24"
              >
                <h3 className="text-xl font-bold text-primary">
                  {track.name}
                </h3>
                <p className="text-sm font-medium text-secondary">
                  {track.tagline}
                </p>
                <div>
                  <div className="text-3xl font-extrabold font-mono text-brand">
                    {track.price}
                  </div>
                  <p className="text-xs text-tertiary mt-1">
                    {track.priceNote}
                  </p>
                </div>
                <p className="text-sm text-secondary leading-relaxed flex-1 border-t border-line pt-4">
                  {track.body}
                </p>
                {track.cta ? (
                  <a
                    href={track.cta.href}
                    className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-accent text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <span>{track.cta.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <a
                    href="#how-price-works"
                    className="w-full py-3 rounded-xl bg-page hover:bg-sunken border border-line text-xs font-bold text-primary text-center transition-all"
                  >
                    How the price works
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How the price works */}
      <section id="how-price-works" className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <LabelRow
            left="How the price works"
            right="Two components, and one of them barely moves"
          />
          <p className="text-lg text-secondary leading-relaxed max-w-3xl">
            Fast Track is priced from the two things it actually costs us.
            Both appear itemised at checkout before anything is charged.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-raised border border-line space-y-3">
              <span className="text-xs font-mono font-bold text-secondary uppercase">
                Component one
              </span>
              <h3 className="text-xl font-bold text-primary">
                Reaching the people
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                Charged per response, and it scales directly with how many you
                order. This is the part that varies by audience, because a
                hospital procurement lead is far harder to reach than a dog
                owner.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-raised border border-line space-y-3">
              <span className="text-xs font-mono font-bold text-secondary uppercase">
                Component two
              </span>
              <h3 className="text-xl font-bold text-primary">
                Turning it into an answer
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                Screening every response, finding the themes, weighing the
                contradictions and producing the scored report. Largely fixed:
                a round of six needs almost the same work as a round of
                thirty, which is why it is not billed per head.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-base font-bold text-primary">
              What your audience costs to reach
            </h3>
            <div className="rounded-2xl bg-raised border border-line overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line">
                      {['Audience', 'Per response', 'Looks like', 'Why'].map(
                        (head) => (
                          <th
                            key={head}
                            className="text-xs font-mono font-bold uppercase tracking-wider text-tertiary px-6 py-4"
                          >
                            {head}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {AUDIENCE_TIERS.map((row) => (
                      <tr
                        key={row.tier}
                        className="border-b border-line last:border-0"
                      >
                        <td className="text-sm px-6 py-5 align-top font-bold text-primary">
                          {row.tier}
                        </td>
                        <td className="text-sm font-mono font-bold px-6 py-5 align-top whitespace-nowrap text-brand">
                          from {row.rate}
                        </td>
                        <td className="text-sm px-6 py-5 align-top text-secondary">
                          {row.example}
                        </td>
                        <td className="text-sm px-6 py-5 align-top text-secondary">
                          {row.why}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-sm text-secondary leading-relaxed max-w-3xl">
              Which tier your idea falls into is decided during research, from
              who you said it is for, not chosen by you at checkout. You set
              the number of responses, the total updates as you change it, and
              you see the itemised figure before paying. Three responses is the
              floor we will run.
            </p>
          </div>
        </div>
      </section>

      {/* Continued Social Scan */}
      <section id="social-scan" className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <LabelRow
            left="Continued Social Scan"
            right="Stop spending your week looking for where your customers are"
          />
          <p className="text-lg text-secondary leading-relaxed max-w-3xl">
            The research already names the communities where your problem gets
            discussed. This keeps that scan running, tells you when the
            conversation worth joining appears, and hands you something worth
            saying in it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SCAN_VALUE.map((item) => (
              <div
                key={item.title}
                className="p-7 rounded-3xl bg-raised border border-line space-y-3"
              >
                <h3 className="text-base font-bold text-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-secondary leading-relaxed max-w-3xl">
            Every draft is yours to edit and post in your own words, so what
            goes out sounds like you and lands in your account&rsquo;s own
            history.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-10">
          <LabelRow left="Questions" right="What people actually ask" />
          <div className="rounded-3xl bg-raised border border-line divide-y divide-line overflow-hidden">
            {FAQ_ITEMS.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <div key={item.question}>
                  <button
                    onClick={() => setOpenFaq(open ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer hover:bg-page transition-colors"
                  >
                    <span className="text-sm font-bold text-primary">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-secondary transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <p className="px-6 pb-6 text-sm text-secondary leading-relaxed">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="p-10 sm:p-14 rounded-3xl bg-brand text-on-accent space-y-6">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] max-w-2xl">
              Find out this week, not next quarter.
            </h2>
            <p className="text-base text-on-accent/70 leading-relaxed max-w-xl">
              The research costs nothing and comes back in under 60 seconds.
              Start with the idea you are least sure about, and decide on
              evidence instead of a hunch.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={openComposer}
                className="px-6 py-3.5 rounded-xl bg-on-accent text-brand hover:bg-on-accent/90 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Validate your idea</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={signUpUrl}
                className="px-6 py-3.5 rounded-xl border border-on-accent/25 text-on-accent text-sm font-bold hover:bg-on-accent/10 transition-all"
              >
                Start free
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
