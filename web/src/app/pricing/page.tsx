import type { Metadata } from "next";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section, SectionHeading } from "@/components/Section";
import { Button } from "@/components/Button";
import { Faq, FaqJsonLd, type FaqItem } from "@/components/Faq";
import { MobileCta } from "@/components/MobileCta";
import { signUpUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Research and self-serve validation are free. Pay only if you want interviews sourced, run, and analysed for you, from $40 an interview.",
};

const FREE_FEATURES = [
  "Full research report, every claim sourced",
  "Interview questions written from your research",
  "A share link anyone can answer without signing up",
  "Full scored report: reasoning, risk factors, every response",
  "Unlimited rework rounds",
];

const FAST_TRACK_FEATURES = [
  "Everything in the free tier",
  "Interviews sourced and conducted for you",
  "You choose how many, and where they should be",
  "Every response screened for quality before it counts",
  "Report back on your dashboard in 1 to 2 weeks",
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is the free tier actually free, or a trial?",
    answer:
      "Actually free. Research, question generation, the share link, and the full scored report cost nothing, with no time limit and no card required. Paying only changes who does the legwork of getting interviews, not what the report contains.",
  },
  {
    question: "Why does the per-interview price vary?",
    answer:
      "It depends on how hard your audience is to reach. Interviews with general consumers start at $40. A narrow, highly technical or professional audience costs more to source, up to $180. You always see the exact rate and the itemised total before paying anything.",
  },
  {
    question: "How long does a Fast Track round take?",
    answer:
      "One to two weeks from payment, depending on how many interviews you ordered and how specialised the audience is. Progress is visible on your dashboard the whole time rather than going quiet until the report lands.",
  },
  {
    question: "What if the result says my idea is weak?",
    answer:
      "That is a working outcome, not a failure of the product. Validation is a loop: sharpen the idea and run another round, as many times as you need. Every past version stays readable, including the rounds that did not pass.",
  },
  {
    question: "Do the interviews you run count differently from mine?",
    answer:
      "They are tracked separately so you can always tell which answers you gathered and which you paid for, but both feed the same pool and the same score. Every response, from either route, is screened for quality before it counts.",
  },
  {
    question: "Can I pay for one idea without a subscription?",
    answer:
      "Yes. Fast Track is paid per round, per idea, not a recurring plan. Nothing starts until the payment clears, and the order is tied to the specific set of questions it was bought for.",
  },
];

export default function PricingPage() {
  return (
    <>
      <MobileCta />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="pt-16 pb-4 sm:pt-24">
        <Container>
          <div className="mx-auto max-w-[620px] text-center">
            <h1 className="type-display-xl text-primary">
              Start free. Pay only for the legwork.
            </h1>
            <p className="type-body-l mt-5 text-secondary">
              Doing it yourself costs nothing and produces the same scored
              report. Paying buys back your time, not a better answer.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-[900px] gap-6 sm:grid-cols-2">
            <PriceCard
              title="Do it yourself"
              price="Free"
              tagline="Self-paced, at your own speed"
              features={FREE_FEATURES}
              cta={{ label: "Start free", href: signUpUrl }}
            />
            <PriceCard
              id="fast-track"
              title="We do it for you"
              price="From $40"
              priceSuffix="/ interview"
              tagline="Report back in 1 to 2 weeks"
              features={FAST_TRACK_FEATURES}
              cta={{ label: "See how it works", href: "/how-it-works" }}
              highlighted
            />
          </div>

          <p className="type-body-m mx-auto mt-8 max-w-[620px] text-center text-tertiary">
            The exact rate depends on how specialised your audience is. You see
            the itemised total before you pay, and nothing starts until the
            payment clears.
          </p>
        </Container>
      </section>

      <Section tone="sunken" bordered>
        <SectionHeading title="Questions people actually ask" />
        <div className="mx-auto mt-10 max-w-[720px]">
          <Faq items={FAQ_ITEMS} />
        </div>
      </Section>

      <Section bordered className="pb-28 sm:pb-32">
        <div className="mx-auto max-w-[620px] text-center">
          <h2 className="type-display-m text-primary">
            A signal, not a guarantee
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            Paying for interviews buys better evidence, not certainty. A strong
            score means the problem looks real and worth solving on what we
            found. It cannot promise the business will work, and we would
            rather say that here, on the page where you are deciding whether to
            spend, than bury it somewhere quieter.
          </p>
          <div className="mt-8">
            <Button href={signUpUrl} variant="primary">
              Start free
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}

function PriceCard({
  id,
  title,
  price,
  priceSuffix,
  tagline,
  features,
  cta,
  highlighted,
}: {
  id?: string;
  title: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
}) {
  return (
    <div
      id={id}
      className={
        highlighted
          ? "flex scroll-mt-24 flex-col rounded-[16px] border border-brand/35 bg-raised p-7 shadow-[var(--shadow-raised)] sm:p-8"
          : "flex scroll-mt-24 flex-col rounded-[16px] border border-line bg-raised p-7 sm:p-8"
      }
    >
      <h2 className="type-display-m text-primary">{title}</h2>
      <p className="type-body-m mt-1 text-secondary">{tagline}</p>

      <p className="type-display-xl mt-7 text-primary">
        {price}
        {priceSuffix ? (
          <span className="type-body-l text-secondary">{priceSuffix}</span>
        ) : null}
      </p>

      <ul className="mt-7 flex-1 space-y-3">
        {features.map((feature) => (
          <li
            key={feature}
            className="type-body-m flex items-start gap-2.5 text-primary"
          >
            <CheckIcon
              size={15}
              weight="bold"
              className="mt-1 shrink-0 text-success"
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          href={cta.href}
          variant={highlighted ? "primary" : "secondary"}
          className="w-full"
        >
          {cta.label}
        </Button>
      </div>
    </div>
  );
}
