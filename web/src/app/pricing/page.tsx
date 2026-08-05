import type { Metadata } from "next";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { Faq, FaqJsonLd, type FaqItem } from "@/components/Faq";
import { MobileCta } from "@/components/MobileCta";
import { signUpUrl } from "@/lib/urls";

/**
 * Pricing, written as an explanation rather than a rack of buy buttons.
 *
 * Two deliberate positions here, and they are the same position twice.
 *
 * First, this page does not sell interviews. Interviews are the input cost,
 * not the product: a founder does not want twelve conversations, they want to
 * know whether to build the thing. Quoting "$40 an interview" invites a
 * comparison with respondent panels, which sell exactly that and nothing
 * else, and it makes the cheapest option look like the best one. What is
 * actually being bought is a decision you can defend, which is why the
 * deliverable is described first and identically for every tier.
 *
 * Second, the price structure is explained rather than hidden behind a "from"
 * figure. The real total has two components and the analysis half is largely
 * fixed, so a card reading "from $40" understates a small round by a lot.
 * This site argues two pages over that a brief you cannot audit is just a
 * longer opinion; a price you cannot work out before checkout fails the same
 * test.
 *
 * Figures below are the published starting rates and are maintained by hand.
 * `web` is a standalone deploy with no database access, so it cannot read
 * `pricing_config` the way the app does. If Ops retunes a rate, this page has
 * to be edited too.
 */

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Validation is free to run yourself. Paying buys back the legwork of finding and talking to people, not a better answer. How the price is put together, in full.",
};

/**
 * The deliverable, identical on every tier. Listed once and before any price,
 * because it is the thing being bought.
 */
const INCLUDED = [
  "A research brief with every claim linked to its source",
  "The communities where your problem is already discussed, named",
  "The case against the idea, in its own section",
  "Non-leading questions written from the findings, editable",
  "A share link anyone can answer without signing up",
  "Every response screened for quality before it counts",
  "A score with its reasoning, the themes, and the risk factors",
  "Every raw answer, tagged and readable, with its source",
  "Unlimited rework rounds, with every past version kept",
];

const TRACKS = [
  {
    id: "self-serve",
    name: "Self-serve",
    price: "Free",
    priceNote: "No card, no time limit",
    tagline: "You find the people.",
    body: "Everything above, and you gather the responses yourself using the questions and the share link. The report is the same one a paid round produces.",
    cta: { label: "Start free", href: signUpUrl, variant: "primary" as const },
  },
  {
    id: "fast-track",
    name: "Fast Track",
    price: "Priced per round",
    priceNote: "Itemised before you pay",
    tagline: "We find the people.",
    body: "Respondents sourced to match your market, interviews run and screened, and the round back on your dashboard in one to two weeks.",
    cta: {
      label: "How the price works",
      href: "#how-price-works",
      variant: "secondary" as const,
    },
  },
  {
    id: "social-scan",
    name: "Continued Social Scan",
    price: "Monthly",
    priceNote: "Cancel whenever",
    tagline: "The research keeps running.",
    body: "The scan does not stop when the score lands. The communities the research named stay watched, and you get told when the problem shows up again.",
    cta: {
      label: "What it watches",
      href: "#social-scan",
      variant: "secondary" as const,
    },
  },
];

const AUDIENCE_TIERS = [
  {
    tier: "General consumer",
    rate: "$40",
    example: "Pet owners, commuters, home cooks, parents of school-age children",
    why: "Large, easy to reach, and willing to talk without a professional incentive.",
  },
  {
    tier: "Vertical B2B",
    rate: "$90",
    example: "Independent dental practices, regional logistics firms, small law offices",
    why: "A working professional giving up billable time, found through narrower channels.",
  },
  {
    tier: "Highly specialised",
    rate: "$180",
    example: "Hospital procurement leads, semiconductor process engineers, actuaries",
    why: "Few of them exist, they are hard to reach, and their time is expensive.",
  },
];

/**
 * Written as what the founder gets, not as what the scan does.
 *
 * The earlier version led with the promise that we never post as you. True,
 * and it stays in the FAQ and the evidence standard, but it is a reassurance
 * rather than a reason to buy: nobody pays monthly for a tool defined by what
 * it refuses to do. The reason to buy is that finding the right room at the
 * right moment is a full day's work every week, and this removes it.
 */
