import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IdeaComposer } from "@/components/IdeaComposer";
import { Disclosure, type DisclosureItem } from "@/components/Disclosure";
import { MobileCta } from "@/components/MobileCta";
import { getBusinessTypePages } from "@/content";
import { SITE_URL } from "@/lib/urls";

/**
 * The validation service page. What the nav points at, and the page that has
 * to rank for what this product does.
 *
 * Two jobs at once, which is why it is structured the way it is. For a
 * founder it explains validation and everything inside it. For search it is
 * the one page carrying the full vocabulary of the product - interviews,
 * research, community scanning, screening, scoring - in enough depth to be
 * worth ranking, rather than four words on a card.
 *
 * The capability list is expandable rather than a wall. Every word is in the
 * HTML whether or not a row is open, so nothing is hidden from a crawler; the
 * folding is purely so a human can scan the list before choosing what to read.
 *
 * It is not a content index and does not list articles. The business-type
 * guides get one contextual sentence inside the intro; the question pages get
 * nothing at all. Every article is reached from search, the sitemap, and the
 * computed cross-links between articles, and a service page that grows a card
 * grid per content type stops being a service page.
 */

export const metadata: Metadata = {
  title: "Startup idea validation",
  description:
    "Everything inside a validation round: sourced market research, community scanning, interview questions, response screening, and a score with its reasoning.",
  alternates: { canonical: `${SITE_URL}/validation` },
};

const RESEARCH: DisclosureItem[] = [
  {
    title: "Idea intake",
    summary: "A paragraph is enough to start.",
    body: "Describe the situation and what goes wrong today. You do not need a polished pitch, a deck, or a name for the company. If only one feature is in doubt, describe just that part rather than the whole product.",
    points: [
      "Attach a deck, notes or a link and we read them for context",
      "Say who it is for and where they are, so research looks in the right market",
      "Your idea is saved before any agent runs, so nothing is lost if a step fails",
    ],
  },
  {
    title: "Existing product context",
    summary: "Already live? We start from what you own.",
    body: "If you already have something in market, paste the link. We read the evidence you already own before going out to strangers, because for a founder with real usage that feedback is cheaper and more diagnostic than fresh outside interviews.",
    points: [
      "Ratings and review volume where they are public",
      "The recurring themes in recent reviews, including the complaints",
      "What reviewers say they switched from, and why",
    ],
  },
  {
    title: "Market research, with sources",
    summary: "Real search, not a model recalling things.",
    body: "We read what already exists about the problem and cite it. Every claim in the brief links to where we found it, so you can open it and judge for yourself rather than taking a summary on trust.",
    points: [
      "The products already solving this, and the gap they leave",
      "What people do instead today, which is usually the real competition",
      "Pricing and positioning of the current alternatives",
      "When live search turns up nothing, the brief says so rather than inventing a source",
    ],
  },
  {
    title: "The case against your idea",
    summary: "Counter-evidence in its own section.",
    body: "Anything that argues against the idea is collected deliberately and kept where it cannot be buried inside a positive summary. A weak signal reported as weak is the entire value of the exercise.",
    points: [
      "Evidence the problem is rare rather than widespread",
      "Signs the current workaround is tolerated rather than hated",
      "Markets where someone has already tried this and stopped",
    ],
  },
  {
    title: "Community signal scan",
    summary: "Where your buyers already gather.",
    body: "We find the specific places the problem gets discussed, with a real thread as proof rather than a generic suggestion to try Reddit. This is what turns who you should talk to into where you can actually reach them today.",
    points: [
      "Named communities with rough size and how active they are",
      "An example thread in each, so you can judge the fit yourself",
      "Search phrases people use when they are actively trying to fix it",
    ],
  },
  {
    title: "Idea strengthening",
    summary: "Proposed changes you accept or reject.",
    body: "Where the research suggests a sharper version of the idea, we propose it with the reasoning attached. Nothing changes unless you accept it, and rejecting a suggestion is a normal outcome rather than something to justify.",
    points: [
      "A narrower audience where the evidence points somewhere specific",
      "A reframing where the pain sits next to where you assumed",
      "Every version kept, so you can see how the idea evolved",
    ],
  },
];

