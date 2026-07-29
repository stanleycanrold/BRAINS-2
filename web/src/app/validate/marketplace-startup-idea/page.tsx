import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IdeaComposer } from "@/components/IdeaComposer";
import { Faq, FaqJsonLd, type FaqItem } from "@/components/Faq";
import { MobileCta } from "@/components/MobileCta";
import { Button } from "@/components/Button";
import { signUpUrl } from "@/lib/app-url";

/**
 * The pSEO template, as one real page rather than a generator.
 *
 * This is the sample the rest get built from, so it deliberately clears the
 * bar the pSEO guide sets for avoiding thin content: a genuinely
 * marketplace-specific intro (the cold-start problem is real knowledge, not a
 * mail-merged noun), checks that only apply to two-sided businesses, an FAQ
 * whose questions could not be swapped onto another niche, and internal links
 * to adjacent niches. If a niche cannot clear that bar, the guide's own rule
 * is to cut it rather than publish it thin.
 *
 * The composer appears twice, near the top and again at the end, because
 * someone reading a guide like this decides to act at one of two moments:
 * immediately, or once they have read enough to trust it.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const metadata: Metadata = {
  title: "How to validate a marketplace startup idea before you build it",
  description:
    "Marketplaces fail on the cold-start problem, not the software. How to test whether one side of your marketplace will show up before the other exists, and what evidence actually counts.",
  alternates: { canonical: `${SITE_URL}/validate/marketplace-startup-idea` },
  openGraph: {
    type: "article",
    title: "How to validate a marketplace startup idea before you build it",
    description:
      "Marketplaces fail on the cold-start problem, not the software. How to test one side before the other exists.",
  },
};

const CHECKS = [
  {
    title: "Which side is harder to get, and why",
    body: "Almost every marketplace has a hard side and an easy side, and founders routinely guess wrong about which is which. Sellers are usually harder for consumer marketplaces; buyers are usually harder in B2B. Getting this wrong means building the wrong supply first and watching it churn while you look for demand.",
  },
  {
    title: "Whether the hard side will show up for an empty marketplace",
    body: "The only honest question at this stage is whether someone will join before there is anything on the other side. Ask people on the hard side directly what would make them list, and listen specifically for whether their answer depends on volume you do not have yet.",
  },
  {
    title: "What they do instead today",
    body: "Most marketplace ideas are competing with a WhatsApp group, a spreadsheet, a Facebook group, or an existing broker, not with another marketplace. Those alternatives are free and already have the network. Find out what breaks about them before assuming a product replaces them.",
  },
  {
    title: "Whether the transaction can leave your platform",
    body: "If buyer and seller can easily meet once and transact off-platform forever after, the model leaks. Ask people whether they would keep using an intermediary after the first successful match, and take a hesitant answer seriously.",
  },
  {
    title: "How often the same buyer needs this",
    body: "A marketplace for a once-in-a-decade purchase has to re-acquire nearly every user. Frequency is the difference between a business that compounds and one that runs on paid acquisition forever, and it is knowable before you build anything.",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I validate a marketplace when neither side exists yet?",
    answer:
      "Validate one side at a time, starting with the harder one. Talk to people on the hard side about what they do today and what would make them list, without asking them to imagine a product. If the hard side will not commit to an empty marketplace, that is the finding, and it is far cheaper to learn it now than after you have built matching and payments.",
  },
  {
    question: "How many people should I talk to for a marketplace idea?",
    answer:
      "More than for a single-sided product, because you need signal from both sides separately. A workable floor is around ten conversations per side, and you should treat the two confirmation rates as separate numbers rather than averaging them into one comfortable figure.",
  },
  {
    question: "Do I need a working product to test a marketplace idea?",
    answer:
      "No, and building one early is the most common expensive mistake here. The cold-start problem is a demand and supply question, not a software question. Manual matching over email or a spreadsheet answers whether people want the match at all, which is the thing actually in doubt.",
  },
  {
    question: "What confirmation rate should a marketplace idea hit?",
    answer:
      "The same 50% threshold applies as anywhere else, but it has to hold on the hard side independently. A marketplace where 80% of buyers confirm and 20% of sellers do is not a 50% idea, it is a supply problem wearing an average as a disguise.",
  },
  {
    question: "Is disintermediation always fatal for a marketplace?",
    answer:
      "Not always, but it changes what the business has to be. Marketplaces that survive it usually add something that only works on-platform, such as payment protection, insurance, dispute handling, or reputation that does not travel. If none of those apply to your category, treat leakage as a core risk rather than an edge case.",
  },
];

/**
 * Internal links point only at pages that exist. The pSEO guide calls for
 * links to adjacent niches, and those go here as those guides are written -
 * shipping links to unwritten pages would mean publishing known 404s to
 * satisfy a checklist item.
 */
