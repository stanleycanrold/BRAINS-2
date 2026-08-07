"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowSquareOutIcon,
  CheckIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Disclosure } from "@/components/ui/Disclosure";
import { Logo } from "@/components/brand/Logo";
import { ResponseAnswers } from "@/components/ResponseAnswers";
import { cn } from "@/lib/cn";
import type { JourneyRound, PublicJourney } from "@/lib/data/journey";

/**
 * A shared workspace, read-only.
 *
 * The first version was one long report. Nobody reads a wall, and a client
 * sent a link scrolls once and forms an opinion - so a page that requires
 * reading to the bottom before it makes sense has already lost. This is the
 * same set of screens the founder works in, presented as tabs: a summary that
 * answers the question on its own, and the stages behind it for anyone who
 * wants to check the work.
 *
 * Read-only is enforced by what this component is given, not by a flag. It
 * receives the narrowed `PublicJourney` shape - built field by field in
 * lib/data/journey.ts, with no founder identity, no response source and no
 * expert names - and there is no mutation path in here to disable. A
 * `readOnly` boolean on the founder's own components would have been one
 * forgotten conditional away from publishing somebody else's words.
 *
 * Tabs hold state client-side rather than in the URL, so switching is instant
 * on a page that already has every tab's data. The trade is that a tab cannot
 * be deep-linked, which matters less here than it would in the app: whoever
 * opens this was sent the link, not searching for a section of it.
 */

type TabId = "summary" | "idea" | "research" | "validation" | "verdict" | "history";

/** Matches the labels the founder sees on their own report. */
const DIAGNOSTIC_LABEL: Record<string, string> = {
  wrong_problem_statement: "The problem statement was the issue",
  wrong_audience: "We were asking the wrong people",
  genuinely_weak_problem: "The problem itself is weak",
};

const STRENGTH_TONE: Record<string, "success" | "caution" | "danger"> = {
  strong: "success",
  moderate: "caution",
  weak: "danger",
};

export function SharedWorkspace({ journey }: { journey: PublicJourney }) {
  const [tab, setTab] = React.useState<TabId>("summary");

  // The latest round that actually got somewhere. A freshly opened round has
  // no research and no responses, so reading the tabs off the last round would
  // show a live idea as empty.
  const scored = [...journey.rounds].reverse().find((r) => r.score !== null);
  const researched =
    [...journey.rounds].reverse().find((r) => r.research !== null) ?? null;
  const validated =
    [...journey.rounds].reverse().find((r) => r.responseCount > 0) ?? null;
  const latest = journey.rounds[journey.rounds.length - 1];

  const tabs: { id: TabId; label: string; available: boolean }[] = [
    { id: "summary", label: "Summary", available: true },
    { id: "idea", label: "The idea", available: true },
    { id: "research", label: "Research", available: Boolean(researched) },
    { id: "validation", label: "Validation", available: Boolean(validated) },
    { id: "verdict", label: "Verdict", available: Boolean(scored) },
    {
      id: "history",
      label: "History",
      available: journey.rounds.length > 1,
    },
  ];

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1000px] items-center justify-between px-5">
          <Logo />
          <span className="type-caption text-tertiary">
            Shared, read-only
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1000px] px-5 pt-10">
        <p className="type-caption text-brand uppercase">Validation workspace</p>
        <h1 className="type-display-l mt-3 text-primary">{journey.title}</h1>
        {journey.summary ? (
          <p className="type-body-l mt-2 max-w-[70ch] text-secondary">
            {journey.summary}
          </p>
        ) : null}

        <div
          role="tablist"
          aria-label="Workspace sections"
          className="mt-8 flex gap-1 overflow-x-auto border-b border-line"
        >
          {tabs
            .filter((t) => t.available)
            .map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "type-body-m -mb-px shrink-0 border-b-2 px-4 py-3 transition-colors duration-[120ms]",
                  tab === t.id
                    ? "border-brand font-medium text-primary"
                    : "border-transparent text-secondary hover:text-primary",
                )}
              >
                {t.label}
              </button>
            ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1000px] px-5 py-10 pb-20">
        {tab === "summary" ? (
          <SummaryTab journey={journey} onNavigate={setTab} />
        ) : null}
        {tab === "idea" ? <IdeaTab round={latest} /> : null}
        {tab === "research" && researched ? (
          <ResearchTab round={researched} />
        ) : null}
        {tab === "validation" && validated ? (
          <ValidationTab round={validated} journey={journey} />
        ) : null}
        {tab === "verdict" && scored ? <VerdictTab round={scored} /> : null}
        {tab === "history" ? <HistoryTab journey={journey} /> : null}

        <footer className="mt-16 border-t border-line pt-8">
          <p className="type-body-m text-secondary">
            Researched with{" "}
            <Link href="/" className="text-brand hover:underline">
              BRAINS AI
            </Link>
            . Every claim links to where it was found.
          </p>
          {!journey.includesResponses ? (
            <p className="type-caption mt-2 text-tertiary">
              Individual responses are not included in this shared view.
            </p>
          ) : null}
        </footer>
      </main>
    </div>
  );
}

