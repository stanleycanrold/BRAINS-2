"use client";

import * as React from "react";
import Link from "next/link";
import { CheckIcon, CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import {
  ResearchReport,
  type Report,
  type Structured,
} from "@/components/ResearchReport";
import { researchStatusUrl } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { RESEARCH_STEPS, RESEARCH_STEP_MS } from "@shared/research-steps";

type Payload = {
  ready: boolean;
  title: string;
  description: string;
  structured: Structured;
  report: Report | null;
};

/**
 * The waiting room and the report, at one address.
 *
 * A full research pass takes roughly a minute and a half, which is a long
 * time to hold someone who arrived from a search result. Three decisions come
 * out of that, and they are the whole design of this screen.
 *
 * First, the token is in the URL, so this page survives a reload and can be
 * sent to a co-founder. Work already paid for is never lost to a stray
 * refresh.
 *
 * Second, the progress is real. The pipeline writes the extracted problem and
 * audience to the record well before the report exists, so the moment those
 * land they are shown. The visitor gets something true to read at roughly
 * fifteen seconds instead of watching a bar that is only a timer wearing a
 * costume. It also doubles as a correctness check they can make early: if we
 * have misread the idea, they can see it before the sources come back.
 *
 * Third, nothing here asks for an account. Not a soft wall, not an email
 * field, not a blurred section. These are the highest-intent visitors the
 * site gets and they do not know the product yet.
 */
export function ResearchClient({ token }: { token: string }) {
  const [data, setData] = React.useState<Payload | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  /**
   * Whether extraction has landed, recorded once by the poll that saw it,
   * and how many timer ticks have passed since.
   *
   * Two pieces of state rather than one timestamp because the step has to be
   * derivable during render without calling a clock: reading `Date.now()`
   * while rendering makes the output depend on when React happened to run,
   * which is exactly what the purity rule exists to prevent.
   */
  const [understood, setUnderstood] = React.useState(false);
  const [ticks, setTicks] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    let attempts = 0;

    async function poll() {
      if (!live) return;
      attempts += 1;

      try {
        const res = await fetch(`${researchStatusUrl}?token=${encodeURIComponent(token)}`);
        if (res.status === 404) {
          setFailed("We could not find that report. The link may be wrong.");
          return;
        }

        const payload = (await res.json()) as Payload;
        if (!live) return;
        setData(payload);
        if (payload.structured?.problem_statement) setUnderstood(true);
        if (payload.ready) return;
      } catch {
        // Transient network failures are expected over a ninety second poll,
        // and retrying silently is kinder than showing an error for one
        // dropped request. The attempt ceiling below is what eventually gives
        // up rather than any single failure.
      }

      /**
       * Roughly three minutes of polling: fast at the start because
       * extraction lands early and is worth showing the moment it does, then
       * easing off so a slow run is not hammering the endpoint.
       */
      if (attempts > 60) {
        setFailed(
          "This is taking longer than it should. Your idea is saved, so the link will keep working if you come back.",
        );
        return;
      }

      setTimeout(poll, attempts < 8 ? 2000 : 4000);
    }

    poll();
    return () => {
      live = false;
    };
  }, [token]);

  /**
   * The run, narrated, matching what the product shows for the same work.
   *
   * The first step is driven by the record rather than a clock: the moment
   * extraction writes a problem statement, reading is genuinely finished and
   * the list moves on. After that the pipeline reports nothing between the
   * five searches and the research call, so the remaining steps advance on a
   * timer, and they stop at the last one rather than completing it. Showing
   * a tick against work that may still be running would be the one dishonest
   * thing this screen could do.
   */
  React.useEffect(() => {
    if (!understood) return;
    const timer = setInterval(() => setTicks((n) => n + 1), RESEARCH_STEP_MS);
    return () => clearInterval(timer);
  }, [understood]);

  // Step one is complete the moment extraction lands; the rest follow the
  // clock. Capped at the last step rather than past it, so nothing is ever
  // ticked off while it may still be running.
  const step = understood ? Math.min(1 + ticks, RESEARCH_STEPS.length - 1) : 0;

  if (failed) {
    return (
      <Shell>
        <p className="type-body-l text-secondary">{failed}</p>
        <Link href="/" className="type-body-m mt-4 inline-block text-brand hover:underline">
          Start again
        </Link>
      </Shell>
    );
  }

  if (data?.ready && data.report) {
    // Renders its own full-bleed sections rather than sitting inside the
    // waiting shell, so the report uses the whole page the way every other
    // screen on this site does.
    return (
      <ResearchReport
        report={data.report}
        structured={data.structured}
        title={data.title}
        draft={data.description}
      />
    );
  }


  /**
   * The waiting screen occupies the same panel the report will, so nothing
   * resizes when the findings land: the frame is already the right shape and
   * only its contents change.
   */
  return (
    <Shell>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-[1100px]">
          <ol className="space-y-3" aria-live="polite">
            {RESEARCH_STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li
                  key={label}
                  className={cn(
                    "type-body-l flex items-center gap-3 transition-colors duration-300",
                    done && "text-secondary",
                    active && "text-primary",
                    !done && !active && "text-tertiary",
                  )}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    {done ? (
                      <CheckIcon size={16} weight="bold" className="text-success" aria-hidden="true" />
                    ) : active ? (
                      <CircleNotchIcon
                        size={15}
                        className="animate-spin text-brand"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current opacity-50" />
                    )}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>

          {/* Shown the moment extraction lands, which is both the early payoff
              and the visitor's first chance to catch us misreading them, well
              before the sources come back. */}
          {understood && data ? (
            <div className="mt-9 grid gap-3 border-t border-line pt-8 sm:grid-cols-3">
              <Pair term="The problem" value={data.structured.problem_statement} />
              <Pair term="Who has it" value={data.structured.icp} />
              <Pair term="What changes for them" value={data.structured.value_prop} />
            </div>
          ) : null}

          <p className="type-caption mt-9 text-tertiary">
            Usually about a minute. You can leave this page: the work keeps
            going and this link stays good, so you can come back to it or send
            it to someone.
          </p>
        </div>
      </div>
    </Shell>
  );
}

function Pair({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-raised p-4">
      <p className="type-eyebrow text-tertiary">{term}</p>
      <p className="type-body-m mt-2 text-secondary">{value || "..."}</p>
    </div>
  );
}

/**
 * The same viewport-height frame the finished report uses, so the waiting
 * state, the failure state and the result all sit in one shape.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100dvh-var(--nav-h))] flex-col">
      <div className="mk-panel-flush flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4 lg:px-7">
          <div className="min-w-0">
            <p className="type-eyebrow text-tertiary">Your research brief</p>
            <h1 className="type-body-l mt-1 truncate font-medium text-primary">
              Working on it
            </h1>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
