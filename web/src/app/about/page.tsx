import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { IdeaComposer } from "@/components/IdeaComposer";
import { MobileCta } from "@/components/MobileCta";
import { SITE_URL } from "@/lib/urls";

/**
 * About, rebuilt on the current system: full-bleed sections with a sticky
 * heading rail, the hairline grid, and the marketing type scale.
 *
 * The old version was a 640px column of centred paragraphs left over from
 * before the redesign, and it read as a different site to the one either side
 * of it.
 *
 * The "what a score cannot tell you" section that used to close this page is
 * gone. Caveats belong in the terms of service, where somebody actually
 * agrees to them, rather than on a page whose job is to explain why the
 * product is worth trusting.
 */

export const metadata: Metadata = {
  title: "About",
  description:
    "Why BRAINS AI exists and the rules it holds even when they make the product look worse in the short term.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const RULES = [
  {
    title: "We never soften a weak signal to be encouraging",
    body: "If the research turns up little evidence anyone has the problem, the report says so plainly. A founder who hears what they wanted to hear from us has learned nothing they could not have gotten from a friend.",
  },
  {
    title: "We show the case against as deliberately as the case for",
    body: "Research that only collects agreement is flattery. Every report keeps the strongest counter-evidence in its own section, so it cannot quietly get folded into a positive summary.",
  },
  {
    title: "We screen responses for quality, not for agreement",
    body: "A generic or clearly automated survey response does not count toward your score, whichever way it answered. Rejecting only the negative ones would bias every score upward, which is the most damaging thing a validation product could do.",
  },
  {
    title: "We never invent a source to fill a gap",
    body: "If live search turns up nothing, the report is flagged as unsourced rather than dressed up with plausible-sounding citations. An invented statistic is a trust problem, not a formatting one.",
  },
  {
    title: "A low score is a reason to sharpen, not a verdict on you",
    body: "Validation is a loop. If the signal is weak, the idea can be reworked and run again with no limit on rounds, and every past version stays readable, including the ones that did not pass.",
  },
  {
    title: "We never post anywhere as you",
    body: "We draft, you publish, in every tier, permanently. Communities can tell when they are being farmed by a bot, and getting your account banned would cost you the exact audience you are trying to reach.",
  },
];

export default function AboutPage() {
  return (
    <>
      <MobileCta />

      <section className="pt-16 pb-4 sm:pt-20">
        <Container>
          <div className="max-w-[820px]">
            <p className="type-eyebrow text-brand">About</p>
            <h1 className="type-display-2xl mt-6 text-balance text-primary">
              Evidence over opinion.
            </h1>
            <p className="type-body-xl mt-7 max-w-[58ch] text-secondary">
              Most people building something new ask friends, post on social,
              or start building and hope. All three feel like validation and
              none of them are. BRAINS AI exists to replace that feeling with
              something you can check.
            </p>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="What we refuse to do"
        title="Rules we hold even when they cost us"
        lead="A validation tool that tells founders what they want to hear is not a validation tool. These are the positions that make the product genuinely useful, and each one makes it look worse in the short term."
      >
        <div className="mk-grid sm:grid-cols-2">
          {RULES.map((rule) => (
            <div key={rule.title} className="p-6 lg:p-7">
              <h3 className="type-body-l font-medium text-pretty text-primary">
                {rule.title}
              </h3>
              <p className="type-body-m mt-3 text-secondary">{rule.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        tone="sunken"
        eyebrow="What we are narrow about"
        title="One risk, reduced well"
        lead="Rather than claiming to reduce every risk a little."
      >
        <div className="max-w-[70ch] space-y-5">
          <p className="type-body-l text-secondary">
            A validation round measures one thing: whether the problem is real
            to the people who have it. Whether they describe it unprompted,
            whether they already spend money or hours on it, and whether you
            can find enough of them in a place you can name.
          </p>
          <p className="type-body-l text-secondary">
            Pricing, distribution, timing and execution all sit outside that.
            We would rather do the one thing properly and say where it stops
            than stretch a score across questions it was never measuring.
          </p>
        </div>
      </Section>

      <section className="mk-section mk-topline">
        <Container>
          <div className="mk-panel p-8 sm:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-20">
              <h2 className="type-display-hero text-balance text-primary">
                If that is the kind of answer you want, try it.
              </h2>
              <IdeaComposer size="large" starters={[]} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
