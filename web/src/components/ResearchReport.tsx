"use client";

import * as React from "react";
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  LockSimpleIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { signUpWithDraft } from "@/lib/urls";
import { SIGNALS, type SignalTone } from "@shared/signals";

export type Evidence = { claim: string; source_url: string; source_title: string };
export type Competitor = { name: string; summary: string; source_url: string };

export type Report = {
  problem_strength: "weak" | "moderate" | "strong";
  problem_strength_reasoning: string;
  competitors: Competitor[];
  evidence: Evidence[];
  current_workarounds: {
    description: string;
    why_it_persists: string;
    source_url: string;
  }[];
  contrary_evidence: { claim: string; source_url: string }[];
  open_questions: string[];
  proposed_changes: {
    id: string;
    text: string;
    reasoning: string;
    patches: string;
    patch_value: string;
  }[];
  unsourced: boolean;
};

export type Structured = {
  problem_statement: string;
  icp: string;
  value_prop: string;
};

/**
 * Wording comes from the shared module, so this site and the product cannot
 * describe the same finding differently. Only the palette is decided here,
 * because colour is this site's concern and not the product's.
 */
const TONE: Record<SignalTone, { dot: string; text: string }> = {
  success: { dot: "bg-success", text: "text-success" },
  neutral: { dot: "bg-secondary", text: "text-secondary" },
  caution: { dot: "bg-caution", text: "text-caution" },
};

/**
 * How many items each gated section shows before the lock.
 *
 * One number rather than a judgement per section. The caps had drifted to
 * three, two and four across different tabs, which reads as arbitrary
 * generosity: a visitor cannot tell whether a short list means we found
 * little or chose to show little. Three is what fits the panel at the
 * smallest laptop height without the section scrolling.
 *
 * The case against is deliberately exempt and shows everything.
 */
const PREVIEW = 3;

/**
 * The button names the job, not the mechanic and not the artifact.
 *
 * It read "Continue free" first, which names a price and a direction and no
 * benefit: continue to what? Then "Get my questions", which was accurate -
 * questions really are the next thing produced - but sold a form when the
 * founder came for an answer. Nobody wants questions. They want to know
 * whether to build the thing.
 */
const CTA_LABEL = "Validate my idea";

/**
 * The full round, so the ask is legible as one step of four rather than as a
 * wall. Wording follows the validation hub page, which describes the same
 * pipeline to a colder audience.
 */
const STAGES = [
  {
    title: "Research the problem",
    body: "Sourced evidence, what people use instead, and what argues against the idea. This is what you are reading.",
  },
  {
    title: "Questions worth asking",
    body: "Non-leading questions written from these findings, plus the communities where these people already gather.",
  },
  {
    title: "Answers from real people",
    body: "A link anyone can answer without an account. Every response screened for quality before it counts.",
  },
  {
    title: "A score you can defend",
    body: "The themes, the disagreements, and a go or rethink with the reasoning attached. Never a silent kill.",
  },
];

type Tab = { id: string; label: string; hint: string; count?: number; render: () => React.ReactNode };

/**
 * The research brief as one screen, not a page.
 *
 * The whole thing is a single panel sized to the viewport: the header, the
 * rail and the footer stay put, and only the open section scrolls. A founder
 * can see everything that came back and move through all of it without the
 * page moving under them once.
 *
 * That is a deliberate break from how the rest of this site behaves, and the
 * reason is what this screen is. Every other page is a document, read top to
 * bottom, and scrolls like one. This is the product's output, and the product
 * is a workspace. Making it scroll like an article would have been the
 * consistent choice and the wrong one.
 *
 * Because nothing scrolls, every list here is capped at what fits. The counts
 * in the rail and on each lock are the true totals, so the panel never
 * implies it is showing everything.
 */