const RELATED = [
  {
    href: "/validate",
    label: "Building something else?",
    detail: "All validation guides",
  },
  {
    href: "/how-it-works",
    label: "Want the mechanics first?",
    detail: "How scoring works",
  },
];

export default function MarketplaceValidationPage() {
  return (
    <>
      <MobileCta />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="pt-8 pb-4 sm:pt-10">
        <Container>
          <Breadcrumbs
            siteUrl={SITE_URL}
            items={[
              { href: "/", label: "Home" },
              { href: "/validate", label: "Validate" },
              { label: "Marketplace startup idea" },
            ]}
          />

          <div className="mt-8 max-w-[720px]">
            <h1 className="type-display-xl text-primary">
              How to validate a marketplace startup idea before you build it
            </h1>

            {/* The niche-specific paragraph. This is the part that decides
                whether the page is useful or templated. */}
            <p className="type-body-l mt-6 text-secondary">
              Marketplaces almost never fail because the software was wrong.
              They fail on the cold-start problem: the first sellers will not
              join without buyers, the first buyers will not come without
              sellers, and the founder spends a year building matching logic
              for a market that never assembled. Validating a marketplace means
              answering one question before you write any code, and it is not
              whether people like the idea. It is whether the harder side of
              your market will show up for something that is still empty.
            </p>
          </div>
        </Container>
      </section>

      {/* Composer high on the page: someone who searched this wants to try
          validating, not only to read about it (UX guide, Part 9). */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="max-w-[720px] rounded-[16px] border border-line bg-sunken p-6 sm:p-8">
            <h2 className="type-display-m text-primary">
              Describe your marketplace
            </h2>
            <p className="type-body-m mt-2 text-secondary">
              Say who is on each side and what they are trading. We will
              research whether the problem is real, write the questions worth
              asking, and score what comes back.
            </p>
            <IdeaComposer className="mt-6" />
          </div>
        </Container>
      </section>

      <Section tone="sunken" bordered>
        <div className="max-w-[720px]">
          <h2 className="type-display-l text-primary">
            Five things to check before you build
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            These are the checks specific to two-sided businesses. A general
            idea-validation checklist will not surface any of them, which is
            why so many marketplace post-mortems read the same way.
          </p>

          <ol className="mt-10 space-y-8">
            {CHECKS.map((check, i) => (
              <li key={check.title} className="flex gap-5">
                <span className="type-data-s shrink-0 text-tertiary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="type-body-l font-medium text-primary">
                    {check.title}
                  </h3>
                  <p className="type-body-m mt-2 text-secondary">
                    {check.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section bordered>
        <div className="max-w-[720px]">
          <h2 className="type-display-l text-primary">
            What counts as evidence here
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            The trap in marketplace validation is collecting enthusiasm from
            the easy side and reading it as a signal for the whole business.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Two confirmation rates, tracked separately, never averaged",
              "At least one person on the hard side describing the problem unprompted",
              "A specific account of what they use today and what breaks about it",
              "Someone who already pays for a worse version of the match",
            ].map((item) => (
              <li
                key={item}
                className="type-body-l flex items-start gap-3 text-primary"
              >
                <CheckIcon
                  size={16}
                  weight="bold"
                  className="mt-1.5 shrink-0 text-success"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="sunken" bordered>
        <div className="max-w-[720px]">
          <h2 className="type-display-l text-primary">
            Marketplace validation questions
          </h2>
          <div className="mt-8">
            <Faq items={FAQ_ITEMS} />
          </div>
        </div>
      </Section>

      <Section bordered>
        <div className="max-w-[720px]">
          <h2 className="type-display-m text-primary">Related guides</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {RELATED.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[12px] border border-line bg-raised p-5 transition-colors duration-[120ms] hover:border-line-strong"
              >
                <p className="type-body-m text-secondary">{item.label}</p>
                <p className="type-body-l mt-1.5 flex items-center gap-1.5 font-medium text-brand">
                  {item.detail}
                  <ArrowRightIcon
                    size={15}
                    aria-hidden="true"
                    className="transition-transform duration-[120ms] group-hover:translate-x-0.5"
                  />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="sunken" bordered className="pb-28 sm:pb-32">
        <div className="mx-auto max-w-[720px]">
          <h2 className="type-display-l text-center text-primary">
            Test it before you build it
          </h2>
          <p className="type-body-l mx-auto mt-4 max-w-[520px] text-center text-secondary">
            Describe the marketplace and we will take it from there. Research
            and the full scored report cost nothing.
          </p>

          <IdeaComposer className="mt-8" />

          <p className="type-caption mt-5 text-center text-tertiary">
            Or{" "}
            <a href={signUpUrl} className="text-brand hover:underline">
              create an account
            </a>{" "}
            first. Nothing you type here is lost when you sign up.
          </p>

          <div className="mt-10 text-center">
            <Button href="/how-it-works" variant="secondary">
              See how the scoring works
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
