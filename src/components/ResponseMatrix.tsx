"use client";

import * as React from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { parseAnswers } from "@/lib/domain/response-notes";
import { cn } from "@/lib/cn";

/**
 * Every response as one grid: questions across the top, respondents down the
 * side.
 *
 * The previous version put each response in its own card with the questions
 * repeated inside it. That reads correctly and is unusable at scale - seven
 * questions and eleven respondents means the same seven sentences printed
 * seventy-seven times, and the only way to find out what the people who said
 * no thought about pricing is to scroll the whole thing and hold it in your
 * head.
 *
 * Asked once at the top, a question becomes a column, and the comparison the
 * reader actually came for - how did everyone answer this one? - is a glance
 * down that column instead of a read of the entire page. Nobody perusing a
 * shared link is going to do the read.
 *
 * The trade is width. Seven columns of prose do not fit on a phone, so the
 * grid scrolls sideways with the respondent column pinned, and cells clamp to
 * a few lines until a row is opened. Both are deliberate: the default view is
 * for scanning, and the full text is one click away for the two or three
 * answers that turn out to matter.
 */

export type MatrixResponse = {
  /** Stable identity for React. */
  key: string;
  confirmed: string;
  notes: string;
  /** Small facts shown under the respondent number - channel, source. */
  meta?: string[];
  /** Shown when a response has not cleared screening. */
  flag?: { text: string; tone: "danger" | "neutral" };
};

const VERDICT: Record<
  string,
  { label: string; short: string; tone: "success" | "caution" | "danger"; edge: string }
> = {
  yes: {
    label: "Confirmed the problem",
    short: "Confirmed",
    tone: "success",
    edge: "border-l-success",
  },
  unsure: {
    label: "Unsure",
    short: "Unsure",
    tone: "caution",
    edge: "border-l-caution",
  },
  no: {
    label: "Did not confirm",
    short: "Did not confirm",
    tone: "danger",
    edge: "border-l-danger",
  },
};

/** Wide enough for a sentence to break sensibly, narrow enough to fit several. */
const COLUMN_PX = 260;
const RESPONDENT_PX = 172;

