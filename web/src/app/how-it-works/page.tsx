import type { Metadata } from "next";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { IdeaComposer } from "@/components/IdeaComposer";
import { MobileCta } from "@/components/MobileCta";
import { SITE_URL } from "@/lib/urls";

/**
 * How it works, rebuilt on the current system and aligned to the app's real
 * pipeline: entry, research, validate, decide (PIPELINE_STAGES in
 * src/lib/domain/types.ts). The four steps here are the four the product's own
 * top bar shows a signed-in founder, in the same order.
 *
 * The old version rendered one full-bleed alternating band per step, each
 * holding a 720px centred column, which spent four screens saying what fits
 * in one grid.
 */

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The four steps of a validation round: describe the idea, research it against real sources, get answers from people who have the problem, and decide on a scored report.",
  alternates: { canonical: `${SITE_URL}/how-it-works` },
};

const STEPS = [
  {
    n: "01",
    title: "Describe what you're building",
    body: "A paragraph is enough. What the situation is, and what goes wrong today. Not the whole product if only one feature is uncertain: describe just that part.",
    points: [
      "Attach a deck, notes, or a link and we read them for context",
      "Tell us who it is for and where they are, so research looks in the right market",
      "Your idea is saved before any agent runs, so nothing is lost if a step fails",
    ],
  },
  {
    n: "02",
    title: "We research whether the problem is real",
    body: "Real search, not a model guessing from memory. We name the products that already solve this and the gap they leave, and surface the case against the idea as deliberately as the case for it.",
    points: [
      "Every claim links to where we found it",
      "What people do instead today, which is usually the real competition",
      "The strongest counter-evidence, kept where it cannot be buried",
      "A proposed sharpening of the idea, which you accept or reject",
      "When live search turns up nothing, the report says so rather than inventing sources",
    ],
  },
  {
    n: "03",
    title: "You get answers from real people",
    body: "Two routes, one report. Gather answers yourself with questions we write and a link you share, or hand the whole thing over and have the conversations sourced and run for you.",
    points: [
      "Questions built from your research, editable, in your own words if you prefer",
      "The communities where your buyers already gather, named with a real thread",
      "A public link that needs no signup to answer",
      "Every response screened for quality before it counts toward anything",
      "Both routes feed the same pool and the same score",
    ],
  },
  {
    n: "04",
    title: "You get a score, and the reasoning behind it",
    body: "Never a bare number. Half of your respondents confirming the problem is the line: clear it and you get a go-ahead, miss it and you get a diagnosis of which part failed.",
    points: [
      "The confirmation rate, and how we got to the number",
      "Patterns that came up repeatedly, and the push-back you heard",
      "Risk factors named, with the six things that adjust a score",
      "Every raw response, tagged confirmed, unsure or no, with its source",
      "Proceed, rework or stop is always your call",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <MobileCta />

      <section className="pt-16 pb-4 sm:pt-20">
        <Container>
          <div className="max-w-[820px]">
            <p className="type-eyebrow text-brand">How it works</p>
            <h1 className="type-display-2xl mt-6 text-balance text-primary">
              Four steps, and nothing hidden in any of them.
            </h1>
            <p className="type-body-xl mt-7 max-w-[58ch] text-secondary">
              The research, the questions, and every individual response stay
              visible to you the whole way through. These are the same four
              stages the product shows you while a round is running.
            </p>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="The round"
        title="From a paragraph to a decision you can defend"
        lead="Most of it is free, self-paced, and repeatable as many times as you need."
      >
        <div className="mk-grid lg:grid-cols-2">
          {STEPS.map((step) => (
            <div key={step.n} className="p-7 lg:p-8">
              <div className="flex items-baseline gap-4">
                <span className="type-data-s text-brand">{step.n}</span>
                <h2 className="type-display-m text-pretty text-primary">
                  {step.title}
                </h2>
              </div>
              <p className="type-body-m mt-3 text-secondary">{step.body}</p>

              <ul className="mt-6 space-y-3 border-t border-line pt-6">
                {step.points.map((point) => (
                  <li
                    key={point}
                    className="type-body-m flex items-start gap-3 text-primary"
                  >
                    <CheckIcon
                      size={15}
                      weight="bold"
                      className="mt-1.5 shrink-0 text-success"
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

      <Section
        tone="sunken"
        eyebrow="After the score"
        title="A loop, not a verdict"
        lead="A weak result is usually specific rather than fatal, and it points somewhere."
      >
        <div className="max-w-[70ch] space-y-5">
          <p className="type-body-l text-secondary">
            If the signal is weak you get a diagnosis of which part failed: the
            problem statement, the audience, or the problem itself. Sharpen it
            and run the round again. There is no limit on rounds, and every
            version you have been through stays readable, including the ones
            that did not pass.
          </p>
          <p className="type-body-l text-secondary">
            The final call is always yours. You can rework after a go-ahead, or
            build anyway after a rethink. The product records the decision and
            the reasoning behind the number, but it does not make the decision
            for you.
          </p>
        </div>
      </Section>

      <section className="mk-section mk-topline">
        <Container>
          <div className="mk-panel p-8 sm:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-20">
              <h2 className="type-display-hero text-balance text-primary">
                See it run on your own idea.
              </h2>
              <IdeaComposer size="large" starters={[]} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