/* ── Summary ─────────────────────────────────────────────────────────────
   Answers the question on its own. Somebody who reads only this tab should
   leave knowing the verdict, how strongly it is held, and what is unresolved. */

function SummaryTab({
  journey,
  onNavigate,
}: {
  journey: PublicJourney;
  onNavigate: (tab: TabId) => void;
}) {
  const { headline } = journey;
  const isGo = headline.signal === "go_ahead";

  return (
    <div className="space-y-10">
      {headline.signal ? (
        <Card elevation="raised" className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
            <div className="shrink-0">
              <div className="flex items-baseline gap-2">
                <span className="type-data-l text-primary">
                  {headline.score}
                </span>
                <span className="type-body-m text-tertiary">/ 100</span>
              </div>
              <div
                role="img"
                aria-label={`Score ${headline.score} out of 100`}
                className="mt-3 h-1.5 w-full min-w-[160px] overflow-hidden rounded-full bg-inset"
              >
                <div
                  className={cn(
                    "h-full rounded-full",
                    isGo ? "bg-success" : "bg-caution",
                  )}
                  style={{ width: `${headline.score ?? 0}%` }}
                />
              </div>
              <div className="mt-4">
                <Badge tone={isGo ? "success" : "caution"} dot>
                  {isGo ? "Go ahead" : "Rethink"}
                </Badge>
              </div>
            </div>

            <div className="min-w-0">
              <p className="type-body-l text-primary">
                <span className="font-medium">
                  {Math.round(headline.confirmationRate * 100)}%
                </span>{" "}
                of {headline.totalResponses}{" "}
                {headline.totalResponses === 1 ? "person" : "people"} confirmed
                they have this problem.
              </p>
              {headline.verdict ? (
                <p className="type-body-m mt-3 text-secondary">
                  {headline.verdict}
                </p>
              ) : null}
              <button
                onClick={() => onNavigate("verdict")}
                className="type-body-m mt-4 font-medium text-brand hover:underline"
              >
                See the full verdict
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <p className="type-body-l text-secondary">
            This idea is still being validated. There is no scored verdict yet.
          </p>
        </Card>
      )}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-line bg-line sm:grid-cols-4">
        <Stat label="People asked" value={String(headline.totalResponses)} />
        <Stat label="Sources read" value={String(headline.totalSources)} />
        <Stat label="Rounds run" value={String(headline.roundCount)} />
        <Stat
          label="Period"
          value={`${formatShort(journey.startedAt)} – ${formatShort(journey.updatedAt)}`}
        />
      </dl>

      {headline.keyFindings.length > 0 || headline.openConcerns.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2">
          {headline.keyFindings.length > 0 ? (
            <div>
              <p className="type-caption text-tertiary uppercase">
                Came up repeatedly
              </p>
              <ul className="mt-3 space-y-2.5">
                {headline.keyFindings.map((finding) => (
                  <li key={finding} className="flex items-start gap-2.5">
                    <CheckIcon
                      size={15}
                      weight="bold"
                      className="mt-1 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span className="type-body-m text-primary">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {headline.openConcerns.length > 0 ? (
            <div>
              <p className="type-caption text-tertiary uppercase">Still open</p>
              <ul className="mt-3 space-y-2.5">
                {headline.openConcerns.map((concern) => (
                  <li key={concern} className="flex items-start gap-2.5">
                    <WarningIcon
                      size={15}
                      className="mt-1 shrink-0 text-caution"
                      aria-hidden="true"
                    />
                    <span className="type-body-m text-primary">{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ── The idea ──────────────────────────────────────────────────────────── */

function IdeaTab({ round }: { round: JourneyRound }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="type-caption text-tertiary uppercase">In their words</p>
        <p className="type-body-l mt-3 whitespace-pre-wrap text-primary">
          {round.description || "No description recorded."}
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="type-caption text-tertiary uppercase">Who it is for</p>
          <p className="type-body-m mt-2 text-primary">
            {round.icp || round.targetAudience || "Not specified"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="type-caption text-tertiary uppercase">Market</p>
          <p className="type-body-m mt-2 text-primary">
            {round.locationFocus || "Anywhere"}
          </p>
        </Card>
      </div>

      {round.problemStatement ? (
        <Card className="p-6">
          <p className="type-caption text-tertiary uppercase">
            The problem, as we understood it
          </p>
          <p className="type-body-l mt-3 text-primary">
            {round.problemStatement}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

/* ── Research ──────────────────────────────────────────────────────────── */

function ResearchTab({ round }: { round: JourneyRound }) {
  const research = round.research!;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={STRENGTH_TONE[research.problemStrength] ?? "neutral"}>
          {research.problemStrength} signal
        </Badge>
        {research.unsourced ? (
          <Badge tone="caution">No live sources available</Badge>
        ) : null}
      </div>

      {research.reasoning ? (
        <p className="type-body-l max-w-[70ch] text-secondary">
          {research.reasoning}
        </p>
      ) : null}

      {research.evidence.length > 0 ? (
        <section>
          <h2 className="type-body-l font-medium text-primary">
            What the evidence says
          </h2>
          <ul className="mt-4 space-y-4">
            {research.evidence.map((item) => (
              <li key={item.claim} className="flex items-start gap-3">
                <CheckIcon
                  size={15}
                  weight="bold"
                  className="mt-1.5 shrink-0 text-success"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="type-body-m text-primary">{item.claim}</p>
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="type-caption mt-1 inline-flex items-center gap-1.5 text-brand hover:underline"
                    >
                      {item.sourceTitle || item.sourceUrl}
                      <ArrowSquareOutIcon size={11} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {research.workarounds.length > 0 ? (
        <section>
          <h2 className="type-body-l font-medium text-primary">
            What people do instead today
          </h2>
          <ul className="mt-4 space-y-3">
            {research.workarounds.map((item) => (
              <li key={item.description}>
                <p className="type-body-m text-primary">{item.description}</p>
                {item.whyItPersists ? (
                  <p className="type-caption mt-0.5 text-tertiary">
                    {item.whyItPersists}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {research.competitors.length > 0 ? (
        <Disclosure
          title="Who already solves this"
          count={research.competitors.length}
          summary="The products in this space, and what each leaves open"
          storageKey="shared-research-competitors"
          defaultOpen
        >
          <ul className="space-y-3">
            {research.competitors.map((competitor) => (
              <li
                key={competitor.name}
                className="rounded-[8px] border border-line p-4"
              >
                <p className="type-body-m font-medium text-primary">
                  {competitor.name}
                </p>
                <p className="type-body-m mt-1.5 text-secondary">
                  {competitor.summary}
                </p>
                {competitor.sourceUrl ? (
                  <a
                    href={competitor.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="type-caption mt-2 inline-flex items-center gap-1.5 text-brand hover:underline"
                  >
                    {competitor.sourceUrl}
                    <ArrowSquareOutIcon size={11} aria-hidden="true" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      {research.openQuestions.length > 0 ? (
        <Disclosure
          title="What desk research could not settle"
          count={research.openQuestions.length}
          summary="The gaps that decided what people were asked"
          storageKey="shared-research-open"
        >
          <ul className="space-y-2.5">
            {research.openQuestions.map((question) => (
              <li key={question} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-tertiary"
                />
                <span className="type-body-m text-primary">{question}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      {research.proposedChanges.length > 0 ? (
        <Disclosure
          title="What the engine proposed changing"
          count={research.proposedChanges.length}
          summary="Sharper framings drawn from the research, and what was done with each"
          storageKey="shared-research-proposals"
          defaultOpen
        >
          <ul className="space-y-4">
            {research.proposedChanges.map((proposal) => (
              <li
                key={proposal.text}
                className="rounded-[8px] border border-line p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="type-body-m min-w-0 font-medium text-primary">
                    {proposal.text}
                  </p>
                  <ProposalStatus status={proposal.status} />
                </div>
                {proposal.reasoning ? (
                  <p className="type-body-m mt-2 text-secondary">
                    {proposal.reasoning}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      {research.contraryEvidence.length > 0 ? (
        <section>
          <h2 className="type-body-l font-medium text-primary">
            The case against
          </h2>
          <ul className="mt-4 space-y-3">
            {research.contraryEvidence.map((item) => (
              <li key={item.claim} className="flex items-start gap-2.5">
                <XIcon
                  size={15}
                  weight="bold"
                  className="mt-1 shrink-0 text-caution"
                  aria-hidden="true"
                />
                <p className="type-body-m text-secondary">{item.claim}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/* ── Validation ────────────────────────────────────────────────────────── */

function ValidationTab({
  round,
  journey,
}: {
  round: JourneyRound;
  journey: PublicJourney;
}) {
  /**
   * Every response, unfiltered and uncapped.
   *
   * This used to drop notes under 40 characters and then cut the list at
   * eight. Both were wrong. The cap silently hid responses from a founder who
   * knew exactly how many they had collected, and the length filter is a
   * quiet bias: a dismissive answer is short, so filtering by length removes
   * disproportionately many of the people who said no. Deciding what counts
   * is the screening agent's job, in the open, not a display rule.
   */
  const quotes = journey.includesResponses ? round.responses : [];

  const tally = round.responses.reduce<Record<string, number>>((acc, r) => {
    acc[r.confirmed] = (acc[r.confirmed] ?? 0) + 1;
    return acc;
  }, {});

  return (
    /**
     * Grouped into four numbered sections rather than run as one sequence.
     * Flat, a reader could not tell where the results ended and the method
     * began - the quotes and the question list looked like the same kind of
     * thing. These are the four questions a sceptic asks in order: what came
     * back, what did they say, who did you ask, and what did you ask them.
     */
    <div className="space-y-3">
      <Disclosure
        title="What came back"
        summary={`${round.responseCount} responses, ${Math.round(round.confirmationRate * 100)}% confirmed the problem`}
        storageKey="shared-validation-results"
        defaultOpen
      >
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-line bg-line sm:grid-cols-5">
          <Stat label="Responses" value={String(round.responseCount)} />
          <Stat
            label="Confirmed"
            value={`${Math.round(round.confirmationRate * 100)}%`}
          />
          {/* The split is spelled out so a reader can add it up. A summary
              that does not reconcile with the total reads as selective. */}
          <Stat label="Said yes" value={String(tally.yes ?? 0)} />
          <Stat label="Said no" value={String(tally.no ?? 0)} />
          <Stat label="Unsure" value={String(tally.unsure ?? 0)} />
        </dl>

        {round.narrative ? (
          <p className="type-body-l mt-5 max-w-[70ch] text-secondary">
            {round.narrative}
          </p>
        ) : null}

        {round.notablePoints.length > 0 ? (
          <div className="mt-6 rounded-[8px] border border-line p-4">
            <p className="type-caption text-tertiary uppercase">
              Worth your attention
            </p>
            <ul className="mt-3 space-y-2.5">
              {round.notablePoints.map((point) => (
                <li key={point} className="type-body-m text-primary">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {round.themes.length > 0 || round.objections.length > 0 ? (
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {round.themes.length > 0 ? (
              <div>
                <p className="type-caption text-tertiary uppercase">
                  Came up repeatedly
                </p>
                <ul className="mt-3 space-y-2.5">
                  {round.themes.map((theme) => (
                    <li key={theme} className="flex items-start gap-2.5">
                      <CheckIcon
                        size={15}
                        weight="bold"
                        className="mt-1 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <span className="type-body-m text-primary">{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {round.objections.length > 0 ? (
              <div>
                <p className="type-caption text-tertiary uppercase">
                  Push-back we heard
                </p>
                <ul className="mt-3 space-y-2.5">
                  {round.objections.map((objection) => (
                    <li key={objection} className="flex items-start gap-2.5">
                      <WarningIcon
                        size={15}
                        className="mt-1 shrink-0 text-caution"
                        aria-hidden="true"
                      />
                      <span className="type-body-m text-primary">
                        {objection}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Disclosure>

      {quotes.length > 0 ? (
        <Disclosure
          title="In their words"
          count={quotes.length}
          summary="Every response, filterable by what they said"
          storageKey="shared-validation-quotes"
        >
          <ResponseTable responses={quotes} />
        </Disclosure>
      ) : null}

      {round.communities.length > 0 ? (
        <Disclosure
          title="Who we asked"
          count={round.communities.length}
          summary="How the respondents were reached, and where they gather"
          storageKey="shared-validation-communities"
        >
          {/* Named explicitly, because "who asked" is the part of the service a
              client is actually buying. A count of communities does not say
              whether the founder chased these people themselves or whether we
              sourced, screened and interviewed them. */}
          {round.responsesByTrack.managed > 0 ? (
            <div className="mb-5 rounded-[8px] border border-brand/30 bg-brand-subtle p-4">
              <p className="type-body-m font-medium text-primary">
                {round.responsesByTrack.managed} of {round.responseCount}{" "}
                {round.responsesByTrack.managed === 1
                  ? "respondent was"
                  : "respondents were"}{" "}
                sourced and interviewed by the BRAINS team
              </p>
              <p className="type-body-m mt-1 text-secondary">
                Fast Track: we find people matching the audience the research
                identified, run the conversations, and screen every answer
                before it counts.
                {round.responsesByTrack.selfServe > 0
                  ? ` The remaining ${round.responsesByTrack.selfServe} came from the founder's own outreach.`
                  : ""}
              </p>
            </div>
          ) : (
            <div className="mb-5 rounded-[8px] border border-line p-4">
              <p className="type-body-m font-medium text-primary">
                All {round.responseCount} responses came from the
                founder&rsquo;s own outreach
              </p>
              <p className="type-body-m mt-1 text-secondary">
                On Fast Track, the BRAINS team sources respondents matching the
                audience, runs the interviews, and screens every answer.
              </p>
            </div>
          )}

          <ul className="divide-y divide-line rounded-[8px] border border-line">
            {round.communities.map((community) => (
              <li key={community.name} className="p-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="type-body-m font-medium text-primary">
                    {community.name}
                  </span>
                  {community.platform ? (
                    <Badge tone="neutral">{community.platform}</Badge>
                  ) : null}
                </div>
                {community.whyRelevant ? (
                  <p className="type-caption mt-1.5 text-tertiary">
                    {community.whyRelevant}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      {round.questions.length > 0 ? (
        <Disclosure
          title="What we asked them"
          count={round.questions.length}
          summary="Non-leading questions, written from the research"
          storageKey="shared-validation-questions"
        >
          <ol className="space-y-3">
            {round.questions.map((question, i) => (
              <li key={question} className="flex gap-4">
                <span className="type-data-s shrink-0 text-tertiary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="type-body-m text-primary">{question}</span>
              </li>
            ))}
          </ol>
        </Disclosure>
      ) : null}
    </div>
  );
}

/* ── Verdict ───────────────────────────────────────────────────────────── */

function VerdictTab({ round }: { round: JourneyRound }) {
  const score = round.score!;
  const isGo = score.signal === "go_ahead";

  return (
    <div className="space-y-3">
      <Card elevation="raised" className="p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="type-data-l text-primary">{score.value}</span>
          <span className="type-body-m text-tertiary">/ 100</span>
          <Badge tone={isGo ? "success" : "caution"} dot>
            {isGo ? "Go ahead" : "Rethink"}
          </Badge>
        </div>
        <div
          role="img"
          aria-label={`Score ${score.value} out of 100`}
          className="mt-5 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-inset"
        >
          <div
            className={cn(
              "h-full rounded-full",
              isGo ? "bg-success" : "bg-caution",
            )}
            style={{ width: `${score.value}%` }}
          />
        </div>
        <p className="type-body-m mt-5 max-w-[70ch] text-secondary">
          {Math.round(round.confirmationRate * 100)}% of {round.responseCount}{" "}
          people confirmed the problem. Half confirming is the line.
        </p>
      </Card>

      {score.reasoning ? (
        <Disclosure
          title="How we got to that number"
          summary="The reasoning behind the score"
          storageKey="shared-verdict-reasoning"
          defaultOpen
        >
          <p className="type-body-m max-w-[70ch] text-secondary">
            {score.reasoning}
          </p>
        </Disclosure>
      ) : null}

      {score.diagnostic ? (
        <div className="rounded-[8px] border border-caution/40 bg-caution-subtle p-5">
          <p className="type-caption text-tertiary uppercase">
            What went wrong
          </p>
          <p className="type-body-l mt-2 font-medium text-primary">
            {DIAGNOSTIC_LABEL[score.diagnostic.verdict] ??
              score.diagnostic.verdict}
          </p>
          {score.diagnostic.explanation ? (
            <p className="type-body-m mt-2 max-w-[70ch] text-secondary">
              {score.diagnostic.explanation}
            </p>
          ) : null}
        </div>
      ) : null}

      {score.improvements.length > 0 ? (
        <Disclosure
          title="What the engine recommends next"
          count={score.improvements.length}
          summary="Specific changes drawn from the responses, not generic advice"
          storageKey="shared-verdict-improvements"
          defaultOpen
        >
          <ul className="space-y-4">
            {score.improvements.map((item) => (
              <li
                key={item.text}
                className="rounded-[8px] border border-line p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="type-body-m min-w-0 font-medium text-primary">
                    {item.text}
                  </p>
                  <ProposalStatus status={item.status} />
                </div>
                {item.reasoning ? (
                  <p className="type-body-m mt-2 text-secondary">
                    {item.reasoning}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      {score.riskFactors.length > 0 ? (
        <Disclosure
          title="Reasons to hold this loosely"
          count={score.riskFactors.length}
          summary="What weakens this score, named"
          storageKey="shared-verdict-risks"
        >
          <ul className="space-y-3">
            {score.riskFactors.map((risk) => (
              <li
                key={risk.label}
                className={cn(
                  "flex items-start gap-3 rounded-[8px] border p-4",
                  risk.severity === "high"
                    ? "border-danger-border bg-danger-subtle"
                    : "border-line",
                )}
              >
                <WarningIcon
                  size={16}
                  className={cn(
                    "mt-0.5 shrink-0",
                    risk.severity === "high" ? "text-danger" : "text-caution",
                  )}
                  aria-hidden="true"
                />
                <div>
                  <p className="type-body-m font-medium text-primary">
                    {risk.label}
                  </p>
                  <p className="type-body-m mt-0.5 text-secondary">
                    {risk.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}
    </div>
  );
}

/* ── History ───────────────────────────────────────────────────────────── */

function HistoryTab({ journey }: { journey: PublicJourney }) {
  return (
    <div>
      <p className="type-body-m max-w-[70ch] text-secondary">
        Every round is kept. Nothing here was rewritten after the fact.
      </p>

      <ol className="mt-6">
        {journey.rounds.map((round, i) => (
          <li
            key={round.versionNumber}
            className={cn("border-line py-5", i > 0 && "border-t")}
          >
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="type-data-s text-tertiary">
                Round {round.versionNumber}
              </span>
              {round.score ? (
                <Badge
                  tone={round.score.signal === "go_ahead" ? "success" : "caution"}
                >
                  {round.score.value} / 100
                </Badge>
              ) : (
                <Badge tone="neutral">No verdict</Badge>
              )}
              <span className="type-caption text-tertiary">
                {formatShort(round.createdAt)}
              </span>
            </div>

            <p className="type-body-m mt-2 text-primary">
              {round.problemStatement || round.note || "Round opened"}
            </p>

            {round.changedFromPrevious.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {round.changedFromPrevious.map((change) => (
                  <li key={change.field} className="type-caption">
                    <span className="text-tertiary">{change.field}: </span>
                    <span className="text-secondary line-through decoration-tertiary/60">
                      {change.from || "(empty)"}
                    </span>
                    <span className="text-tertiary"> → </span>
                    <span className="text-primary">{change.to}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Responses as a filterable table rather than a stack of quote cards.
 *
 * Eleven cards in a column is a scroll, not a finding: a reader cannot see the
 * shape of the feedback, and picking out the people who said no means reading
 * all of it. Segmenting by verdict answers the question a sceptic actually
 * has - "what did the ones who disagreed say?" - in one click, and the counts
 * on each control double as the breakdown.
 *
 * Colour is never the only signal. Each row carries the verdict in words as
 * well as a tinted edge, so the table survives being read by somebody who
 * cannot distinguish the tints, or printed in black and white.
 */
function ResponseTable({
  responses,
}: {
  responses: { confirmed: string; notes: string }[];
}) {
  const [filter, setFilter] = React.useState<"all" | "yes" | "unsure" | "no">(
    "all",
  );

  const counts = {
    all: responses.length,
    yes: responses.filter((r) => r.confirmed === "yes").length,
    unsure: responses.filter((r) => r.confirmed === "unsure").length,
    no: responses.filter((r) => r.confirmed === "no").length,
  };

  const segments = [
    { id: "all" as const, label: "All" },
    { id: "yes" as const, label: "Confirmed" },
    { id: "unsure" as const, label: "Unsure" },
    { id: "no" as const, label: "Did not confirm" },
  ].filter((segment) => segment.id === "all" || counts[segment.id] > 0);

  const visible =
    filter === "all"
      ? responses
      : responses.filter((r) => r.confirmed === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => setFilter(segment.id)}
            aria-pressed={filter === segment.id}
            className={cn(
              "type-body-m inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5",
              "transition-colors duration-[120ms]",
              filter === segment.id
                ? "border-brand bg-brand-subtle text-brand"
                : "border-line text-secondary hover:border-line-strong hover:text-primary",
            )}
          >
            {segment.label}
            <span className="type-data-s opacity-70">
              {counts[segment.id]}
            </span>
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {visible.map((response, i) => (
          <li
            key={`${response.confirmed}-${i}`}
            className={cn(
              "rounded-[8px] border border-l-[3px] border-line bg-raised p-4",
              response.confirmed === "yes" && "border-l-success",
              response.confirmed === "unsure" && "border-l-caution",
              response.confirmed === "no" && "border-l-danger",
            )}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                tone={
                  response.confirmed === "yes"
                    ? "success"
                    : response.confirmed === "unsure"
                      ? "caution"
                      : "danger"
                }
                dot
              >
                {response.confirmed === "yes"
                  ? "Confirmed the problem"
                  : response.confirmed === "unsure"
                    ? "Unsure"
                    : "Did not confirm"}
              </Badge>
              <span className="type-caption text-tertiary">
                Respondent {i + 1}
              </span>
            </div>
            <ResponseAnswers notes={response.notes} className="mt-4" />
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="type-body-m mt-5 text-tertiary">
          Nobody answered that way.
        </p>
      ) : null}
    </div>
  );
}

/** What the founder did with an engine suggestion. */
function ProposalStatus({ status }: { status: string }) {
  if (status === "accepted" || status === "edited") {
    return (
      <Badge tone="success" className="shrink-0">
        {status === "edited" ? "Accepted, edited" : "Accepted"}
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge tone="neutral" className="shrink-0">
        Declined
      </Badge>
    );
  }
  return (
    <Badge tone="caution" className="shrink-0">
      Open
    </Badge>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-page p-4">
      <dt className="type-caption text-tertiary uppercase">{label}</dt>
      <dd className="type-body-l mt-1 font-medium text-primary">{value}</dd>
    </div>
  );
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