export function ResearchReport({
  report,
  structured,
  title,
  draft,
}: {
  report: Report;
  structured: Structured;
  title: string;
  draft: string;
}) {
  const [active, setActive] = React.useState(0);
  const signal = SIGNALS[report.problem_strength];
  const tone = TONE[signal.tone];
  const sources = new Set(report.evidence.map((e) => e.source_url)).size;
  const signUp = signUpWithDraft(draft);

  const tabs: Tab[] = [
    /**
     * The landing tab, and the one most visitors will judge the product on.
     *
     * It has to answer "what did you find" completely enough that opening
     * another tab is optional. So: the verdict and its reasoning, the idea
     * restated so a misread is catchable, the counts, and the single
     * strongest thing from each side of the argument.
     */
    {
      id: "overview",
      label: "Overview",
      hint: "Everything, in one look",
      render: () => (
        <div className="space-y-5">
          <p className="type-display-m max-w-[38ch] text-balance text-primary">
            {signal.headline}
          </p>

          {/* The agent's reasoning is the longest prose on the screen and the
              least likely to be read on arrival. Two lines by default, with
              the rest one click away: a founder deciding whether to trust the
              verdict wants it, and everyone else wants it out of the way. */}
          <details className="group">
            <summary className="type-body-m cursor-pointer list-none text-secondary marker:content-none">
              <span className="line-clamp-2 max-w-[85ch] group-open:line-clamp-none">
                {report.problem_strength_reasoning}
              </span>
              <span className="type-caption mt-1.5 inline-block text-brand group-open:hidden">
                Read the full reasoning
              </span>
            </summary>
          </details>

          {report.unsourced ? (
            <p className="type-body-m flex items-start gap-2 rounded-[10px] border border-line bg-inset p-4 text-secondary">
              <WarningIcon size={16} className="mt-0.5 shrink-0 text-caution" aria-hidden="true" />
              <span>
                Live search came back empty this time, so this read is based on
                the model&rsquo;s own knowledge rather than sources we can show
                you. Treat it as a starting point, not evidence.
              </span>
            </p>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            {report.evidence[0] ? (
              <Highlight
                label="Strongest thing we found"
                body={report.evidence[0].claim}
                url={report.evidence[0].source_url}
              />
            ) : null}
            {report.contrary_evidence[0] ? (
              <Highlight
                label="Strongest thing against it"
                body={report.contrary_evidence[0].claim}
                url={report.contrary_evidence[0].source_url}
                danger
              />
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "understanding",
      label: "Did we get it right",
      hint: "Your idea, as we read it",
      render: () => (
        <Panel lead="Everything else was researched against this. If any of it is wrong, the findings are answering the wrong question, and you can correct it once you are in.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Restated term="The problem" value={structured.problem_statement} />
            <Restated term="Who has it" value={structured.icp} />
            <Restated term="What changes for them" value={structured.value_prop} />
          </div>
        </Panel>
      ),
    },
    report.evidence.length > 0 && {
      id: "evidence",
      label: "What people are saying",
      hint: "Sourced, domain first",
      count: report.evidence.length,
      render: () => (
        <Panel
          lead="Every line links to where we found it. The domain shows first, because whether a claim came from a forum thread or a vendor's own blog changes what it is worth."
          locked={report.evidence.length - PREVIEW}
          noun="sourced finding"
          href={signUp}
        >
          <ul className="space-y-3">
            {report.evidence.slice(0, PREVIEW).map((item, i) => (
              <li
                key={`${item.source_url}-${i}`}
                className="rounded-[10px] border border-line bg-raised p-4"
              >
                <SourceChip url={item.source_url} />
                <p className="type-body-l mt-2.5 text-primary">{item.claim}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ),
    },
    report.current_workarounds.length > 0 && {
      id: "today",
      label: "What people do today",
      hint: "Usually the real competition",
      count: report.current_workarounds.length,
      render: () => (
        <Panel
          lead="Ideas lose to a spreadsheet and a habit far more often than to a rival product. Each of these is something your product has to beat."
          locked={report.current_workarounds.length - PREVIEW}
          noun="workaround"
          href={signUp}
        >
          <ul className="space-y-3">
            {report.current_workarounds.slice(0, PREVIEW).map((w) => (
              <li key={w.description} className="rounded-[10px] border border-line bg-raised p-4">
                <p className="type-body-l text-primary">{w.description}</p>
                <p className="type-body-m mt-2 text-secondary">
                  Why it persists: {w.why_it_persists}
                </p>
                <SourceChip url={w.source_url} className="mt-3" />
              </li>
            ))}
          </ul>
        </Panel>
      ),
    },
    report.competitors.length > 0 && {
      id: "competitors",
      label: "Who already solves this",
      hint: "Direct and indirect",
      count: report.competitors.length,
      render: () => (
        <Panel
          lead="Including the indirect ones. A general tool people bend to this purpose competes just as hard as a direct rival."
          locked={report.competitors.length - PREVIEW}
          noun="competitor"
          href={signUp}
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {report.competitors.slice(0, PREVIEW).map((c) => (
              <li key={c.name} className="rounded-[10px] border border-line bg-raised p-4">
                <p className="type-body-l font-medium text-primary">{c.name}</p>
                <p className="type-body-m mt-2 text-secondary">{c.summary}</p>
                <SourceChip url={c.source_url} className="mt-3" />
              </li>
            ))}
          </ul>
        </Panel>
      ),
    },
    report.contrary_evidence.length > 0 && {
      id: "against",
      label: "The case against",
      hint: "Never trimmed",
      count: report.contrary_evidence.length,
      render: () => (
        // Never gated. This is the part a founder is least likely to seek out
        // and most likely to need, and holding any of it back would make the
        // free brief flattering, which is the one thing it must not be.
        <Panel lead="Collected deliberately and kept where it cannot be folded into a positive summary. All of it is here.">
          <ul className="space-y-3">
            {report.contrary_evidence.map((c) => (
              <li key={c.claim} className="rounded-[10px] border border-danger/20 bg-raised p-4">
                <p className="type-body-l text-primary">{c.claim}</p>
                <SourceChip url={c.source_url} className="mt-3" />
              </li>
            ))}
          </ul>
        </Panel>
      ),
    },
    report.proposed_changes.length > 0 && {
      id: "sharpen",
      label: "How to sharpen it",
      hint: "Accept or reject each one",
      count: report.proposed_changes.length,
      render: () => (
        <Panel
          lead="Proposed from what the research found. In the app you accept or reject each one, and nothing changes unless you do."
          locked={report.proposed_changes.length - PREVIEW}
          noun="suggestion"
          href={signUp}
        >
          <ol className="space-y-3">
            {report.proposed_changes.slice(0, PREVIEW).map((p) => (
              <li key={p.id} className="rounded-[10px] border border-line bg-raised p-4">
                <p className="type-body-l font-medium text-primary">{p.text}</p>
                <p className="type-body-m mt-2 text-secondary">{p.reasoning}</p>
              </li>
            ))}
          </ol>
        </Panel>
      ),
    },
    report.open_questions.length > 0 && {
      id: "questions",
      label: "Only people can answer",
      hint: "These become your interviews",
      count: report.open_questions.length,
      render: () => (
        <Panel
          lead="Search cannot tell you whether someone will change what they do. These become the questions you put to real people."
          locked={report.open_questions.length - PREVIEW}
          noun="open question"
          href={signUp}
        >
          <ul className="space-y-3">
            {report.open_questions.slice(0, PREVIEW).map((q) => (
              <li
                key={q}
                className="type-body-l rounded-[10px] border border-line bg-raised p-4 text-primary"
              >
                {q}
              </li>
            ))}
          </ul>
        </Panel>
      ),
    },
  ].filter(Boolean) as Tab[];

  const section = tabs[active] ?? tabs[0];

  return (
    <div className="flex h-[calc(100dvh-var(--nav-h))] flex-col">
      <div className="mk-panel-flush flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Fixed header. The idea, the verdict and the way forward stay on
            screen no matter which section is open. */}
        <header className="flex shrink-0 flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0">
              <p className="type-eyebrow text-tertiary">Your research brief</p>
              <h1 className="type-body-l mt-1 truncate font-medium text-primary">
                {title}
              </h1>
            </div>
            <span
              className={cn(
                "type-caption hidden shrink-0 items-center gap-2 rounded-full bg-inset px-3 py-1.5 sm:inline-flex",
                tone.text,
              )}
            >
              <span className={cn("size-1.5 rounded-full", tone.dot)} />
              {signal.short}
            </span>
          </div>

          {/* No call to action up here.
              There were two identical full-colour buttons on this screen, one
              in this header and one in the bar below, both saying the same
              thing. A second copy of the primary action does not double the
              chance of a click; it splits the eye and makes the screen read as
              selling rather than reporting. The bar keeps it, because that is
              where the progress it follows on from lives.

              What stays here is what the header is for: the shape of what
              came back, visible on every tab. */}
          <dl className="hidden shrink-0 items-center gap-6 xl:flex">
            <Stat value={sources} label={sources === 1 ? "source" : "sources"} />
            <Stat value={report.competitors.length} label="products" />
            <Stat value={report.current_workarounds.length} label="workarounds" />
            <Stat value={report.proposed_changes.length} label="suggestions" />
          </dl>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,268px)_minmax(0,1fr)]">
          {/* Rail. A scrolling row on a phone, a contents list once there is
              width for one. Same control as the sample report on the home
              page rather than a third way of doing this. */}
          <div
            role="tablist"
            aria-label="Sections of the brief"
            className={cn(
              "flex shrink-0 overflow-x-auto border-b border-line",
              "lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:border-r lg:border-b-0",
              "[mask-image:linear-gradient(to_right,#000_calc(100%_-_28px),transparent)]",
              "lg:[mask-image:none]",
            )}
          >
            {tabs.map((item, i) => {
              const on = i === active;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={on}
                  aria-controls="brief-panel"
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative shrink-0 px-5 py-3.5 text-left transition-colors duration-[160ms] lg:px-6",
                    on ? "bg-raised" : "hover:bg-wash-hover",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "type-body-m block font-medium whitespace-nowrap lg:whitespace-normal",
                        on ? "text-primary" : "text-secondary",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.count ? (
                      <span className="type-caption rounded-full bg-inset px-1.5 text-tertiary">
                        {item.count}
                      </span>
                    ) : null}
                  </span>
                  <span className="type-caption mt-0.5 hidden text-tertiary lg:block">
                    {item.hint}
                  </span>

                  {on ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-brand lg:inset-y-0 lg:right-auto lg:left-0 lg:h-auto lg:w-[2px]"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* The only thing that scrolls. Everything else on the screen is
              fixed, so moving between sections never shifts the layout. */}
          <div
            id="brief-panel"
            role="tabpanel"
            aria-label={section.label}
            className="min-w-0 overflow-y-auto px-5 py-6 lg:px-7"
          >
            {section.render()}
          </div>
        </div>

        {/* The one bar that is always on screen, so it carries the one thing
            worth always being on screen.

            It used to be a pager: "Section 3 of 7", and a link to the next
            one. That was the least valuable row on the page holding the most
            valuable position, and the rail already does navigation. Progress
            through the product beats progress through the report: four
            segments, one filled, so the ask reads as one step of four rather
            than as a wall. */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-line px-5 py-3 lg:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex shrink-0 gap-1" aria-hidden="true">
              {STAGES.map((stage, i) => (
                <span
                  key={stage.title}
                  className={cn(
                    "h-1 w-7 rounded-full sm:w-10",
                    i === 0 ? "bg-brand" : "bg-inset",
                  )}
                />
              ))}
            </div>
            <p className="type-caption min-w-0 truncate text-tertiary">
              <span className="text-secondary">Step 1 of 4 done.</span>{" "}
              <span className="hidden sm:inline">{signal.nextShort}</span>
            </p>
          </div>

          <a
            href={signUp}
            className={cn(
              "type-body-m inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-brand px-4 py-2",
              "font-medium text-on-accent transition-colors duration-[120ms] hover:bg-brand-hover",
            )}
          >
            {CTA_LABEL}
            <ArrowRightIcon size={15} weight="bold" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Panel({
  lead,
  locked,
  noun,
  href,
  children,
}: {
  lead: string;
  locked?: number;
  noun?: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p className="type-body-m max-w-[85ch] text-secondary">{lead}</p>
      <div className="mt-5">{children}</div>
      {locked && noun && href ? <Locked count={locked} noun={noun} href={href} /> : null}
    </>
  );
}

function Highlight({
  label,
  body,
  url,
  danger,
}: {
  label: string;
  body: string;
  url: string;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border bg-raised p-4",
        danger ? "border-danger/20" : "border-line",
      )}
    >
      <p className="type-eyebrow text-tertiary">{label}</p>
      <p className="type-body-l mt-2 text-primary">{body}</p>
      <SourceChip url={url} className="mt-3" />
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="type-eyebrow text-tertiary">{label}</dt>
      <dd className="type-data-m mt-0.5 text-primary">{value}</dd>
    </div>
  );
}

function Restated({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-raised p-4">
      <p className="type-eyebrow text-tertiary">{term}</p>
      <p className="type-body-m mt-2 text-secondary">{value}</p>
    </div>
  );
}

/**
 * The boundary, stated with a real number rather than a blur.
 *
 * A blurred paragraph tells a visitor nothing about whether what is behind it
 * is worth an account, so it reads as a trick. A count is checkable, and it
 * is the same number the report actually holds.
 */
function Locked({ count, noun, href }: { count: number; noun: string; href: string }) {
  if (count <= 0) return null;

  return (
    <a
      href={href}
      className={cn(
        "group mt-3 flex items-center justify-between gap-4 rounded-[10px] border border-dashed border-line",
        "px-4 py-3.5 transition-colors duration-[120ms] hover:border-brand",
      )}
    >
      <span className="type-body-m flex items-center gap-2.5 text-secondary">
        <LockSimpleIcon size={15} className="shrink-0 text-tertiary" aria-hidden="true" />
        {count} more {noun}
        {count === 1 ? "" : "s"} in the full brief
      </span>
      <span className="type-body-m flex shrink-0 items-center gap-1.5 font-medium text-brand">
        Open it free
        <ArrowRightIcon
          size={14}
          weight="bold"
          aria-hidden="true"
          className="transition-transform duration-[160ms] group-hover:translate-x-0.5"
        />
      </span>
    </a>
  );
}

function SourceChip({ url, className }: { url: string; className?: string }) {
  if (!url) return null;

  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // A malformed URL is still shown. Dropping it silently would hide that
    // the model produced something wrong.
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        "type-caption inline-flex max-w-full items-center gap-1.5 rounded-full bg-inset px-2.5 py-1",
        "text-secondary transition-colors duration-[120ms] hover:text-brand",
        className,
      )}
    >
      <span className="truncate">{host}</span>
      <ArrowSquareOutIcon size={12} className="shrink-0" aria-hidden="true" />
    </a>
  );
}
