import type { Metadata } from "next";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { SampleReport } from "@/components/SampleReport";
import { MobileCta } from "@/components/MobileCta";
import { signUpUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The full validation loop: research with sources, real answers from real people, and a score with the reasoning behind it. Exactly what happens at each step.",
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
    body: "Real search, not a model guessing from memory. We name the products that already solve this and the gap they leave, and we surface the case against the idea as deliberately as the case for it.",
    points: [
      "Every claim links to where we found it",
      "What people do instead today, which is usually the real competition",
      "The strongest counter-evidence, kept in its own section so it cannot be buried",
      "When live search turns up nothing, the report says so rather than inventing sources",
    ],
  },
  {
    n: "03",
    title: "You get answers from real people",
    body: "Two routes, one report. Gather answers yourself with questions we write and a link you share, or hand the whole thing over and have interviews sourced and run for you.",
    points: [
      "Questions built from your research, editable, in your own words if you prefer",
      "A public link that needs no signup to answer",
      "Every response screened for quality before it counts toward anything",
      "Both routes feed the same pool and the same score",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <MobileCta />

      <section className="pt-16 pb-4 sm:pt-24">
        <Container>
          <div className="mx-auto max-w-[640px] text-center">
            <h1 className="type-display-xl text-primary">
              How it works
            </h1>
            <p className="type-body-l mt-5 text-secondary">
              Four steps. Nothing hidden: the research, the questions, and
              every response stay visible to you the whole way through.
            </p>
          </div>
        </Container>
      </section>

      {STEPS.map((step, i) => (
        <Section
          key={step.n}
          bordered
          tone={i % 2 === 0 ? "sunken" : "page"}
        >
          <div className="mx-auto max-w-[720px]">
            <p className="type-data-s text-tertiary">{step.n}</p>
            <h2 className="type-display-l mt-2 text-primary">{step.title}</h2>
            <p className="type-body-l mt-4 text-secondary">{step.body}</p>
            <ul className="mt-6 space-y-3">
              {step.points.map((point) => (
                <li
                  key={point}
                  className="type-body-l flex items-start gap-3 text-primary"
                >
                  <CheckIcon
                    size={16}
                    weight="bold"
                    className="mt-1.5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ))}

      {/* Step 4 earns more room than the others: "can I trust an AI's
          verdict?" is where skepticism peaks on this page, and the honest
          answer is showing the artifact rather than describing it. */}
      <Section bordered tone="sunken">
        <div className="mx-auto max-w-[720px]">
          <p className="type-data-s text-tertiary">04</p>
          <h2 className="type-display-l mt-2 text-primary">
            You get a score, and the reasoning behind it
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            Never a bare number. The confirmation rate, the themes across every
            response, the risk factors, and the raw responses themselves are
            all there to check yourself. If the sample is too small to trust
            yet, the report says so plainly rather than rounding up.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[720px]">
          <SampleReport />
          <p className="type-caption mt-3 text-center text-tertiary">
            An illustrative report. The numbers are made up, not a customer&rsquo;s.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[720px]">
          <p className="type-body-l text-secondary">
            The final call is always yours. Proceed, rework, or stop: the
            product records the decision and the reasoning behind the number,
            but it does not make the decision for you.
          </p>
          <p className="type-body-l mt-4 text-secondary">
            Validation is a loop, not a verdict. If the signal is weak, sharpen
            the idea and run it again. There is no limit on rounds, and every
            version you have been through stays readable.
          </p>
        </div>
      </Section>

      <Section bordered className="pb-28 sm:pb-32">
        <div className="mx-auto max-w-[620px] text-center">
          <h2 className="type-display-m text-primary">
            A signal, not a guarantee
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            A high score means the evidence so far points to a real problem
            people will talk about and pay to solve. It cannot promise the
            product will succeed, and a low score is not a verdict on you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href={signUpUrl} variant="primary">
              Start with your idea
            </Button>
            <Button href="/pricing" variant="secondary">
              See pricing
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
