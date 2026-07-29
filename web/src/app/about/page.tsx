import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { MobileCta } from "@/components/MobileCta";
import { signUpUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why BRAINS AI exists, what it deliberately refuses to do, and an honest account of what a validation score can and cannot tell you.",
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
    body: "A generic or clearly AI-written survey response does not count toward your score, whichever way it answered. Rejecting only the negative ones would bias every score upward, which is the most damaging thing a validation product could do.",
  },
  {
    title: "We never invent a source to fill a gap",
    body: "If live search turns up nothing, the report is flagged as unsourced rather than dressed up with plausible-sounding citations. An invented statistic is a trust problem, not a formatting one.",
  },
  {
    title: "A low score is a reason to sharpen, not a verdict on you",
    body: "Validation is a loop. If the signal is weak, the idea can be reworked and run again with no limit on rounds, and every past version stays readable, including the ones that did not pass.",
  },
];

export default function AboutPage() {
  return (
    <>
      <MobileCta />

      <section className="pt-16 pb-4 sm:pt-24">
        <Container>
          <div className="mx-auto max-w-[640px] text-center">
            <h1 className="type-display-xl text-primary">
              Evidence over opinion
            </h1>
            <p className="type-body-l mt-5 text-secondary">
              Most people building something new ask friends, post on social,
              or start building and hope. All three feel like validation and
              none of them are. BRAINS AI exists to replace that feeling with
              something you can check.
            </p>
          </div>
        </Container>
      </section>

      <Section tone="sunken" bordered>
        <div className="mx-auto max-w-[720px]">
          <h2 className="type-display-l text-primary">
            What we refuse to do
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            Rules we hold even when they make the product look worse in the
            short term, because a validation tool that tells founders what they
            want to hear is not validation.
          </p>

          <dl className="mt-10 space-y-8">
            {RULES.map((rule) => (
              <div key={rule.title} className="border-l-2 border-brand/40 pl-5">
                <dt className="type-body-l font-medium text-primary">
                  {rule.title}
                </dt>
                <dd className="type-body-l mt-2 text-secondary">{rule.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section bordered>
        <div className="mx-auto max-w-[720px]">
          <h2 className="type-display-l text-primary">
            What a score can and cannot tell you
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            A validation score is a measure of the evidence gathered so far. A
            high one means the problem looks real to the people who have it,
            that they describe it unprompted, and that some already pay to
            solve it. That reduces the risk of building something nobody wanted.
          </p>
          <p className="type-body-l mt-4 text-secondary">
            It cannot tell you whether the business will work. Pricing,
            distribution, timing, and execution all sit outside what any
            validation round can measure, and a strong signal on the problem
            says nothing about whether you will reach the people who have it.
          </p>
          <p className="type-body-l mt-4 text-secondary">
            The honest framing is narrow on purpose: this reduces one specific
            risk well, rather than claiming to reduce all of them a little.
          </p>
        </div>
      </Section>

      <Section tone="sunken" bordered className="pb-28 sm:pb-32">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="type-body-l text-secondary">
            If that sounds like the kind of answer you want,{" "}
            <Link href={signUpUrl} className="text-brand hover:underline">
              try it with your idea
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