const SCAN_VALUE = [
  {
    title: "The rooms, already found",
    body: "You stop opening twenty tabs looking for where your customers gather. The scan carries the communities the research named and keeps adding the ones that turn up later.",
  },
  {
    title: "The moment, not just the place",
    body: "A thread where somebody has just described your problem is worth more than the same thread next month. You get told while the question is still open.",
  },
  {
    title: "Drafts that teach, never pitch",
    body: "Each draft answers the question that was actually asked, using what you know about the problem. No product mention unless somebody asks. That is what gets upvoted rather than removed.",
  },
  {
    title: "Credibility that compounds into leads",
    body: "Being the person who gave a genuinely useful answer in a room full of your buyers is how founders get their first customers. The scan puts you in those rooms every week instead of once.",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is the free tier actually free, or a trial?",
    answer:
      "Actually free. The research, the questions, the share link and the full scored report cost nothing, with no time limit and no card. Paying changes who does the legwork of reaching people. It does not change what the report contains or how the score is calculated.",
  },
  {
    question: "Why is it not just a price per interview?",
    answer:
      "Because that is not what you are buying. Sourcing and running conversations is one cost, and turning them into a defensible answer is another that barely changes with volume. A round of six and a round of thirty need almost the same analysis. Pricing purely per interview would either overcharge small rounds or make large ones look artificially cheap.",
  },
  {
    question: "What makes one round cost more than another?",
    answer:
      "How hard your audience is to reach, and how much evidence you want. A general-consumer round starts at $40 a response. A highly specialised professional audience runs to $180 because there are fewer of them and their time costs more. You choose the number of responses, and see the itemised total before anything is charged.",
  },
  {
    question: "How many responses do I actually need?",
    answer:
      "Ten to fifteen for most products, and the report flags anything under ten as a thin sample rather than quietly rounding the score up. Three is the floor we will run. More responses buy confidence, not a different verdict, so there is a real point past which extra spend stops changing the decision.",
  },
  {
    question: "What if the result says my idea is weak?",
    answer:
      "That is a working outcome, not a failed purchase. A weak result is usually specific: the problem is real but the audience will not switch, or the wedge is somewhere adjacent. You rework and run again, as many times as you want, and every past version stays readable including the rounds that did not pass.",
  },
  {
    question: "Do responses you gather count differently from mine?",
    answer:
      "They are tracked separately so you can always tell which answers you collected and which were sourced for you, but both feed the same pool and the same score. Everything is screened for quality before it counts, from either route.",
  },
  {
    question: "Is Fast Track a subscription?",
    answer:
      "No. It is paid per round, per idea. Nothing starts until the payment clears, and the order is tied to the specific set of questions it was bought for. Continued Social Scan is the only recurring thing we sell, and it is cancellable at any time.",
  },
  {
    question: "Will you post in those communities for me?",
    answer:
      "Never, in any tier, and that is permanent rather than a limit we intend to relax. We draft, you publish. Communities can tell when they are being farmed by a bot, and getting your account banned would cost you the exact audience you are trying to reach.",
  },
];

