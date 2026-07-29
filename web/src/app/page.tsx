import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ScalesIcon,
  PencilSimpleLineIcon,
  UsersThreeIcon,
  ChatCircleTextIcon,
  ShieldCheckIcon,
  GaugeIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section, SectionHeading } from "@/components/Section";
import { IdeaComposer } from "@/components/IdeaComposer";
import { ProductShowcase } from "@/components/ProductShowcase";
import { MobileCta } from "@/components/MobileCta";
import { signUpUrl } from "@/lib/urls";

/**
 * Section order follows the visitor's real question sequence (UX guide 3):
 * what is this → let me see it → why is this better than asking around myself
 * → what do I actually get → is it for someone like me → can I trust it →
 * fine, I'll try.
 *
 * No pricing anywhere on this page, by decision. The free product is complete
 * on its own (research, sharpening, questions, share link, full scored
 * report), so the page sells that. Anyone weighing the paid option is looking
 * for it, and the Pricing page is one nav click away.
 *
 * The composer appears twice on purpose. Someone who has read the whole page
 * has far more context than on arrival, so the final CTA repeats the exact
 * interactive element rather than degrading to a generic button.
 */

const SHOWCASE_POINTS = [
  {
    title: "Sourced research",
    body: "Every claim links to where we found it, and the case against your idea gets its own section instead of being folded into a summary.",
  },
  {
    title: "Real conversations",
    body: "Answers from people who live the problem, in the communities where they already talk about it unprompted.",
  },
  {
    title: "A score, argued",
    body: "The confirmation rate, the risk factors, and every raw response stay visible. Never a bare number.",
  },
];

const SIGNAL_CARDS = [
  {
    icon: <UsersThreeIcon size={20} aria-hidden="true" />,
    title: "Niche expertise",
    body: "We find where your people already gather, down to the specific communities and threads where they describe this problem without being asked. Your own network will be kind to you. Strangers who have the problem will not.",
  },
  {
    icon: <ChatCircleTextIcon size={20} aria-hidden="true" />,
    title: "Questions that do not lead",
    body: "Questions are written from your research and worded so they cannot fish for the answer you are hoping for. A founder writing their own questions almost always writes them to win.",
  },
  {
    icon: <ShieldCheckIcon size={20} aria-hidden="true" />,
    title: "Every answer screened",
    body: "Generic, AI-written, and low-effort responses are rejected before they reach your score, whichever way they answered. Rejecting only the negative ones would flatter every number on the page.",
  },
];

const FEATURES = [
  {
    icon: <MagnifyingGlassIcon size={18} aria-hidden="true" />,
    title: "Research that names names",
    body: "The products already solving this and the gap they leave, what people do instead today, and the questions search could not settle.",
  },
  {
    icon: <ScalesIcon size={18} aria-hidden="true" />,
    title: "The case against, kept separate",
    body: "The strongest evidence that your idea is wrong sits in its own section, where it cannot be quietly absorbed into a positive summary.",
  },
  {
    icon: <PencilSimpleLineIcon size={18} aria-hidden="true" />,
    title: "Your idea, sharpened",
    body: "Concrete rewrites of your problem statement, your audience, and your value proposition. Accept one and it rewrites the idea. Edit or reject the rest.",
  },
  {
    icon: <UsersThreeIcon size={18} aria-hidden="true" />,
    title: "Where your people are",
    body: "Named communities with real threads to start from, plus drafted posts and replies that contribute to the conversation rather than pitching in it.",
  },
  {
    icon: <GaugeIcon size={18} aria-hidden="true" />,
    title: "A verdict you can check",
    body: "A score, the reasoning behind it, the risk factors that qualify it, and every raw response that fed it. The threshold is enforced in code, so nobody can talk it upward.",
  },
  {
    icon: <ArrowsClockwiseIcon size={18} aria-hidden="true" />,
    title: "Run it again, and again",
    body: "Sharpen the idea and start another round as many times as you need. Every past version stays readable, including the rounds that did not pass.",
  },
];

const AUDIENCES = [
  {
    label: "You have an idea",
    title: "Nothing built yet",
    body: "The cheapest moment to find out a problem is not real is before you have written a line of code for it.",
    points: [
      "Find out whether anyone has this problem",
      "See who already solves it, and the gap they leave",
      "Get the questions written, and a link to send",
    ],
  },
  {
    label: "You have already built",
    title: "An MVP, or users",
    body: "Test the one part you are unsure about rather than the whole product, and get a sharper answer for it.",
    points: [
      "Validate a single feature, not the entire roadmap",
      "We read your existing product page for context",
      "Rework and run it again as many rounds as you need",
    ],
  },
];

