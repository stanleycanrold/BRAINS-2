import Link from "next/link";
import {
  ArrowSquareOutIcon,
  CheckIcon,
  QuotesIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import type { JourneyRound, PublicJourney } from "@/lib/data/journey";

/**
 * The shared journey, written for somebody deciding whether to care.
 *
 * The first version opened with a title, a round count and two dates, then
 * listed rounds newest-first as a stack of equal cards. That is a log. A
 * reader who was sent this - a co-founder, an advisor, a client - had to
 * assemble the verdict themselves from a chronology, and the score sat
 * halfway down inside the first card.
 *
 * Restructured on the standard research-report shape: bottom line up front,
 * then how we know, then the evidence, then the history. Somebody who reads
 * only the first screen should come away with the conclusion and the strength
 * of it. Everything below exists to let a sceptical reader check that
 * conclusion rather than to walk them to it.
 *
 * The round-by-round history moved to the end and lost its card chrome. It is
 * genuinely interesting to a co-founder and mostly noise to a client, which
 * is exactly what "supporting material, at the bottom" is for.
 */

const STRENGTH_TONE: Record<string, "success" | "caution" | "danger"> = {
  strong: "success",
  moderate: "caution",
  weak: "danger",
};

export function JourneyView({ journey }: { journey: PublicJourney }) {
  const { headline } = journey;
  const isGo = headline.signal === "go_ahead";

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[820px] items-center justify-between px-5">
          <Logo />
          <span className="type-caption text-tertiary">Validation report</span>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-5 py-12 sm:py-16">
        {/* ── Bottom line up front ─────────────────────────────────────── */}
        <p className="type-caption text-brand uppercase">
          Validation report
        </p>
        <h1 className="type-display-l mt-3 text-primary">{journey.title}</h1>
        {journey.summary ? (
          <p className="type-body-l mt-3 max-w-[68ch] text-secondary">
            {journey.summary}
          </p>
        ) : null}

        {headline.signal ? (
          <Card elevation="raised" className="mt-8 p-6 sm:p-8">
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
                  {headline.totalResponses === 1 ? "person" : "people"} we spoke
                  to confirmed they have this problem.
                </p>
                {headline.verdict ? (
                  <p className="type-body-m mt-3 text-secondary">
                    {headline.verdict}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="mt-8 p-6">
            <p className="type-body-l text-secondary">
              This idea is still being validated. There is no scored verdict
              yet, and what follows is the work so far.
            </p>
          </Card>
        )}

        {/* ── How we know ──────────────────────────────────────────────── */}
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-line bg-line sm:grid-cols-4">
          <Stat label="People asked" value={String(headline.totalResponses)} />
          <Stat label="Sources read" value={String(headline.totalSources)} />
          <Stat label="Rounds run" value={String(headline.roundCount)} />
          <Stat
            label="Period"
            value={`${formatShort(journey.startedAt)} – ${formatShort(journey.updatedAt)}`}
          />
        </dl>

        {/* ── What we found ────────────────────────────────────────────── */}
        {headline.keyFindings.length > 0 || headline.openConcerns.length > 0 ? (
          <section className="mt-14" aria-labelledby="findings-heading">
            <h2 id="findings-heading" className="type-display-m text-primary">
              What we found
            </h2>

            <div className="mt-5 grid gap-8 sm:grid-cols-2">
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
                        <span className="type-body-m text-primary">
                          {finding}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {headline.openConcerns.length > 0 ? (
                <div>
                  <p className="type-caption text-tertiary uppercase">
                    Still open
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {headline.openConcerns.map((concern) => (
                      <li key={concern} className="flex items-start gap-2.5">
                        <WarningIcon
                          size={15}
                          className="mt-1 shrink-0 text-caution"
                          aria-hidden="true"
                        />
                        <span className="type-body-m text-primary">
                          {concern}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── The evidence, from the most recent round that has any ────── */}
        <Evidence journey={journey} />

        {/* ── History, last, because it is supporting material ─────────── */}
        {journey.rounds.length > 1 ? (
          <section className="mt-14" aria-labelledby="history-heading">
            <h2 id="history-heading" className="type-display-m text-primary">
              How the idea changed
            </h2>
            <p className="type-body-m mt-1 text-secondary">
              Every round is kept. Nothing here was rewritten after the fact.
            </p>

            <ol className="mt-6 space-y-0">
              {journey.rounds.map((round, i) => (
                <li
                  key={round.versionNumber}
                  className={cn(
                    "border-line py-5",
                    i > 0 && "border-t",
                  )}
                >
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="type-data-s text-tertiary">
                      Round {round.versionNumber}
                    </span>
                    {round.score ? (
                      <Badge
                        tone={
                          round.score.signal === "go_ahead"
                            ? "success"
                            : "caution"
                        }
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
                          <span className="text-tertiary">
                            {change.field}:{" "}
                          </span>
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
          </section>
        ) : null}

        <footer className="mt-16 border-t border-line pt-8">
          <p className="type-body-m text-secondary">
            Researched with{" "}
            <Link href="/" className="text-brand hover:underline">
              BRAINS AI
            </Link>
            . Every claim above links to where it was found.
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-page p-4">
      <dt className="type-caption text-tertiary uppercase">{label}</dt>
      <dd className="type-body-l mt-1 font-medium text-primary">{value}</dd>
    </div>
  );
}

/**
 * The evidence behind the verdict, drawn from the most recent round that
 * actually gathered any. Showing every round's evidence in full turned the
 * page into the log it was trying to stop being.
 */
function Evidence({ journey }: { journey: PublicJourney }) {
  const round =
    [...journey.rounds].reverse().find((r) => r.research !== null) ?? null;
  if (!round?.research) return null;

  const { research } = round;
  const responses = pickResponses(journey);

  return (
    <>
      <section className="mt-14" aria-labelledby="evidence-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="evidence-heading" className="type-display-m text-primary">
            The evidence
          </h2>
          <Badge tone={STRENGTH_TONE[research.problemStrength] ?? "neutral"}>
            {research.problemStrength} signal
          </Badge>
          {research.unsourced ? (
            <Badge tone="caution">No live sources available</Badge>
          ) : null}
        </div>

        {research.reasoning ? (
          <p className="type-body-l mt-3 max-w-[68ch] text-secondary">
            {research.reasoning}
          </p>
        ) : null}

        {research.evidence.length > 0 ? (
          <ul className="mt-6 space-y-4">
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
        ) : null}

        {research.workarounds.length > 0 ? (
          <div className="mt-8">
            <p className="type-caption text-tertiary uppercase">
              What people do instead today
            </p>
            <ul className="mt-3 space-y-2.5">
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
          </div>
        ) : null}

        {research.contraryEvidence.length > 0 ? (
          <div className="mt-8">
            <p className="type-caption text-tertiary uppercase">
              The case against
            </p>
            <ul className="mt-3 space-y-2.5">
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
          </div>
        ) : null}
      </section>

      {responses.length > 0 ? (
        <section className="mt-14" aria-labelledby="voices-heading">
          <h2 id="voices-heading" className="type-display-m text-primary">
            In their words
          </h2>
          <div className="mt-5 space-y-3">
            {responses.map((response, i) => (
              <Card key={`${response.confirmed}-${i}`} className="p-5">
                <QuotesIcon
                  size={15}
                  weight="fill"
                  className="text-brand"
                  aria-hidden="true"
                />
                <blockquote className="type-body-m mt-3 text-primary">
                  {response.notes}
                </blockquote>
                <Badge
                  tone={
                    response.confirmed === "yes"
                      ? "success"
                      : response.confirmed === "unsure"
                        ? "caution"
                        : "neutral"
                  }
                  className="mt-4"
                >
                  {response.confirmed === "yes"
                    ? "Confirmed the problem"
                    : response.confirmed === "unsure"
                      ? "Unsure"
                      : "Did not confirm"}
                </Badge>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

/**
 * Up to six quotes with something in them, from the most recent round that
 * gathered any. A one-word answer is a data point but not a quote, and
 * padding this section with them makes the evidence look thinner than it is.
 */
function pickResponses(journey: PublicJourney): JourneyRound["responses"] {
  if (!journey.includesResponses) return [];
  const round = [...journey.rounds]
    .reverse()
    .find((r) => r.responses.length > 0);
  return (round?.responses ?? [])
    .filter((r) => r.notes.trim().length > 40)
    .slice(0, 6);
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