export function ResponseMatrix({
  responses,
  className,
}: {
  responses: MatrixResponse[];
  className?: string;
}) {
  const [filter, setFilter] = React.useState<"all" | "yes" | "unsure" | "no">(
    "all",
  );
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const counts = {
    all: responses.length,
    yes: responses.filter((r) => r.confirmed === "yes").length,
    unsure: responses.filter((r) => r.confirmed === "unsure").length,
    no: responses.filter((r) => r.confirmed === "no").length,
  };

  const segments = (
    [
      { id: "all", label: "All" },
      { id: "yes", label: "Confirmed" },
      { id: "unsure", label: "Unsure" },
      { id: "no", label: "Did not confirm" },
    ] as const
  ).filter((s) => s.id === "all" || counts[s.id] > 0);

  const visible =
    filter === "all"
      ? responses
      : responses.filter((r) => r.confirmed === filter);

  /**
   * Parsed once for the whole grid, and numbered before filtering so that
   * "Respondent 4" means the same person whichever segment is showing.
   */
  const rows = React.useMemo(
    () =>
      responses.map((response, i) => ({
        response,
        number: i + 1,
        answers: parseAnswers(response.notes),
      })),
    [responses],
  );

  const visibleKeys = new Set(visible.map((r) => r.key));
  const shown = rows.filter((row) => visibleKeys.has(row.response.key));

  /**
   * Columns are the union of every question asked, in the order they were
   * first seen, rather than the questions of the first response. Rounds get
   * re-run with a changed question set, and taking one response as the
   * template would silently drop the answers that do not line up with it.
   */
  const questions: string[] = [];
  for (const row of rows) {
    for (const answer of row.answers) {
      if (!questions.includes(answer.question)) questions.push(answer.question);
    }
  }

  /**
   * A Fast Track interview is typed up as prose by whoever ran the call, so it
   * has no question columns to sit in. Kept below the grid as what it is
   * rather than crushed into a single cell or, worse, dropped.
   */
  const gridRows = shown.filter((row) => row.answers.length > 0);
  const noteRows = shown.filter((row) => row.answers.length === 0);

  function toggle(key: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allOpen =
    gridRows.length > 0 && gridRows.every((row) => expanded.has(row.response.key));

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
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
            <span className="type-data-s opacity-70">{counts[segment.id]}</span>
          </button>
        ))}

        {gridRows.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              setExpanded(
                allOpen ? new Set() : new Set(gridRows.map((r) => r.response.key)),
              )
            }
            className="type-caption ml-auto text-secondary hover:text-primary"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        ) : null}
      </div>

      {gridRows.length > 0 ? (
        <div
          className="mt-5 overflow-x-auto rounded-[8px] border border-line"
          // Focusable so the grid can be scrolled sideways from the keyboard,
          // which is otherwise impossible in an overflow container.
          tabIndex={0}
          role="region"
          aria-label="Responses by question"
        >
          <table
            className="w-full table-fixed border-collapse text-left"
            style={{ minWidth: RESPONDENT_PX + questions.length * COLUMN_PX }}
          >
            <thead>
              <tr className="bg-inset">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-inset p-3 align-bottom"
                  style={{ width: RESPONDENT_PX }}
                >
                  <span className="type-caption text-tertiary uppercase">
                    Respondent
                  </span>
                </th>
                {questions.map((question, i) => (
                  <th
                    key={question}
                    scope="col"
                    className="border-l border-line p-3 align-bottom font-normal"
                    style={{ width: COLUMN_PX }}
                  >
                    <span className="type-data-s text-tertiary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="type-caption mt-1 block text-secondary">
                      {question}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridRows.map(({ response, number, answers }) => {
                const verdict = VERDICT[response.confirmed] ?? VERDICT.unsure;
                const open = expanded.has(response.key);
                const byQuestion = new Map(
                  answers.map((a) => [a.question, a.answer]),
                );

                return (
                  <tr
                    key={response.key}
                    className="border-t border-line align-top"
                  >
                    <th
                      scope="row"
                      className={cn(
                        "sticky left-0 z-10 border-l-[3px] bg-page p-3 text-left font-normal",
                        verdict.edge,
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(response.key)}
                        aria-expanded={open}
                        className="type-body-m flex w-full items-center gap-1.5 text-left text-primary"
                      >
                        <CaretDownIcon
                          size={12}
                          weight="bold"
                          aria-hidden="true"
                          className={cn(
                            "shrink-0 text-tertiary transition-transform duration-[120ms]",
                            open ? "rotate-0" : "-rotate-90",
                          )}
                        />
                        {number}
                        <span className="sr-only">
                          {open ? "Collapse" : "Expand"} respondent {number}
                        </span>
                      </button>
                      {/* The verdict is written out as well as tinted, so the
                          grid still reads for somebody who cannot tell the
                          edge colours apart or is looking at it printed. */}
                      <span className="mt-1.5 block">
                        <Badge tone={verdict.tone} dot>
                          {verdict.short}
                        </Badge>
                      </span>
                      {response.meta?.length ? (
                        <span className="type-caption mt-1.5 block text-tertiary">
                          {response.meta.join(" · ")}
                        </span>
                      ) : null}
                      {response.flag ? (
                        <span className="mt-1.5 block">
                          <Badge tone={response.flag.tone}>
                            {response.flag.text}
                          </Badge>
                        </span>
                      ) : null}
                    </th>

                    {questions.map((question) => {
                      const answer = byQuestion.get(question);
                      return (
                        <td
                          key={question}
                          className="border-l border-line p-3"
                          style={{ width: COLUMN_PX }}
                        >
                          {answer ? (
                            <p
                              className={cn(
                                "type-body-m whitespace-pre-wrap text-primary",
                                !open && "line-clamp-5",
                              )}
                            >
                              {answer}
                            </p>
                          ) : (
                            <span
                              className="type-body-m text-tertiary"
                              title="Not asked, or left blank"
                            >
                              &mdash;
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {noteRows.length > 0 ? (
        <div className="mt-5">
          <p className="type-caption text-tertiary uppercase">
            Written up as notes
          </p>
          <ul className="mt-3 space-y-2">
            {noteRows.map(({ response, number }) => {
              const verdict = VERDICT[response.confirmed] ?? VERDICT.unsure;
              return (
                <li
                  key={response.key}
                  className={cn(
                    "rounded-[8px] border border-l-[3px] border-line bg-raised p-4",
                    verdict.edge,
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge tone={verdict.tone} dot>
                      {verdict.label}
                    </Badge>
                    <span className="type-caption text-tertiary">
                      Respondent {number}
                    </span>
                    {response.meta?.length ? (
                      <span className="type-caption text-tertiary">
                        {response.meta.join(" · ")}
                      </span>
                    ) : null}
                    {response.flag ? (
                      <Badge tone={response.flag.tone}>
                        {response.flag.text}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="type-body-m mt-3 whitespace-pre-wrap text-primary">
                    {response.notes}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="type-body-m mt-5 text-tertiary">Nobody answered that way.</p>
      ) : null}
    </div>
  );
}