export default function PricingPage() {
  return (
    <>
      <MobileCta />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="pt-16 pb-4 sm:pt-20">
        <Container>
          <div className="max-w-[820px]">
            <p className="type-eyebrow text-brand">Pricing</p>
            <h1 className="type-display-2xl mt-6 text-balance text-primary">
              An answer you can defend.
            </h1>
            <p className="type-body-xl mt-7 max-w-[58ch] text-secondary">
              To a co-founder, to an investor, or to yourself at 2am. Running
              it yourself costs nothing. Paying buys back the weeks of finding
              the right people and getting them to talk.
            </p>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="What you get"
        title="Every round produces the same thing"
        lead="This list does not change between tiers. Nothing is held back on the free one, and nothing extra is unlocked by paying. The only variable is who does the legwork of reaching people."
      >
        <div className="mk-grid mk-grid-raised sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <div key={item} className="flex items-start gap-3 p-5">
              <CheckIcon
                size={16}
                weight="bold"
                className="mt-1 shrink-0 text-success"
                aria-hidden="true"
              />
              <span className="type-body-m text-primary">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        tone="sunken"
        eyebrow="How it runs"
        title="Three ways to get there"
        lead="Pick the one that matches how much of your own time you want to spend."
      >
        <div className="mk-grid mk-grid-raised lg:grid-cols-3">
          {TRACKS.map((track) => (
            <div
              key={track.id}
              id={track.id}
              className="flex scroll-mt-24 flex-col p-7 lg:p-8"
            >
              <h3 className="type-display-m text-primary">{track.name}</h3>
              <p className="type-body-m mt-1.5 text-secondary">
                {track.tagline}
              </p>

              <p className="type-display-hero mt-7 text-primary">
                {track.price}
              </p>
              <p className="type-caption mt-2 text-tertiary">
                {track.priceNote}
              </p>

              <p className="type-body-m mt-6 flex-1 border-t border-line pt-6 text-secondary">
                {track.body}
              </p>

              <div className="mt-8">
                <Button
                  href={track.cta.href}
                  variant={track.cta.variant}
                  className="w-full"
                >
                  {track.cta.label}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="how-price-works"
        eyebrow="How the price works"
        title="Two components, and one of them barely moves"
        lead="Fast Track is priced from the two things it actually costs us. Both appear itemised at checkout before anything is charged."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="mk-card p-7">
            <p className="type-eyebrow text-tertiary">Component one</p>
            <h3 className="type-display-m mt-3 text-primary">
              Reaching the people
            </h3>
            <p className="type-body-m mt-3 text-secondary">
              Charged per response, and it scales directly with how many you
              order. This is the part that varies by audience, because a
              hospital procurement lead is far harder to reach than a dog
              owner.
            </p>
          </div>

          <div className="mk-card p-7">
            <p className="type-eyebrow text-tertiary">Component two</p>
            <h3 className="type-display-m mt-3 text-primary">
              Turning it into an answer
            </h3>
            <p className="type-body-m mt-3 text-secondary">
              Screening every response, finding the themes, weighing the
              contradictions and producing the scored report. Largely fixed: a
              round of six needs almost the same work as a round of thirty,
              which is why it is not billed per head.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="type-body-l font-semibold text-primary">
            What your audience costs to reach
          </h3>
          <div className="mk-panel mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className="type-eyebrow px-6 py-4 text-tertiary">
                      Audience
                    </th>
                    <th className="type-eyebrow px-6 py-4 text-tertiary">
                      Per response
                    </th>
                    <th className="type-eyebrow px-6 py-4 text-tertiary">
                      Looks like
                    </th>
                    <th className="type-eyebrow px-6 py-4 text-tertiary">
                      Why
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {AUDIENCE_TIERS.map((row) => (
                    <tr
                      key={row.tier}
                      className="border-b border-line last:border-0"
                    >
                      <td className="type-body-m px-6 py-5 align-top font-medium text-primary">
                        {row.tier}
                      </td>
                      <td className="type-data-s px-6 py-5 align-top whitespace-nowrap text-brand">
                        from {row.rate}
                      </td>
                      <td className="type-body-m px-6 py-5 align-top text-secondary">
                        {row.example}
                      </td>
                      <td className="type-body-m px-6 py-5 align-top text-secondary">
                        {row.why}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="type-body-m mt-6 max-w-[72ch] text-secondary">
            Which tier your idea falls into is decided during research, from
            who you said it is for, not chosen by you at checkout. You set the
            number of responses, the total updates as you change it, and you
            see the itemised figure before paying. Three responses is the
            floor we will run.
          </p>
        </div>
      </Section>

      <Section
        id="social-scan"
        tone="sunken"
        eyebrow="Continued Social Scan"
        title="Stop spending your week looking for where your customers are"
        lead="The research already names the communities where your problem gets discussed. This keeps that scan running, tells you when the conversation worth joining appears, and hands you something worth saying in it."
        aside={
          <Button href={signUpUrl} variant="secondary">
            Start free first
          </Button>
        }
      >
        <div className="mk-grid mk-grid-raised sm:grid-cols-2">
          {SCAN_VALUE.map((item) => (
            <div key={item.title} className="p-6 lg:p-7">
              <h3 className="type-body-l font-medium text-primary">
                {item.title}
              </h3>
              <p className="type-body-m mt-2.5 text-secondary">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="type-body-m mt-8 max-w-[72ch] text-secondary">
          Every draft is yours to edit and post in your own words, so what goes
          out sounds like you and lands in your account&rsquo;s own history.
        </p>
      </Section>

      <Section eyebrow="Questions" title="What people actually ask" layout="split">
        <Faq items={FAQ_ITEMS} />
      </Section>

      <section className="mk-section mk-topline">
        <Container>
          <div className="max-w-[760px]">
            <h2 className="type-display-hero text-balance text-primary">
              Find out this week, not next quarter.
            </h2>
            <p className="type-body-xl mt-5 max-w-[56ch] text-secondary">
              The research costs nothing and comes back in minutes. Start with
              the idea you are least sure about, and decide on evidence instead
              of a hunch.
            </p>
            <div className="mt-9">
              <Button href={signUpUrl} variant="primary">
                Start free
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
