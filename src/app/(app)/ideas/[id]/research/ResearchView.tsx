"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowSquareOutIcon,
  WarningIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Disclosure } from "@/components/ui/Disclosure";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { NarrativeProgress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/EmptyState";
import { ProposalCard } from "@/components/ProposalCard";
import { UnderstandingCard } from "@/components/UnderstandingCard";
import { useToast } from "@/components/ui/Toast";
import { TopBar } from "@/components/shell/AppShell";
import { PipelineStepper } from "@/components/shell/PipelineStepper";
import type { IdeaState, ProblemStrength } from "@/lib/domain/types";
import { SIGNALS } from "@shared/signals";
import { RESEARCH_STEPS } from "@shared/research-steps";

/**
 * B3 - Research Report (design system §4.3).
 *
 * Reading order follows the founder's actual questions, in order:
 *   1. Is this problem real?            → the verdict, leading the page
 *   2. Did you understand my idea?      → a collapsed, correctable strip
 *   3. What makes you say that?         → sourced evidence, domain first
 *   4. Am I too late?                   → what already exists
 *   5. So what should I change?         → proposals
 *
 * The verdict leads deliberately. An earlier pass put the restated idea first
 * - correctness before findings - but that buried the one thing the founder
 * opened the page for. The restatement is still one click away, and still
 * editable, which is what it actually needs to be.
 *
 * Section headings are written as the question each one answers, rather than
 * as report-speak ("Competitive landscape"), because a founder scanning this
 * page is looking for answers, not chapter titles.
 */

/**
 * The wording now lives in `shared/signals.ts`, which the marketing site
 * imports too. It had been copied into both, and the failure that causes is
 * specific: a visitor reads one phrasing before signing up and a different
 * one after, and concludes that one of the two was marketing.
 *
 * The labels describe what research actually measured - how much a problem is
 * publicly discussed - rather than grading the idea. That is a more precise
 * claim than "Weak signal", not a gentler one: desk research genuinely cannot
 * see problems people do not post about, and the real verdict belongs to the
 * decision gate, on evidence from people.
 */
const STRENGTH_TONE: Record<ProblemStrength, BadgeTone> = {
  weak: SIGNALS.weak.tone,
  moderate: SIGNALS.moderate.tone,
  strong: SIGNALS.strong.tone,
};



export function ResearchView({
  ideaId,
  initialState,
}: {
  ideaId: string;
  initialState: IdeaState;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [state, setState] = React.useState(initialState);
  const [running, setRunning] = React.useState(!initialState.research_report);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [failed, setFailed] = React.useState<string | null>(null);

  const report = state.research_report;
  const started = React.useRef(false);

  const runResearch = React.useCallback(async () => {
    setFailed(null);
    setRunning(true);
    setStepIndex(0);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/research`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Research didn't finish.");

      setState(body.state);
      setRunning(false);
      router.refresh();
    } catch (err) {
      setRunning(false);
      setFailed(
        err instanceof Error
          ? err.message
          : "Research didn't finish. Your idea is saved.",
      );
    }
  }, [ideaId, router]);

  React.useEffect(() => {
    if (report || started.current) return;
    started.current = true;
    void runResearch();
  }, [report, runResearch]);

  React.useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, RESEARCH_STEPS.length - 1));
    }, 14_000);
    return () => clearInterval(timer);
  }, [running]);

  async function decideProposal(
    id: string,
    status: "accepted" | "rejected" | "edited",
    editedText?: string,
  ) {
    const response = await fetch(`/api/ideas/${ideaId}/research/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal_id: id, status, edited_text: editedText }),
    });

    if (!response.ok) {
      toast("We couldn't save that decision.", "danger");
      return;
    }

    const body = await response.json();
    setState(body.state);
    toast(
      status === "rejected" ? "Suggestion dismissed" : "Suggestion applied",
      "success",
    );
  }

  const proposals = report?.proposed_changes ?? [];
  const reviewed = proposals.filter((p) => p.status !== "pending").length;

  return (
    <>
      <TopBar>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="type-body-m hidden min-w-0 truncate font-medium text-primary sm:block">
            {state.title || "Your idea"}
          </span>
          <PipelineStepper
            ideaId={ideaId}
            status={state.status}
            currentStage="research"
          />
        </div>
      </TopBar>

      <header>
        <h1 className="type-display-l text-primary">
          What we found out about this
        </h1>
        <p className="type-body-l mt-1 text-secondary">
          Before you spend a day - or a dollar - talking to anyone.
        </p>
      </header>

      {running ? (
        <Card elevation="raised" className="mt-8 p-6">
          <NarrativeProgress steps={RESEARCH_STEPS} activeIndex={stepIndex} />
          <p className="type-body-m mt-6 border-t border-line pt-4 text-tertiary">
            This usually takes a minute or two. You can leave this page - we&rsquo;ll keep going, and your idea is already saved.
          </p>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Card>
      ) : failed ? (
        <Card elevation="raised" className="mt-8 p-6">
          <div className="flex items-start gap-3">
            <WarningIcon
              size={20}
              className="mt-0.5 shrink-0 text-caution"
              aria-hidden="true"
            />
            <div>
              <p className="type-body-l text-primary">{failed}</p>
              <p className="type-body-m mt-1 text-secondary">
                Your idea is saved. Nothing was lost.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => void runResearch()}
              >
                Try research again
              </Button>
            </div>
          </div>
        </Card>
      ) : report ? (
        <div className="mt-8 space-y-12 pb-4">
          {/* 1. Is this problem real? - the answer, before anything else.
                 The founder came here for this. Making them scroll past their
                 own restated idea to reach it buries the point of the page. */}
          <section aria-labelledby="verdict-heading">
            <Card elevation="raised" className="p-6 sm:p-7">
              <Badge tone={STRENGTH_TONE[report.problem_strength]} dot>
                {SIGNALS[report.problem_strength].label}
              </Badge>

              <h2
                id="verdict-heading"
                className="type-display-l mt-4 max-w-prose text-primary"
              >
                {SIGNALS[report.problem_strength].headline}
              </h2>

              <p className="type-body-l mt-3 max-w-prose text-secondary">
                {report.problem_strength_reasoning}
              </p>

              {/* Orientation at a glance, so the founder knows what they got
                  before deciding how much of the page to read. */}
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
                <Stat
                  value={report.evidence.length}
                  label={report.evidence.length === 1 ? "source" : "sources"}
                />
                <Stat
                  value={report.competitors.length}
                  label={
                    report.competitors.length === 1
                      ? "existing product"
                      : "existing products"
                  }
                />
                <Stat
                  value={proposals.length}
                  label={proposals.length === 1 ? "suggestion" : "suggestions"}
                />
              </dl>

              {report.unsourced ? (
                <p className="type-body-m mt-5 flex items-start gap-2 rounded-[6px] border border-line bg-page p-3 text-secondary">
                  <WarningIcon
                    size={16}
                    className="mt-0.5 shrink-0 text-caution"
                    aria-hidden="true"
                  />
                  <span>
                    Live search came back empty this time, so this read is based
                    on the model&rsquo;s own knowledge rather than sources we can
                    show you. Treat it as a starting point, not evidence.
                  </span>
                </p>
              ) : null}
            </Card>
          </section>

          {/* 2. Did you understand my idea? - available, not in the way. */}
          <UnderstandingCard
            ideaId={ideaId}
            structured={state.structured}
            onUpdated={(structured) => setState((s) => ({ ...s, structured }))}
          />

          {/* 3. What makes you say that? */}
          <Disclosure
            title="What people are actually saying"
            count={report.evidence.length}
            summary="Quotes and sources from the research"
            storageKey={`brains-research-evidence-${ideaId}`}
            defaultOpen
          >
            <p className="type-body-m text-secondary">
              Every line here links to where we found it. Follow them - the
              original threads are usually worth reading in full.
            </p>

            {report.evidence.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {report.evidence.map((item, i) => (
                  <li
                    key={`${item.source_url}-${i}`}
                    className="group rounded-[8px] border border-line bg-raised p-4 transition-colors hover:border-line-strong"
                  >
                    {/* Domain first: whether a claim came from a forum thread
                        or a vendor's own blog changes how much it's worth, and
                        that should be readable without opening the link. */}
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-caption inline-flex max-w-full items-center gap-1.5 rounded-full bg-inset px-2.5 py-1 text-secondary transition-colors group-hover:text-brand"
                    >
                      <span className="truncate">{hostOf(item.source_url)}</span>
                      <ArrowSquareOutIcon
                        size={12}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                    <p className="type-body-l mt-2.5 text-primary">{item.claim}</p>
                    {item.source_title ? (
                      <p className="type-body-m mt-1.5 truncate text-tertiary">
                        {item.source_title}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyFinding>
                We didn&rsquo;t turn up direct quotes this round. That&rsquo;s
                not the same as nobody having the problem - it often means
                it&rsquo;s discussed somewhere search doesn&rsquo;t reach, like
                a private group or in person. Talking to people is the next step
                anyway.
              </EmptyFinding>
            )}
          </Disclosure>

          {/* What they do instead - usually the real competition */}
          {report.current_workarounds.length > 0 ? (
            <Disclosure
              title="What people do instead today"
              count={report.current_workarounds.length}
              summary="The habits a new product has to beat"
              storageKey={`brains-research-workarounds-${ideaId}`}
            >
              <p className="type-body-m text-secondary">
                Ideas lose to a spreadsheet and a habit far more often than to a
                rival product. Each of these persists despite being bad, which
                tells you what you are really up against.
              </p>
              <ul className="mt-4 space-y-3">
                {report.current_workarounds.map((w, i) => (
                  <li
                    key={i}
                    className="rounded-[8px] border border-line bg-page p-4"
                  >
                    <p className="type-body-l text-primary">{w.description}</p>
                    {w.why_it_persists ? (
                      <p className="type-body-m mt-1.5 text-secondary">
                        Why it sticks: {w.why_it_persists}
                      </p>
                    ) : null}
                    {w.source_url ? (
                      <a
                        href={w.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-caption mt-2 inline-block text-brand hover:underline"
                      >
                        {hostOf(w.source_url)}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Disclosure>
          ) : null}

          {/* The case against. Deliberately its own section. */}
          {report.contrary_evidence.length > 0 ? (
            <Disclosure
              title="The case against"
              count={report.contrary_evidence.length}
              summary="Evidence that cuts the other way"
              storageKey={`brains-research-contrary-${ideaId}`}
              defaultOpen
            >
              <p className="type-body-m text-secondary">
                Kept separate on purpose. A report that only collects agreement
                is flattery, and this is the part worth arguing with.
              </p>
              <ul className="mt-4 space-y-2.5">
                {report.contrary_evidence.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-[8px] border border-caution/30 bg-page p-4"
                  >
                    <p className="type-body-m text-primary">{c.claim}</p>
                    {c.source_url ? (
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-caption mt-1.5 inline-block text-brand hover:underline"
                      >
                        {hostOf(c.source_url)}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Disclosure>
          ) : null}

          {/* What search could not settle */}
          {report.open_questions.length > 0 ? (
            <Disclosure
              title="What we could not settle"
              count={report.open_questions.length}
              summary="Only people can answer these"
              storageKey={`brains-research-open-${ideaId}`}
            >
              <p className="type-body-m text-secondary">
                Searching cannot answer these. They are the reason the next step
                is talking to someone, and they feed your interview questions.
              </p>
              <ul className="mt-4 space-y-2">
                {report.open_questions.map((q, i) => (
                  <li
                    key={i}
                    className="type-body-l rounded-[8px] border border-line bg-page px-4 py-3 text-primary"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </Disclosure>
          ) : null}

          {/* 4. Am I too late? */}
          <Disclosure
            title="What already exists"
            count={report.competitors.length}
            summary="Who else is solving this, and the gap they leave"
            storageKey={`brains-research-competitors-${ideaId}`}
          >
            <p className="type-body-m text-secondary">
              Other people solving this isn&rsquo;t bad news - it&rsquo;s proof
              someone will pay. What matters is the gap they leave.
            </p>

            {report.competitors.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {report.competitors.map((competitor, i) => (
                  <Card key={`${competitor.name}-${i}`} className="flex flex-col p-4">
                    <p className="type-body-l font-medium text-primary">
                      {competitor.name}
                    </p>
                    <p className="type-body-m mt-1.5 flex-1 text-secondary">
                      {competitor.summary}
                    </p>
                    {competitor.source_url ? (
                      <a
                        href={competitor.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-caption mt-3 inline-flex items-center gap-1 text-brand hover:underline"
                      >
                        {hostOf(competitor.source_url)}
                        <ArrowSquareOutIcon size={12} aria-hidden="true" />
                      </a>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyFinding>
                We didn&rsquo;t find anyone solving this directly. Worth being
                honest with yourself about which it is: a real gap, or a sign
                that people don&rsquo;t want it solved badly enough to pay. The
                interviews will tell you which.
              </EmptyFinding>
            )}
          </Disclosure>

          {/* 5. So what should I change? */}
          {proposals.length > 0 ? (
            <Disclosure
              title="Where we’d sharpen it"
              count={proposals.length}
              summary={`${reviewed} of ${proposals.length} reviewed`}
              storageKey={`brains-research-proposals-${ideaId}`}
              defaultOpen
            >
              <p className="type-body-m text-secondary">
                Take what&rsquo;s right, edit what&rsquo;s close, ignore the
                rest. Accepting one rewrites your idea above.
              </p>

              <ul className="mt-4 space-y-3">
                {proposals.map((proposal, i) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    index={i}
                    onDecide={decideProposal}
                  />
                ))}
              </ul>
            </Disclosure>
          ) : null}

          {/* Next step - sticky so it stays reachable on a long page */}
          <div className="sticky bottom-0 -mx-4 border-t border-line bg-page/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button
                variant="primary"
                size="large"
                iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
                onClick={() => router.push(`/ideas/${ideaId}/validation`)}
              >
                Start validating
              </Button>
              <p className="type-body-m text-secondary">
                Next: find where these people are, and go ask them.
              </p>
              <Link
                href="/dashboard"
                className="type-body-m ml-auto text-secondary hover:text-primary"
              >
                Save for later
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="type-data-m text-primary">{value}</span>
        <span className="type-body-m text-secondary">{label}</span>
      </dd>
    </div>
  );
}

/** An absent finding is still a finding - never render a section as blank. */
function EmptyFinding({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-body-l mt-4 rounded-[8px] border border-dashed border-line px-5 py-4 text-secondary">
      {children}
    </p>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
