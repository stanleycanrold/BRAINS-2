import { Container } from "@/components/Container";
import { IdeaComposer } from "@/components/IdeaComposer";
import { ProductShowcase } from "@/components/ProductShowcase";
import { Section, SectionHeading } from "@/components/Section";
import { MobileCta } from "@/components/MobileCta";
import { signUpUrl } from "@/lib/urls";

const OUTCOMES = [
  {
    label: "Validate the problem",
    body: "See the evidence, the objections, and what is still uncertain.",
  },
  {
    label: "Find early buyers",
    body: "Identify the communities and people closest to the problem.",
  },
  {
    label: "Choose the next move",
    body: "Turn what you learn into focused conversations and a clearer plan.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Describe the idea",
    body: "Start with the problem, the people, or the product taking shape in your head.",
  },
  {
    number: "02",
    title: "Read the market",
    body: "Research the demand, alternatives, and the language people already use for the problem.",
  },
  {
    number: "03",
    title: "Start the right conversations",
    body: "Meet potential early customers where they gather and learn what would make them move.",
  },
];

export default function HomePage() {
  return (
    <>
      <MobileCta />

      <section className="pt-12 pb-16 sm:pt-20 sm:pb-20">
        <Container>
          <div className="mx-auto max-w-[760px] text-center">
            <p className="type-caption text-brand uppercase">From idea to market</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
              <span className="block">Validate the idea.</span>
              <span className="block text-brand">Find the first customers.</span>
            </h1>
            <p className="type-body-l mx-auto mt-5 max-w-[590px] text-secondary">
              Understand the problem, find the people feeling it, and know which
              conversations to start next.
            </p>

            <IdeaComposer className="mt-8 text-left" />
            <p className="type-caption mt-4 text-tertiary">
              Free to start. Create an account to view your market brief.
            </p>
          </div>
        </Container>
      </section>

      <Section bordered className="py-16 sm:py-24">
        <div className="mx-auto max-w-[650px] text-center">
          <p className="type-caption text-brand uppercase">See the next move</p>
          <h2 className="type-display-l mt-3 text-primary">
            A clearer path from idea to market.
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            BRAINS brings the signal, the people to learn from, and the next
            question into one focused view.
          </p>
        </div>

        <div className="mt-10">
          <ProductShowcase />
        </div>

        <div className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-3 sm:gap-10">
          {OUTCOMES.map((outcome) => (
            <div key={outcome.label}>
              <p className="type-caption text-brand uppercase">{outcome.label}</p>
              <p className="type-body-m mt-2 text-secondary">{outcome.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="sunken" bordered className="py-16 sm:py-24">
        <SectionHeading
          eyebrow="How it works"
          title="Get closer to the market before you build."
        />

        <div className="mx-auto mt-10 max-w-[900px] divide-y divide-line border-y border-line">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="grid gap-3 py-6 sm:grid-cols-[72px_220px_1fr] sm:items-start sm:gap-6"
            >
              <p className="type-data-s text-brand">{step.number}</p>
              <h3 className="type-body-l font-medium text-primary">{step.title}</h3>
              <p className="type-body-m text-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section bordered className="py-16 sm:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="type-display-l text-primary">
            Start with the idea you have now.
          </h2>
          <p className="type-body-l mx-auto mt-4 max-w-[560px] text-secondary">
            It does not need to be polished. A clear problem, an audience, or a
            rough product thought is enough to begin.
          </p>

          <IdeaComposer className="mt-8 text-left" />

          <p className="type-caption mt-5 text-tertiary">
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
