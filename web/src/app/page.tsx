import { CheckIcon, WarningIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { IdeaComposer } from "@/components/IdeaComposer";
import { LiveRun } from "@/components/LiveRun";
import { ReportPreview } from "@/components/ReportPreview";
import { Faq, FaqJsonLd, type FaqItem } from "@/components/Faq";
import { MobileCta } from "@/components/MobileCta";
import { Button } from "@/components/Button";
import { signUpUrl } from "@/lib/urls";

/**
 * The landing page.
 *
 * Today it is the validation product's page and the site's front door at
 * once. When the second product ships, this becomes the multi-product page
 * and /validation carries what is here.
 *
 * Structured around one worked example rather than a list of features. The
 * previous version described capabilities abstractly and showed an invented
 * dashboard once; a founder cannot evaluate either. Following a single real
 * idea from research through to a score, and then showing the standards the
 * report is held to, is the version that survives this product's own evidence
 * rule.
 *
 * Every claim on this page maps to a real agent in src/lib/agents/catalog:
 * research, product-context, questionnaire, response-quality, synthesis,
 * decision-gate, signal-scan, post-drafting and comment-drafting.
 */

/**
 * The four questions the product answers, directly under the headline.
 *
 * Phrased as the founder's own questions rather than as our capabilities,
 * because that is how they arrive: nobody wakes up wanting to "validate an
 * idea", they wake up unsure whether anyone actually has the problem. A
 * founder scanning the fold looks for their own question and finds it here.
 *
 * These also replace the lead paragraph the hero used to carry. Same
 * information, a fifth of the vertical space, which is what keeps the
 * composer on the first screen.
 */
const HIGHLIGHTS = [
  "Is the problem real?",
  "Who actually has it?",
  "Where do I find them?",
  "What do I ask?",
];

const FAILURE_MODES = [
  {
    title: "The problem was real, but rare",
    body: "The pain is genuine and everyone you spoke to confirmed it. There are simply not enough of them, or they are too scattered and too cheap to reach at the price you need to charge.",
    tell: "You can name the problem but not where fifty of these people gather.",
  },
  {
    title: "They liked it and kept their spreadsheet",
    body: "Enthusiasm is free. A founder hears “I would definitely use that” and books it as demand, when the honest reading is that nothing about the current workaround hurts enough to change.",
    tell: "Nobody has ever paid anything to solve this, including in a worse way.",
  },
  {
    title: "You asked a leading question",
    body: "Describing your product and asking whether it sounds useful returns politeness, not evidence. The answer was decided by the question before the interview started.",
    tell: "Your notes contain opinions about your idea instead of stories about their week.",
  },
];

const SCORE_FACTORS = [
  {
    title: "Sample size",
    body: "Fewer than ten responses across all channels and the score is flagged as thin, not quietly rounded up.",
  },
  {
    title: "Answer depth",
    body: "A one-word yes is not the same as someone describing the last time it cost them money. Thin answers count for less.",
  },
  {
    title: "Source diversity",
    body: "Every response from a single community is a weaker signal than the same number spread across four.",
  },
  {
    title: "Channel mix",
    body: "Interviews, surveys and social replies carry different reliability. We say so rather than averaging it away.",
  },
  {
    title: "Experts versus users",
    body: "On Fast Track, domain experts confirm the problem exists in their view, a different signal from a user living it. The report states which one you got.",
  },
  {
    title: "Conflict with the research",
    body: "If the earlier research called it strong and the people you spoke to disagree, that contradiction is called out explicitly.",
  },
];

const GATE = [
  {
    label: "At or above 50%",
    verdict: "Go ahead",
    tone: "brand" as const,
    body: "The problem is real to enough people to justify building. The report still tells you which segment was strongest, so you can narrow before you start.",
  },
  {
    label: "Below 50%",
    verdict: "Rethink",
    tone: "caution" as const,
    body: "Not a kill. You get a diagnosis of which part failed, the problem statement, the audience, or the problem itself, then you rework and run it again. There is no cap on cycles.",
  },
  {
    label: "Either way",
    verdict: "You decide",
    tone: "plain" as const,
    body: "Proceed, rework or kill is always your call. You can rework after a go-ahead, or build anyway after a rethink. The tool advises; it never locks you out of a path.",
  },
];

const EVIDENCE_SOURCES = [
  {
    title: "Public discussion where the problem is lived",
    body: "Forums, subreddits, groups, review threads and Q&A sites where people describe what broke this week without being asked.",
  },
  {
    title: "What people already buy, and abandon",
    body: "Existing tools, their pricing, and the reviews explaining why someone churned. Churn language is the most honest data on the internet.",
  },
  {
    title: "Search behaviour around the pain",
    body: "The phrases people type when they are actively trying to fix it, which is a much stronger signal than interest in a category.",
  },
  {
    title: "Adjacent workarounds",
    body: "Spreadsheets, WhatsApp groups, notebooks and hired humans. Whatever they use today is your real competitor.",
  },
];

const NEVER = [
  "Post, comment or reply anywhere as you. We draft, you publish, in every tier, permanently",
  "Draft anything that pitches your product or misrepresents who you are",
  "Invent a statistic to fill a gap in the research",
  "Report a market size as if it were your addressable demand",
  "Turn one enthusiastic comment into a confirmed trend",
  "Hand you a bare score with no reasoning attached",
  "Tell you the idea is great because you seem to want that",
];

const COMPARISON = [
  {
    dimension: "Where the answer comes from",
    chatbot: "Plausible text generated from patterns, with no obligation to be sourced",
    friends: "The three people who like you most",
    brains: "Named public sources you can open and read yourself",
  },
  {
    dimension: "Bias toward your idea",
    chatbot: "Agrees readily, because it is optimising for a helpful-sounding reply",
    friends: "Strongly positive and socially motivated to stay that way",
    brains: "Reports the weak signals as weak, including when it kills the idea",
  },
  {
    dimension: "Who you should talk to",
    chatbot: "A generic persona description",
    friends: "Whoever they happen to know",
    brains: "Specific communities and threads, with rough size and activity",
  },
  {
    dimension: "What you do next",
    chatbot: "A summary you still have to turn into a plan",
    friends: "Encouragement",
    brains: "Non-leading questions and the bar an answer must clear to count",
  },
  {
    dimension: "When the evidence is thin",
    chatbot: "Fills the gap confidently",
    friends: "Changes the subject",
    brains: "Says so, and marks the confidence low",
  },
];

/**
 * The three ways a round can run.
 *
 * Continued Social Scan is not a separate product bolted on: the research
 * pass already runs a signal scan that names the communities and the threads
 * the problem shows up in. This keeps that scan running instead of letting it
 * expire the day the score lands, which is why it reads as continued research
 * rather than as a social media tool.
 */
const TRACKS = [
  {
    name: "Self-serve",
    price: "Free",
    tagline: "You find the people.",
    body: "The full research pass, the questions written from it, and a link you share yourself. Scored the moment answers come in.",
    points: [
      "Research brief with every claim sourced",
      "Non-leading questions drafted from the findings",
      "Public response link, no signup needed to answer",
      "Full scored report with the raw responses",
    ],
    cta: { label: "Start free", href: signUpUrl, variant: "primary" as const },
  },
  {
    name: "Fast Track",
    price: "Priced per round",
    tagline: "We find the people.",
    body: "The same round, except respondents are sourced to match your market and the conversations are run for you.",
    points: [
      "Respondents sourced and screened for fit",
      "Conversations run and quality-checked",
      "Same report, same score, same raw answers",
      "For when you need the answer this week",
    ],
    cta: {
      label: "See pricing",
      href: "/pricing",
      variant: "secondary" as const,
    },
  },
  {
    name: "Continued Social Scan",
    price: "Monthly",
    tagline: "We find the conversations.",
    body: "Finding the right room at the right moment is a day a week. The scan keeps running after your score and hands you the threads worth answering.",
    points: [
      "The communities your buyers are in, kept current",
      "Told while the question is still open, not weeks later",
      "Drafts that answer the question, never pitch the product",
      "Turns being useful in public into your first leads",
    ],
    cta: {
      label: "See pricing",
      href: "/pricing",
      variant: "secondary" as const,
    },
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Does this replace talking to customers?",
    answer:
      "No, and you should distrust anything that claims to. It removes the guesswork before the conversations: which problem to probe, who to talk to, where to find them, and what to ask so the answers mean something. The conversations themselves are still the evidence.",
  },
  {
    question: "What if the report says my idea is weak?",
    answer:
      "Then you have saved a quarter for the price of a sentence. A weak result is usually specific rather than fatal. Most often it says the problem is real but the audience will not switch, which points at a different wedge into the same market.",
  },
  {
    question: "How is this different from asking a general chatbot?",
    answer:
      "A general chatbot generates a plausible answer, has no obligation to source it, and tends to agree with the framing you gave it. Every claim in a brief is attached to a source you can open, and weak evidence is reported as weak rather than smoothed over.",
  },
  {
    question: "How long does the research take?",
    answer:
      "The research pass comes back in about a minute or two and you can keep working while it runs. Validation takes as long as your conversations take: self-paced on the free track, or one to two weeks if we run the interviews for you.",
  },
  {
    question: "Will you post on my behalf in the communities you find?",
    answer:
      "Never, in any tier, and this is permanent rather than a limitation we plan to relax. We draft posts and replies, flag any draft that reads as generic, and you edit and publish it yourself. Communities can tell when they are being farmed by a bot, and getting your account banned would cost you the exact audience you are trying to reach.",
  },
  {
    question: "I already have a product live. Is this still useful?",
    answer:
      "Often more useful. Paste your link and we start from evidence you already own: your ratings, review volume and the recurring themes in recent reviews, before going out to strangers. For a founder with real usage, that existing feedback is cheaper and more diagnostic than fresh outside interviews.",
  },
  {
    question: "What if I only manage six responses instead of ten?",
    answer:
      "You can force the analysis through and still get a report. The score will carry a thin-sample flag, and the reasoning will say plainly that six responses cannot support a confident verdict. We would rather show you a caveated number than block you or pretend six is enough.",
  },
  {
    question: "My idea is in a niche nobody writes about online. Will this work?",
    answer:
      "Sometimes not, and the report will say so instead of inventing evidence. Genuinely offline niches, such as trades, regional B2B and specialist industrial work, leave a thin public trail. There the community shortlist and question set still help, but confidence will be low and labelled that way.",
  },
  {
    question: "Do you keep or train on my idea?",
    answer:
      "Your ideas are yours. They are not published, not shared with other users, and not used as training data. Every version of your idea is retained for your own history so you can see how it evolved, and you can delete it at any time.",
  },
  {
    question: "What counts as validation, in one sentence?",
    answer:
      "Several people describing the same problem unprompted, already spending money or meaningful effort on a worse solution, and reachable in a place you can name.",
  },
];

export default function HomePage() {
  return (
    <>
      <MobileCta />
      <FaqJsonLd items={FAQ_ITEMS} />

      {/* Sized to land inside one screen: headline, what it does, the box.
          Nothing else competes above the fold, and the worked example starts
          just below it so there is an obvious reason to scroll.

          `svh` rather than `vh` because mobile browsers measure `vh` against
          the viewport with the address bar hidden, which pushes the composer
          under the fold on exactly the devices with least room to spare. */}
      <section className="flex min-h-[calc(100svh-72px)] flex-col justify-center py-14 sm:py-16">
        <Container>
          <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
            {/* Headline and box only. Anything between them is vertical space
                the composer needs to stay on the first screen, and the four
                questions below already say what the product does.

                Set as one line that wraps naturally rather than four forced
                breaks: hard breaks made it a stacked list, which read as four
                separate claims instead of one sequence. `text-balance` keeps
                the wrap even when it does happen, so a narrow window never
                leaves one word stranded on its own line.

                `Validate` carries the accent because it is the stage the
                product covers today. The other three are the arc it sits in,
                and colouring the current one keeps the line honest about that
                without adding a caveat under it. */}
            <h1 className="type-display-2xl mk-rise text-balance text-primary">
              Think. <span className="text-brand">Validate.</span> Build.
              Scale.
            </h1>

            <ul className="mk-rise mk-delay-1 mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5">
              {HIGHLIGHTS.map((highlight) => (
                <li
                  key={highlight}
                  className="type-body-m rounded-full border border-line bg-raised px-4 py-2 text-secondary"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <div className="mk-rise mk-delay-2 mx-auto mt-11 max-w-[880px]">
            <IdeaComposer autoFocus className="text-left" />
            <p className="type-caption mt-5 text-center text-tertiary">
              Free to start. No card. Nothing you type is lost at signup.
            </p>
          </div>
        </Container>
      </section>

      {/* Proof of what comes back, before anyone is asked to sign up. */}
      <section className="mk-section-sm mk-topline">
        <Container>
          <LiveRun />
        </Container>
      </section>

      <Section
        eyebrow="Why this matters"
        title="Ideas rarely fail because the founder could not build it"
        lead="They fail because a confident guess went unchecked for six months. These are the three patterns behind most post-mortems, and all three are knowable before you write code."
      >
        <div className="mk-grid md:grid-cols-3">
          {FAILURE_MODES.map((mode) => (
            <div key={mode.title} className="flex flex-col p-6 lg:p-7">
              <h3 className="type-body-l font-semibold text-pretty text-primary">
                {mode.title}
              </h3>
              <p className="type-body-m mt-3 text-secondary">{mode.body}</p>
              <div className="mt-auto pt-7">
                <p className="type-eyebrow text-tertiary">The tell</p>
                <p className="type-body-m mt-2 text-primary/85">{mode.tell}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <ReportPreview />

      <Section
        id="score"
        eyebrow="The decision gate"
        title="One number, and everything behind it"
        lead="Half of your respondents confirming the problem is the line. Clear it and you get a go-ahead. Miss it and you get a rethink with a diagnosis, never a silent kill."
      >
        <div className="mk-grid mk-grid-raised lg:grid-cols-3">
          {GATE.map((gate) => (
            <div key={gate.verdict} className="p-6 lg:p-8">
              <p className="type-eyebrow text-tertiary">{gate.label}</p>
              <p
                className={cnVerdict(gate.tone)}
              >
                {gate.verdict}
              </p>
              <p className="type-body-m mt-4 text-secondary">{gate.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2.5">
            <WarningIcon size={16} className="text-caution" aria-hidden="true" />
            <h3 className="type-body-m font-semibold text-primary">
              Six things that adjust the score, listed on every report
            </h3>
          </div>
          <div className="mk-grid mk-grid-raised mt-5 md:grid-cols-2 xl:grid-cols-3">
            {SCORE_FACTORS.map((factor) => (
              <div key={factor.title} className="p-6">
                <p className="type-body-m font-medium text-primary">
                  {factor.title}
                </p>
                <p className="type-body-m mt-2 text-secondary">{factor.body}</p>
              </div>
            ))}
          </div>
          <p className="type-body-m mt-6 max-w-[76ch] text-primary/85">
            You can always read every raw response yourself, each one tagged
            confirmed, unsure or no, with its source. The summary never replaces
            access to the underlying data.
          </p>
        </div>
      </Section>

      <Section
        id="evidence"
        eyebrow="The evidence standard"
        title="You should be able to check our work"
        lead="A brief you cannot audit is just a longer opinion. Every claim carries its source, and every weak finding is labelled weak."
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h3 className="type-body-m font-semibold text-primary">
              Where the evidence comes from
            </h3>
            <ul className="mt-5 flex flex-col">
              {EVIDENCE_SOURCES.map((source) => (
                <li
                  key={source.title}
                  className="border-t border-line py-5 first:border-t-0 first:pt-0"
                >
                  <div className="flex gap-3">
                    <CheckIcon
                      size={16}
                      weight="bold"
                      className="mt-1 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="type-body-m font-medium text-primary">
                        {source.title}
                      </p>
                      <p className="type-body-m mt-1.5 text-secondary">
                        {source.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mk-panel p-6 lg:p-8">
            <h3 className="type-body-m font-semibold text-primary">
              What the brief will never do
            </h3>
            <ul className="mt-5 flex flex-col gap-4">
              {NEVER.map((item) => (
                <li
                  key={item}
                  className="type-body-m flex gap-3 text-secondary"
                >
                  <XIcon
                    size={15}
                    weight="bold"
                    className="mt-1 shrink-0 text-caution"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="type-body-m mt-7 border-t border-line pt-6 text-primary/85">
              If the honest answer is that we could not find enough evidence to
              judge your idea, that is what the report says. That result is
              still worth knowing, and it is still free.
            </p>
          </div>
        </div>
      </Section>

      <Section
        id="compare"
        tone="sunken"
        layout="stack"
        eyebrow="Honest comparison"
        title="Why not just ask a chatbot, or your friends"
        lead="Both are free and both feel productive. Neither is accountable to a source, which is exactly the property you need when the decision costs you six months."
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <caption className="sr-only">
              Comparison of asking a general chatbot, asking friends, and using
              BRAINS AI
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="w-1/5 pr-6 pb-4">
                  <span className="sr-only">Dimension</span>
                </th>
                <th
                  scope="col"
                  className="type-body-m w-1/4 pr-6 pb-4 font-medium text-secondary"
                >
                  A general chatbot
                </th>
                <th
                  scope="col"
                  className="type-body-m w-1/4 pr-6 pb-4 font-medium text-secondary"
                >
                  Friends and peers
                </th>
                <th
                  scope="col"
                  className="type-body-m w-[30%] pb-4 font-semibold text-brand"
                >
                  BRAINS AI
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr
                  key={row.dimension}
                  className="border-b border-line align-top last:border-0"
                >
                  <th
                    scope="row"
                    className="type-body-m py-5 pr-6 font-medium text-primary"
                  >
                    {row.dimension}
                  </th>
                  <td className="type-body-m py-5 pr-6 text-secondary">
                    {row.chatbot}
                  </td>
                  <td className="type-body-m py-5 pr-6 text-secondary">
                    {row.friends}
                  </td>
                  <td className="type-body-m py-5 text-primary/90">
                    {row.brains}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="tracks"
        eyebrow="How it runs"
        title="Three ways to get the answer"
        lead="The research is the same in all three. What changes is who finds the people, and whether the scan stops when the score arrives."
      >
        <div className="mk-grid mk-grid-raised lg:grid-cols-3">
          {TRACKS.map((track) => (
            <div key={track.name} className="flex flex-col p-7 lg:p-8">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="type-display-m text-primary">{track.name}</h3>
                <span className="type-caption shrink-0 rounded-full bg-brand-subtle px-3 py-1.5 font-medium text-brand">
                  {track.price}
                </span>
              </div>
              <p className="type-body-m mt-3 font-medium text-primary">
                {track.tagline}
              </p>
              <p className="type-body-m mt-2 text-secondary">{track.body}</p>

              <ul className="mt-7 flex flex-col gap-3 border-t border-line pt-7">
                {track.points.map((point) => (
                  <li
                    key={point}
                    className="type-body-m flex items-start gap-3 text-secondary"
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

              <div className="mt-auto pt-8">
                <Button href={track.cta.href} variant={track.cta.variant}>
                  {track.cta.label}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="faq"
        tone="sunken"
        eyebrow="Questions founders ask"
        title="Before you start"
        lead="The objections we hear most, answered without marketing language."
      >
        <Faq items={FAQ_ITEMS} />
      </Section>

      <section className="mk-section mk-topline">
        <Container>
          <div className="mx-auto max-w-[820px] text-center">
            <h2 className="type-display-hero text-balance text-primary">
              Start with the idea you are least sure about.
            </h2>
            <p className="type-body-xl mx-auto mt-5 max-w-[52ch] text-secondary">
              That is the one worth checking. The research and the full scored
              report cost nothing.
            </p>

            <div className="mk-panel mt-10 p-5 text-left sm:p-6">
              <IdeaComposer />
            </div>

            <p className="type-caption mt-5 text-tertiary">
              Or{" "}
              <a href={signUpUrl} className="text-brand hover:underline">
                create an account
              </a>{" "}
              first. Nothing you type here is lost when you sign up.
            </p>

            <div className="mt-12">
              <Button href="/how-it-works" variant="secondary">
                See how the scoring works
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/** Verdict headline colour, by outcome. */
function cnVerdict(tone: "brand" | "caution" | "plain") {
  const base = "type-display-m mt-4";
  if (tone === "brand") return `${base} text-brand`;
  if (tone === "caution") return `${base} text-caution`;
  return `${base} text-primary`;
}
