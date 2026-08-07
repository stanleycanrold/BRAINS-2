import Link from "next/link";
import {
  ArrowSquareOutIcon,
  CheckIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import type { JourneyRound, PublicJourney } from "@/lib/data/journey";

/**
 * The shared journey, rendered for somebody with no context.
 *
 * Written for the reader the founder sent it to - a co-founder, an advisor,
 * an investor - rather than for the founder. That changes two things. Rounds
 * read newest first, because the current state is what a stranger wants
 * before the history that produced it. And every round leads with what
 * changed and what it concluded, rather than with the machinery.
 *
 * Nothing here is interactive. There is no way to reach the account, the
 * respondents, or any other idea from this page, and that is deliberate
 * rather than incidental: the data layer only ever hands over an allow-listed
 * shape.
 */

const STRENGTH_TONE: Record<string, "success" | "caution" | "danger"> = {
  strong: "success",
  moderate: "caution",
  weak: "danger",
};

export function JourneyView({ journey }: { journey: PublicJourney }) {
  // Newest first. The reader wants where it landed before how it got there.
  const rounds = [...journey.rounds].reverse();

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[900px] items-center justify-between px-5">
          <Logo />
          <span className="type-caption text-tertiary">Shared journey</span>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 py-12 sm:py-16">
        <p className="type-caption text-brand uppercase">
          Validation journey
        </p>
        <h1 className="type-display-l mt-3 text-primary">{journey.title}</h1>
        {journey.summary ? (
          <p className="type-body-l mt-3 max-w-[70ch] text-secondary">
            {journey.summary}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Badge tone="neutral">
            {journey.rounds.length}{" "}
            {journey.rounds.length === 1 ? "round" : "rounds"}
          </Badge>
          <span className="type-caption text-tertiary">
            Started {formatDate(journey.startedAt)}
          </span>
          <span className="type-caption text-tertiary">
            Last updated {formatDate(journey.updatedAt)}
          </span>
        </div>

        {!journey.includesResponses ? (
          <p className="type-caption mt-8 max-w-[70ch] text-tertiary">
            What individual respondents wrote is not included in this shared
            view. The themes, counts and reasoning below are drawn from it.
          </p>
        ) : null}

        <div className="mt-12 space-y-6">
          {rounds.map((round, i) => (
            <Round
              key={round.versionNumber}
              round={round}
              isLatest={i === 0}
              includesResponses={journey.includesResponses}
            />
          ))}
        </div>

        <footer className="mt-16 border-t border-line pt-8">
          <p className="type-body-m text-secondary">
            Researched with{" "}
            <Link href="/" className="text-brand hover:underline">
              BRAINS AI
            </Link>
            . Every claim above is linked to where it was found.
          </p>
        </footer>
      </main>
    </div>
  );
}

function Round({
  round,
  isLatest,
  includesResponses,
}: {
  round: JourneyRound;
  isLatest: boolean;
  includesResponses: boolean;
}) {
  return (
    <Card
      elevation={isLatest ? "raised" : "flat"}
      className={cn("p-6 sm:p-8", isLatest && "border-brand/30")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="type-data-s text-tertiary">
            Round {round.versionNumber}
          </span>
          {isLatest ? <Badge tone="brand">Current</Badge> : null}
        </div>
        <span className="type-caption text-tertiary">
          {formatDate(round.createdAt)}
        </span>
      </div>

      {round.note ? (
        <p className="type-body-m mt-3 text-secondary">{round.note}</p>
      ) : null}

      <h2 className="type-display-m mt-4 text-primary">
        {round.problemStatement || "Problem not yet stated"}
      </h2>
      {round.icp ? (
        <p className="type-body-m mt-2 text-secondary">For {round.icp}</p>
      ) : null}

      {round.changedFromPrevious.length > 0 ? (
        <div className="mt-6 rounded-[8px] border border-line bg-page p-4">
          <p className="type-caption text-tertiary uppercase">
            Changed from the previous round
          </p>
          <ul className="mt-3 space-y-3">
            {round.changedFromPrevious.map((change) => (
              <li key={change.field}>
                <p className="type-caption text-tertiary">{change.field}</p>
                <p className="type-body-m mt-1 text-secondary line-through decoration-tertiary/60">
                  {change.from || "(empty)"}
                </p>
                <p className="type-body-m mt-1 text-primary">{change.to}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {round.score ? (
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <div className="flex items-baseline gap-2">
            <span className="type-data-l text-primary">
              {round.score.value}
            </span>
            <span className="type-body-m text-tertiary">/ 100</span>
          </div>
          <Badge tone={round.score.signal === "go_ahead" ? "success" : "caution"}>
            {round.score.signal === "go_ahead" ? "Go ahead" : "Rethink"}
          </Badge>
          {round.responseCount > 0 ? (
            <span className="type-body-m text-secondary">
              {Math.round(round.confirmationRate * 100)}% of{" "}
              {round.responseCount} confirmed the problem
            </span>
          ) : null}
        </div>
      ) : null}

      {round.score?.reasoning ? (
        <p className="type-body-m mt-4 max-w-[70ch] text-secondary">
          {round.score.reasoning}
        </p>
      ) : null}

      {round.research ? (
        <section className="mt-8 border-t border-line pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="type-caption text-tertiary uppercase">
              What the research found
            </h3>
            <Badge tone={STRENGTH_TONE[round.research.problemStrength] ?? "neutral"}>
              {round.research.problemStrength} signal
            </Badge>
            {round.research.unsourced ? (
              <Badge tone="caution">No live sources available</Badge>
            ) : null}
          </div>

          {round.research.reasoning ? (
            <p className="type-body-m mt-3 max-w-[70ch] text-secondary">
              {round.research.reasoning}
            </p>
          ) : null}

          {round.research.evidence.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {round.research.evidence.map((item) => (
                <li key={item.claim} className="flex items-start gap-3">
                  <CheckIcon
                    size={15}
                    weight="bold"
                    className="mt-1 shrink-0 text-success"
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
          ) : null}

          {round.research.contraryEvidence.length > 0 ? (
            <div className="mt-6">
              <p className="type-caption text-tertiary uppercase">
                The case against
              </p>
              <ul className="mt-3 space-y-2.5">
                {round.research.contraryEvidence.map((item) => (
                  <li key={item.claim} className="flex items-start gap-3">
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
            </div>
          ) : null}

          {round.research.workarounds.length > 0 ? (
            <div className="mt-6">
              <p className="type-caption text-tertiary uppercase">
                What people do instead today
              </p>
              <ul className="mt-3 space-y-2.5">
                {round.research.workarounds.map((item) => (
                  <li key={item.description}>
                    <p className="type-body-m text-primary">
                      {item.description}
                    </p>
                    {item.whyItPersists ? (
                      <p className="type-caption mt-0.5 text-tertiary">
                        {item.whyItPersists}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {round.themes.length > 0 || round.objections.length > 0 ? (
        <section className="mt-8 border-t border-line pt-6">
          <h3 className="type-caption text-tertiary uppercase">
            What people told us
          </h3>
          {round.narrative ? (
            <p className="type-body-m mt-3 max-w-[70ch] text-secondary">
              {round.narrative}
            </p>
          ) : null}

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {round.themes.length > 0 ? (
              <div>
                <p className="type-caption text-tertiary">
                  Patterns that came up repeatedly
                </p>
                <ul className="mt-2.5 space-y-2">
                  {round.themes.map((theme) => (
                    <li key={theme} className="type-body-m text-primary">
                      {theme}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {round.objections.length > 0 ? (
              <div>
                <p className="type-caption text-tertiary">Push-back we heard</p>
                <ul className="mt-2.5 space-y-2">
                  {round.objections.map((objection) => (
                    <li key={objection} className="type-body-m text-primary">
                      {objection}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {includesResponses && round.responses.length > 0 ? (
        <section className="mt-8 border-t border-line pt-6">
          <h3 className="type-caption text-tertiary uppercase">
            What respondents said
          </h3>
          <ul className="mt-4 space-y-3">
            {round.responses.map((response, i) => (
              <li
                key={`${response.confirmed}-${i}`}
                className="flex items-start gap-3"
              >
                <Badge
                  tone={
                    response.confirmed === "yes"
                      ? "success"
                      : response.confirmed === "unsure"
                        ? "caution"
                        : "neutral"
                  }
                  className="shrink-0"
                >
                  {response.confirmed}
                </Badge>
                <p className="type-body-m text-secondary">{response.notes}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {round.score && round.score.riskFactors.length > 0 ? (
        <section className="mt-8 border-t border-line pt-6">
          <h3 className="type-caption text-tertiary uppercase">
            Reasons to hold this loosely
          </h3>
          <ul className="mt-4 space-y-3">
            {round.score.riskFactors.map((risk) => (
              <li key={risk.label} className="flex items-start gap-3">
                <WarningIcon
                  size={15}
                  className={cn(
                    "mt-1 shrink-0",
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
        </section>
      ) : null}
    </Card>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
