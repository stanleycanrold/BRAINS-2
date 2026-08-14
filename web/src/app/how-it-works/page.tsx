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
    "Validate your startup idea with real market signal: research the problem, ask the right people, and get a clear score before you build.",
  alternates: { canonical: `${SITE_URL}/how-it-works` },
};

const STEPS = [
  {
    n: "01",
    title: "Describe the idea you are trying to test",
    body: "Start with the problem, not the pitch. One paragraph is enough. Tell us what is broken today, who it affects, and why the current workaround is not good enough.",
    points: [
      "Drop in notes, a deck, a link, or a rough concept",
      "We use the right context to focus the research on the actual market",
      "Your draft is saved before any agent starts, so nothing is lost if the round changes direction",
    ],
  },
  {
    n: "02",
    title: "We check whether the problem is real",
    body: "This is where the guesswork gets tested. We look for real public evidence, current workarounds, and the people already paying a real cost to solve the problem.",
    points: [
      "Every claim points back to the source it came from",
      "We surface the strongest counter-arguments, not just the flattering ones",
      "We call out when the evidence is thin instead of pretending it is strong",
      "You can sharpen or reject the direction before any conversations happen",
    ],
  },
  {
    n: "03",
    title: "You get feedback from the right people",
    body: "The method is simple: ask the people living the problem, not your friends and not a generic chatbot. We write the questions, and you can either run the round yourself or let us source and run it for you.",
    points: [
      "Questions are built from the research, not from a generic template",
      "We name the communities and threads where the buyers already gather",
      "A public link lets people answer without signing up first",
      "Every answer is screened before it affects the final score",
    ],
  },
  {
    n: "04",
    title: "You get a clear score and the reasoning behind it",
    body: "This is the decision you can actually act on. The report shows the signal, where it came from, and what the weak spots are so you know whether to build, rework, or stop.",
    points: [
      "The confirmation rate and how we reached it",
      "Patterns that kept showing up, and the push-back you heard",
      "The six risk factors that adjust a score",
      "Every raw response, tagged confirmed, unsure or no, with its source",
      "The final call is always yours, but the evidence is no longer vague",
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
              Validate the idea before it becomes a roadmap.
            </h1>
            <p className="type-body-xl mt-7 max-w-[58ch] text-secondary">
              The process is simple: research the problem, talk to the right people,
              and get a clear score before you spend months building the wrong thing.
            </p>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="The round"
        title="A faster way to know whether the problem is real"
        lead="Most product ideas fail not because they are impossible, but because they were never tested against the market before the build started."
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
        title="A stronger decision, not a dead end"
        lead="A weak result is not a failure of the idea. It is usually a sign that the audience, the message, or the wedge needs to be sharpened."
      >
        <div className="max-w-[70ch] space-y-5">
          <p className="type-body-l text-secondary">
            If the signal is weak you get a diagnosis of what failed: the problem,
            the audience, or the way it was framed. Then you tighten the idea and run
            the round again. There is no penalty for testing a second time, and every
            version remains visible so you can compare the signal instead of guessing.
          </p>
          <p className="type-body-l text-secondary">
            The final call is still yours. You can build after a go-ahead, or rework
            after a rethink. The point is not to outsource judgment. It is to make the
            decision with evidence instead of momentum.
          </p>
        </div>
      </Section>

      <section className="mk-section mk-topline">
        <Container>
          <div className="mk-panel p-8 sm:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-20">
              <div>
                <p className="type-eyebrow text-brand">Ready to test your idea?</p>
                <h2 className="type-display-hero mt-4 text-balance text-primary">
                  Start with the signal. Build only when the evidence is there.
                </h2>
              </div>
              <IdeaComposer size="large" starters={[]} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