const EVIDENCE: DisclosureItem[] = [
  {
    title: "Interview questions",
    summary: "Written from your research, not a template.",
    body: "Questions drafted from what the research actually found, designed so the answers mean something. The rule throughout is to ask about the last time it happened rather than what someone would hypothetically do, because memory of a real event is checkable and a prediction is not.",
    points: [
      "Non-leading by construction, so you cannot accidentally buy the answer",
      "Fully editable, and you can rewrite them in your own words",
      "Each one paired with the bar an answer has to clear to count",
    ],
  },
  {
    title: "The share link",
    summary: "Anyone can answer without signing up.",
    body: "You get a public link to send to anyone: a community, a mailing list, an individual. Nobody needs an account to answer it, because requiring one is the fastest way to lose the respondents you worked hardest to find.",
    points: [
      "Works on a phone, in a message, in a forum comment",
      "Responses land in your dashboard as they arrive",
      "No cap on how many people you send it to",
    ],
  },
  {
    title: "Response screening",
    summary: "Junk answers never reach the score.",
    body: "Every response is checked for quality before it counts toward anything. A one-word yes, an obviously automated reply, and a thoughtful three-paragraph account of a real incident are not the same evidence, and the score should not pretend they are.",
    points: [
      "Low-effort and off-topic responses flagged and excluded",
      "Depth weighted, so a specific story counts for more than agreement",
      "You can read everything that was excluded, and why",
    ],
  },
  {
    title: "Fast Track interviews",
    summary: "We source and run them for you.",
    body: "When you want the answer without spending three weeks finding people, respondents are sourced to match your market and the conversations are run and screened for you. The report that comes back is the same one the free route produces.",
    points: [
      "Respondents matched to the audience the research identified",
      "Priced from how hard that audience is to reach, itemised before you pay",
      "Back on your dashboard in one to two weeks",
    ],
  },
];

const DECIDE: DisclosureItem[] = [
  {
    title: "Synthesis and themes",
    summary: "What everyone said, and where they disagreed.",
    body: "The responses are read together rather than one at a time, so you get the pattern instead of a pile. Where the answers contradict the earlier research, that contradiction is stated explicitly rather than averaged away.",
    points: [
      "Recurring themes across every response, with the quotes behind them",
      "Segments that answered differently from each other",
      "Anything the people you spoke to said that the research missed",
    ],
  },
  {
    title: "The decision gate",
    summary: "Half confirming the problem is the line.",
    body: "Clear it and you get a go-ahead. Miss it and you get a rethink with a diagnosis of which part failed, never a silent kill. Proceed, rework or stop is always your call: the tool advises, it does not lock you out of a path.",
    points: [
      "Six named factors that adjust the score, listed on every report",
      "A thin sample flagged as thin rather than quietly rounded up",
      "Every raw answer readable, tagged confirmed, unsure or no, with its source",
    ],
  },
  {
    title: "Rework rounds",
    summary: "Unlimited, with every version kept.",
    body: "Validation is a loop, not a single verdict. Sharpen the idea and run it again as many times as you need. Every past version stays readable, including the rounds that did not pass, so you can see exactly what changed and what it changed.",
    points: [
      "No cap on cycles, on any tier",
      "Each round scored on its own evidence",
      "Version history you can walk back through",
    ],
  },
  {
    title: "Continued Social Scan",
    summary: "The research keeps running afterwards.",
    body: "Finding the right room at the right moment is a day a week. After your score lands, the scan keeps watching the communities the research named and tells you when the conversation worth joining appears, with something worth saying in it.",
    points: [
      "Told while the question is still open, not weeks later",
      "Drafts that answer what was asked rather than pitch the product",
      "Being useful in public, in a room full of your buyers, is how first customers arrive",
    ],
  },
];