export default function HomePage() {
  return (
    <>
      <MobileCta />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-14 pb-12 sm:pt-20 sm:pb-14">
        <Container>
          <div className="mx-auto max-w-[720px]">
            <h1 className="text-[clamp(42px,6vw,72px)] font-semibold leading-[1.05] tracking-[-0.03em] text-center">
              <span className="block text-white">Test fast.</span>
              <span className="block text-brand">Build what sells.</span>
            </h1>
            <p className="type-body-l mx-auto mt-4 max-w-[560px] text-center text-secondary">
              Validate with real people before you spend months building
              something nobody asked for.
            </p>

            <IdeaComposer className="mt-8" />

            {/* Says what happens next rather than repeating the reassurance
                that used to sit inside the box too. Naming the signup here
                costs nothing and stops it arriving as a surprise. */}
            <p className="type-caption mt-4 text-center tracking-[0.08em] text-tertiary uppercase">
              Free to use. Create an account to see your report.
            </p>
          </div>
        </Container>
      </section>

      {/* ── The product itself, immediately ──────────────────────────── */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <ProductShowcase />

          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {SHOWCASE_POINTS.map((point) => (
              <div key={point.title}>
                <p className="type-caption tracking-[0.08em] text-brand uppercase">
                  {point.title}
                </p>
                <p className="type-body-m mt-2.5 text-secondary">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Why this beats asking around yourself ────────────────────── */}
      <Section tone="sunken" bordered>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[560px]">
            <h2 className="type-display-l text-primary">
              Conversations that matter
            </h2>
            <p className="type-body-l mt-4 text-secondary">
              Anyone can go and ask twenty people whether they like an idea.
              The answers come back warm, agreeable, and worth nothing. What
              separates a signal you can build on from one that flatters you is
              who you asked, how you asked, and which answers you let count.
            </p>
          </div>
          <Link
            href="/how-it-works"
            className="type-body-m inline-flex shrink-0 items-center gap-1.5 text-brand hover:underline"
          >
            See the methodology
            <ArrowRightIcon size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {SIGNAL_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-[12px] border border-line bg-raised p-7"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-brand">
                {card.icon}
              </span>
              <h3 className="type-display-m mt-5 text-primary">{card.title}</h3>
              <p className="type-body-m mt-3 text-secondary">{card.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── What you actually get ────────────────────────────────────── */}
      <Section bordered>
        <SectionHeading
          eyebrow="What you get"
          title="More than a verdict"
          lead="A validation round produces a decision, and everything you need to argue with it. All of this comes with the free account."
        />

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <span className="flex size-9 items-center justify-center rounded-[8px] bg-brand-subtle text-brand">
                {feature.icon}
              </span>
              <h3 className="type-body-l mt-4 font-medium text-primary">
                {feature.title}
              </h3>
              <p className="type-body-m mt-2 text-secondary">{feature.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Who this is for ──────────────────────────────────────────── */}
      <Section tone="sunken" bordered>
        <SectionHeading
          eyebrow="Who it is for"
          title="Whether you have built anything yet or not"
        />

        <div className="mx-auto mt-14 grid max-w-[880px] gap-6 sm:grid-cols-2">
          {AUDIENCES.map((aud) => (
            <div
              key={aud.title}
              className="rounded-[12px] border border-line bg-raised p-7"
            >
              <p className="type-caption text-brand uppercase">{aud.label}</p>
              <h3 className="type-display-m mt-3 text-primary">{aud.title}</h3>
              <p className="type-body-m mt-2 text-secondary">{aud.body}</p>
              <ul className="mt-5 space-y-2.5">
                {aud.points.map((point) => (
                  <li
                    key={point}
                    className="type-body-m flex items-start gap-2.5 text-primary"
                  >
                    <CheckIcon
                      size={15}
                      weight="bold"
                      className="mt-1 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Trust note, right before the close ───────────────────────── */}
      <Section bordered>
        <div className="mx-auto max-w-[620px] text-center">
          <h2 className="type-display-m text-primary">
            A signal, not a guarantee
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            A strong score means the evidence so far points to a real problem
            that people will talk about and pay to solve. It cannot promise the
            business will work, and a weak one is not a verdict on you. It is a
            reason to sharpen the idea before you spend months on it.
          </p>
          <Link
            href="/about"
            className="type-body-m mt-6 inline-flex items-center gap-1.5 text-brand hover:underline"
          >
            What we refuse to do
            <ArrowRightIcon size={15} aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* ── Final CTA: the same composer, not a lesser button ────────── */}
      <Section tone="sunken" bordered className="pb-28 sm:pb-32">
        <div className="mx-auto max-w-[720px]">
          <h2 className="type-display-l text-center text-primary">
            Start with the idea you already have
          </h2>
          <p className="type-body-l mx-auto mt-4 max-w-[520px] text-center text-secondary">
            Type it here and we will take it from there. Nothing is lost if you
            stop partway.
          </p>

          <IdeaComposer className="mt-8" />

          <p className="type-caption mt-5 text-center text-tertiary">
            Or{" "}
            <a href={signUpUrl} className="text-brand hover:underline">
              create an account
            </a>{" "}
            first.
          </p>
        </div>
      </Section>
    </>
  );
}
