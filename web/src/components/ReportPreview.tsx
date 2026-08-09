"use client";

import * as React from "react";
import { ArrowRightIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./Container";
import { cn } from "@/lib/cn";

/**
 * A real brief, paged through one section at a time.
 *
 * `LiveRun` above shows the four stages in miniature; this shows what the
 * founder actually receives at the end. Both earn their place. The stage rail
 * answers "what happens when I submit", and this answers the question a
 * founder actually decides on: "is what I get back worth anything".
 *
 * Paged rather than stacked because the whole brief laid out end to end ran
 * to roughly three thousand pixels on a phone, and nobody should have to
 * scroll past a sample to reach the rest of the page. An earlier attempt
 * folded the lower half behind a disclosure, which fixed the length but hid
 * the most persuasive parts behind a click most people never make. Paging
 * keeps every section one click away and the block a fixed height.
 *
 * The rail is vertical rather than along the top, unlike LiveRun: six labels
 * do not fit across a row, and a vertical list reads as the contents of a
 * document, which is what this is meant to be.
 *
 * Deliberately not auto-advancing. LiveRun already rotates on its own a
 * screen above, and two things cycling at once on the same page is noise.
 *
 * It is an extract, and it says so. An earlier version was headed "the whole
 * brief, not a teaser", which was an overclaim: a real brief carries more
 * evidence, more communities and a longer question set than fits here.
 * Nothing below is presented as a customer's real result.
 */

const THEMES = [
  "A no-show costs a two hour hole nobody fills",
  "Deposits are the fix people reach for first",
  "The paper diary is trusted, not merely tolerated",
];

const OBJECTIONS = [
  "Charging a fee risks the regulars they rely on",
  "Two had already tried an app and gone back to texting",
];

const RISKS = [
  {
    risk: "The workaround is free and good enough",
    severity: "high" as const,
    detail:
      "A paper diary costs nothing and never breaks. Your product has to beat free and already working, which is a higher bar than beating a competitor.",
  },
  {
    risk: "Deposits may be the wedge, not scheduling",
    severity: "medium" as const,
    detail:
      "Two of three complaints resolve around money rather than calendars. The scheduling framing may be solving the symptom your customer cares least about.",
  },
];

const RESPONSES = [
  {
    tag: "Confirmed" as const,
    quote:
      "Last month I had four no-shows. That is most of a day gone and I still paid for the unit.",
    source: "Solo groomer, 6 years, Manchester",
  },
  {
    tag: "Confirmed" as const,
    quote:
      "I started asking for a deposit over the phone. Half of them go elsewhere, but the ones who book turn up.",
    source: "Solo groomer, 3 years, Leeds",
  },
  {
    tag: "Unsure" as const,
    quote:
      "It annoys me but I would not pay monthly for it. Maybe if it also did the reminders.",
    source: "Mobile groomer, 2 years, Bristol",
  },
  {
    tag: "No" as const,
    quote:
      "My clients are regulars, they have my mobile. It has never really been a problem.",
    source: "Home-based groomer, 11 years, Devon",
  },
];

/**
 * The report's own sections, in the app's own order and wording.
 *
 * Taken from ReportView.tsx rather than invented for the landing page: the
 * verdict card, "What people told us", "Reasons to hold this loosely", and
 * the raw responses. An earlier version had six sections including two
 * ("Signals", "Where to find them") that belong to the research brief rather
 * than the validation report, which promised a screen the product does not
 * have.
 *
 * Four also happens to be the right number to page through without it
 * becoming a chore.
 */
const SECTIONS = [
  { id: "verdict", label: "Verdict", hint: "The score, and how we got it" },
  { id: "told", label: "What people told us", hint: "Patterns and push-back" },
  {
    id: "risks",
    label: "Reasons to hold this loosely",
    hint: "What weakens the score",
  },
  { id: "responses", label: "Every response", hint: "Raw, tagged, sourced" },
];

/**
 * The framing is a prop because this block now appears in two contexts.
 *
 * On the home page it is the output of step four of the run shown above it,
 * and the eyebrow says so. On a guide page there is no numbered run, so
 * "Step 04" would refer to a sequence the reader never saw. The sample itself
 * is identical in both places; only the sentence introducing it changes.
 */
export function ReportPreview({
  eyebrow = "Step 04 · Decide",
  title = "A look inside a real brief",
  lead = "Every score here is attached to the evidence that produced it, and where the evidence is thin the brief says so. This is an extract. The full one goes further on all of it.",
}: {
  eyebrow?: string;
  title?: string;
  lead?: string;
} = {}) {
  const [active, setActive] = React.useState(0);
  const section = SECTIONS[active];
  const next = SECTIONS[(active + 1) % SECTIONS.length];

  return (
    <section
      id="sample-report"
      className="mk-section mk-topline scroll-mt-24 bg-sunken"
    >
      <Container>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {/* Labelled as the output of stage four rather than as a stage of
                its own. The four numbered steps belong to the run above; this
                is what the last of them produces, so numbering its sections
                01-04 as well implied a second sequence that does not exist. */}
            <p className="type-eyebrow text-brand">{eyebrow}</p>
            <h2 className="type-display-hero mt-4 text-balance text-primary">
              {title}
            </h2>
          </div>
          <p className="type-body-l max-w-[52ch] text-secondary">{lead}</p>
        </div>

        <div className="mk-panel mt-12 overflow-hidden">
          {/* Persistent header: whichever section is open, you can still see
              which idea this is and how much evidence sits behind it. */}
          <header className="flex flex-col gap-5 border-b border-line px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="type-eyebrow text-tertiary">The idea</p>
              <p className="type-display-m mt-2 text-pretty text-primary">
                Booking and no-show fees for independent dog groomers
              </p>
            </div>
            <div className="flex items-center gap-10">
              <div>
                <p className="type-eyebrow text-tertiary">Sources read</p>
                <p className="type-data-m mt-1.5 text-primary">37</p>
              </div>
              <div>
                <p className="type-eyebrow text-tertiary">Confidence</p>
                <p className="type-body-l mt-1.5 font-semibold text-caution">
                  Medium
                </p>
              </div>
            </div>
          </header>

          <div className="grid lg:grid-cols-[minmax(0,264px)_minmax(0,1fr)]">
            {/* Rail. A scrolling row on a phone, a contents list once there
                is width for one. */}
            <div
              role="tablist"
              aria-label="Sections of the brief"
              className={cn(
                "flex overflow-x-auto border-b border-line lg:flex-col lg:overflow-visible lg:border-r lg:border-b-0",
                "[mask-image:linear-gradient(to_right,#000_calc(100%_-_28px),transparent)]",
                "lg:[mask-image:none]",
              )}
            >
              {SECTIONS.map((item, i) => {
                const on = i === active;
                return (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={on}
                    aria-controls="brief-panel"
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative shrink-0 px-5 py-4 text-left transition-colors duration-[160ms] lg:px-6",
                      on ? "bg-raised" : "hover:bg-wash-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "type-body-m block font-medium whitespace-nowrap lg:whitespace-normal",
                        on ? "text-primary" : "text-secondary",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="type-caption mt-1 hidden text-tertiary lg:block">
                      {item.hint}
                    </span>

                    {/* Marker sits on the leading edge vertically, the bottom
                        edge horizontally, so it reads as "you are here" in
                        both layouts. */}
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

            {/* Fixed floor so paging never shifts the page under the reader. */}
            <div
              id="brief-panel"
              role="tabpanel"
              aria-label={section.label}
              className="min-w-0 px-6 py-7 lg:min-h-[420px] lg:px-8"
            >
              {section.id === "verdict" ? <Verdict /> : null}
              {section.id === "told" ? <WhatPeopleTold /> : null}
              {section.id === "risks" ? <Risks /> : null}
              {section.id === "responses" ? <Responses /> : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4 lg:px-8">
            <p className="type-caption text-tertiary">
              Section {active + 1} of {SECTIONS.length}
            </p>
            <button
              type="button"
              onClick={() => setActive((a) => (a + 1) % SECTIONS.length)}
              className="type-body-m group flex items-center gap-2 font-medium text-brand hover:underline"
            >
              Next: {next.label}
              <ArrowRightIcon
                size={15}
                aria-hidden="true"
                className="transition-transform duration-[160ms] group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>

        <p className="type-caption mt-5 text-tertiary">
          An extract from one worked example. The figures are illustrative, not
          a customer&rsquo;s result.
        </p>
      </Container>
    </section>
  );
}

/**
 * Mirrors the app's verdict card: the score out of 100, the go-ahead or
 * rethink badge, the confirmation-rate sentence, and the reasoning behind the
 * number under its own "How we got to that number" heading.
 */
function Verdict() {
  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-9">
        <div className="shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="type-data-l text-primary">62</span>
            <span className="type-body-m text-tertiary">/ 100</span>
          </div>
          <div
            role="img"
            aria-label="Score 62 out of 100"
            className="mt-3 h-1.5 w-full min-w-[168px] overflow-hidden rounded-full bg-inset"
          >
            <div className="h-full w-[62%] rounded-full bg-brand" />
          </div>
        </div>

        <div className="min-w-0">
          <span className="type-caption inline-flex items-center gap-2 rounded-full bg-success-subtle px-3 py-1.5 font-medium text-success">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-success"
            />
            Go ahead
          </span>
          <p className="type-display-m mt-3 text-primary">
            The signal is there. Go build it.
          </p>
          <p className="type-body-m mt-2 text-secondary">
            <span className="type-data-s text-primary">68%</span> of 19 people
            confirmed they have this problem.
          </p>
        </div>
      </div>

      <div className="mt-7 border-t border-line pt-6">
        <p className="type-eyebrow text-tertiary">
          How we got to that number
        </p>
        <p className="type-body-m mt-2.5 max-w-[70ch] text-secondary">
          Thirteen of nineteen described losing money to no-shows without being
          prompted, and six already pay for something to reduce it. The score
          is held below seventy because the free workaround is tolerated rather
          than hated, which is the switching cost you have not tested yet.
        </p>
      </div>
    </div>
  );
}

/** The app's "What people told us": narrative, patterns, and push-back. */
function WhatPeopleTold() {
  return (
    <div>
      <p className="type-body-l max-w-[70ch] text-secondary">
        Groomers describe the same evening over and over: a gap in the day
        nobody fills, and a client who reappears next month as if nothing
        happened. Almost nobody framed it as a software problem.
      </p>

      <div className="mk-grid mk-grid-raised mt-6 rounded-[var(--mk-radius-card)] sm:grid-cols-2">
        <div className="p-5">
          <p className="type-eyebrow text-tertiary">
            Patterns that came up repeatedly
          </p>
          <ul className="mt-3.5 flex flex-col gap-2.5">
            {THEMES.map((item) => (
              <li
                key={item}
                className="type-body-m flex items-start gap-2.5 text-primary"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-success"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5">
          <p className="type-eyebrow text-tertiary">Push-back we heard</p>
          <ul className="mt-3.5 flex flex-col gap-2.5">
            {OBJECTIONS.map((item) => (
              <li
                key={item}
                className="type-body-m flex items-start gap-2.5 text-primary"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-caution"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** The app's "Reasons to hold this loosely", with the same severity tags. */
function Risks() {
  return (
    <div>
      <ul className="flex flex-col gap-3">
        {RISKS.map((item) => (
          <li
            key={item.risk}
            className={cn(
              "flex items-start gap-3 rounded-[var(--mk-radius-card)] border p-5",
              item.severity === "high"
                ? "border-danger-border bg-danger-subtle"
                : "border-line bg-raised",
            )}
          >
            <WarningIcon
              size={16}
              className={cn(
                "mt-0.5 shrink-0",
                item.severity === "high" ? "text-danger" : "text-caution",
              )}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="type-body-m font-medium text-primary">
                  {item.risk}
                </p>
                <span
                  className={cn(
                    "type-caption rounded-full px-2.5 py-1 font-medium",
                    item.severity === "high"
                      ? "bg-danger-subtle text-danger"
                      : "bg-caution-subtle text-caution",
                  )}
                >
                  {item.severity === "high" ? "High" : "Worth noting"}
                </span>
              </div>
              <p className="type-body-m mt-1.5 max-w-[70ch] text-secondary">
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The app's raw response list. Every answer is readable and tagged confirmed,
 * unsure or no, which is the claim the rest of the page keeps making about
 * the summary never replacing access to the underlying data.
 */
function Responses() {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="type-eyebrow text-tertiary">
          19 responses, all readable
        </p>
        <p className="type-caption text-tertiary">
          Screened for quality before counting
        </p>
      </div>

      <ul className="mk-grid mk-grid-raised mt-5 rounded-[var(--mk-radius-card)]">
        {RESPONSES.map((item) => (
          <li key={item.quote} className="flex flex-col gap-3 p-5 sm:flex-row">
            <span
              className={cn(
                "type-caption h-fit shrink-0 rounded-full px-2.5 py-1 font-medium",
                item.tag === "Confirmed" && "bg-success-subtle text-success",
                item.tag === "Unsure" && "bg-caution-subtle text-caution",
                item.tag === "No" && "bg-neutral-subtle text-tertiary",
              )}
            >
              {item.tag}
            </span>
            <div className="min-w-0">
              <p className="type-body-m text-primary">{item.quote}</p>
              <p className="type-caption mt-1.5 text-tertiary">
                {item.source}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