export default function ValidationHubPage() {
  const guides = getBusinessTypePages();

  return (
    <>
      <MobileCta />

      <section className="pt-8 pb-16 sm:pt-10 sm:pb-24">
        <Container>
          <Breadcrumbs
            siteUrl={SITE_URL}
            items={[{ href: "/", label: "Home" }, { label: "Validation" }]}
          />

          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
            <div className="mk-rise">
              <p className="type-eyebrow text-brand">Validation</p>
              <h1 className="type-display-2xl mt-6 max-w-[14ch] text-balance text-primary">
                Validate it before you build it.
              </h1>
              <p className="type-body-xl mt-7 max-w-[54ch] text-secondary">
                Research the problem against real sources, find the people who
                have it, ask them something worth asking, and get a score with
                the reasoning attached. Free to run yourself.
              </p>
            </div>

            <div className="mk-rise mk-delay-2 mk-panel p-6 sm:p-7">
              <p className="type-eyebrow text-brand">Try it now</p>
              <h2 className="type-display-m mt-3 text-primary">
                Start with your idea
              </h2>
              <p className="type-body-m mt-2.5 text-secondary">
                A paragraph is enough. The situation, and what goes wrong
                today.
              </p>
              <IdeaComposer className="mt-6" />
            </div>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="What validation means here"
        title="Evidence a stranger already has the problem"
        lead="Not whether people like the idea. Whether the problem shows up in their week without you naming it first, and whether it costs them enough to change what they do."
      >
        <div className="max-w-[70ch] space-y-5">
          <p className="type-body-l text-secondary">
            Most ideas do not fail because the founder could not build the
            thing. They fail because a confident guess went unchecked for six
            months: the problem turned out to be rare, or real but tolerated,
            or the answer came from a leading question that decided itself
            before the conversation started.
          </p>
          <p className="type-body-l text-secondary">
            A validation round exists to catch that in a fortnight instead of a
            quarter. Everything below is part of one round, and the free tier
            includes all of it.
          </p>

          <p className="type-body-l text-secondary">
            What kills a marketplace is not what kills a SaaS product, and a
            general checklist surfaces neither. Where the failure modes are
            genuinely different we write them up separately.
          </p>
        </div>

        {/* Promoted from a single inline sentence once the sixth guide landed,
            which is the threshold the previous note here set: a three-up grid
            needs six entries before the last row looks intentional rather than
            unfinished. Below six, put it back to a sentence.

            Still not a content index. The question-track pages are absent by
            design and reached from search, so this grid stays capped at the
            business-type guides. */}
        {guides.length >= 6 ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/validation/${guide.slug}`}
                className="mk-card flex flex-col p-6"
              >
                <h3 className="type-body-l font-medium text-primary">
                  {guide.shortTitle}
                </h3>
                <p className="type-body-m mt-2.5 text-secondary">
                  {guide.summary}
                </p>
              </Link>
            ))}
          </div>
        ) : guides.length > 0 ? (
          <p className="type-body-l mt-5 max-w-[70ch] text-secondary">
            So far:{" "}
            {guides.map((guide, i) => (
              <span key={guide.slug}>
                {i > 0 ? ", " : ""}
                <Link
                  href={`/validation/${guide.slug}`}
                  className="text-brand hover:underline"
                >
                  {guide.shortTitle.toLowerCase()}
                </Link>
              </span>
            ))}
            .
          </p>
        ) : null}
      </Section>

      <Section
        id="research"
        tone="sunken"
        eyebrow="Inside a round: research"
        title="Reading the market before you interrupt anyone"
        lead="Desk research cannot tell you whether a specific person will change what they do, but it gets you to a far sharper question before you ask it."
      >
        <Disclosure items={RESEARCH} />
      </Section>

      <Section
        id="evidence"
        eyebrow="Inside a round: getting answers"
        title="Talking to people who actually have the problem"
        lead="The conversations are the evidence. Everything here exists to make sure the ones you have are worth counting."
      >
        <Disclosure items={EVIDENCE} />
      </Section>

      <Section
        id="decide"
        tone="sunken"
        eyebrow="Inside a round: deciding"
        title="A number you can show someone else"
        lead="A score with nothing behind it is an opinion with a decimal point. Every part of this one can be opened and checked."
      >
        <Disclosure items={DECIDE} />
      </Section>

      {/* One heading and the box, nothing else.
          Someone who has read this far already knows what the product does and
          what it costs; a lead paragraph, a reassurance line and a row of
          starter prompts are three things competing with the only control that
          matters. Stripping them lets the box be the largest thing here. */}
      <section className="mk-section mk-topline">
        <Container>
          <div className="mk-panel p-8 sm:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-20">
              <h2 className="type-display-hero text-balance text-primary">
                Start with the idea you are least sure about.
              </h2>

              <IdeaComposer size="large" starters={[]} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
