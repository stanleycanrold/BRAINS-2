"use client";

import * as React from "react";
import {
  ArrowSquareOutIcon,
  CheckIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/**
 * One real run, followed all the way through, directly under the hero.
 *
 * This replaces the invented product dashboard that used to sit here. The
 * mockup showed a plausible interface with made-up numbers and a disclaimer
 * underneath, which is a weaker version of exactly this idea: a founder
 * cannot evaluate a screenshot of a UI, but they can evaluate the actual
 * output. Showing the artifact instead of the chrome is also the only version
 * that survives this product's own evidence standard.
 *
 * Every stage below is a real capability with an agent behind it: research,
 * the strengthen pass the founder accepts or rejects, the community shortlist
 * and question set, and the scored decision gate.
 *
 * The rail doubles as the progress indicator, which is why there is no
 * separate row of dots. Auto-advance stops permanently on the first click,
 * because someone who has taken control should not have the panel move under
 * them, and pauses on hover so it cannot change while being read.
 */

const STAGE_MS = 5200;

/**
 * The app's own pipeline, not a marketing retelling of it.
 *
 * These are PIPELINE_STAGES from src/lib/domain/types.ts - entry, research,
 * validate, decide - and the same four steps the product's top bar shows a
 * signed-in founder. A landing page that walks through a different sequence
 * than the app teaches someone a flow they then have to unlearn on their
 * first run.
 */
const STAGES = [
  { n: "01", label: "Describe", caption: "A paragraph is enough." },
  { n: "02", label: "Research", caption: "We read what exists, and cite it." },
  { n: "03", label: "Validate", caption: "Named places. Real questions." },
  { n: "04", label: "Decide", caption: "A score with its reasoning." },
];

export function LiveRun() {
  const [active, setActive] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [manual, setManual] = React.useState(false);
  const frame = React.useRef(0);

  React.useEffect(() => {
    if (paused || manual) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let start = performance.now();
    const loop = (now: number) => {
      const pct = Math.min(((now - start) / STAGE_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        start = now;
        setActive((a) => (a + 1) % STAGES.length);
      }
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame.current);
  }, [paused, manual]);

  function pick(i: number) {
    setManual(true);
    setActive(i);
    setProgress(0);
  }

  return (
    <div
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* This line introduces the whole demonstration, so it carries body-l
          rather than the caption size it started at. The reassurance beside
          it stays small on purpose: it is a footnote, not a headline, and
          matching the two would flatten the hierarchy between them. */}
      <div className="flex flex-col gap-2 pb-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
        <p className="type-body-l text-secondary">
          A real run, on{" "}
          <span className="font-medium text-primary">
            &ldquo;booking tool for solo dog groomers&rdquo;
          </span>
        </p>
        <p className="type-caption shrink-0 text-tertiary">
          Free to start. No card. Nothing you type is lost at signup.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="What happens after you submit"
        className="mk-grid grid-cols-2 rounded-b-none sm:grid-cols-4"
      >
        {STAGES.map((stage, i) => {
          const on = i === active;
          return (
            <button
              key={stage.n}
              role="tab"
              aria-selected={on}
              aria-controls="run-panel"
              onClick={() => pick(i)}
              className={cn(
                "relative overflow-hidden px-5 py-4 text-left transition-colors duration-[160ms]",
                on ? "bg-raised" : "hover:bg-raised/60",
              )}
            >
              <span className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "type-data-s",
                    on ? "text-brand" : "text-tertiary",
                  )}
                >
                  {stage.n}
                </span>
                <span
                  className={cn(
                    "type-body-m font-medium",
                    on ? "text-primary" : "text-secondary",
                  )}
                >
                  {stage.label}
                </span>
              </span>
              <span className="type-caption mt-1.5 block text-tertiary">
                {stage.caption}
              </span>

              {on ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[2px] bg-brand"
                  style={{ width: manual ? "100%" : `${progress}%` }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Fixed minimum height so switching stages never shifts the page. */}
      <div
        id="run-panel"
        role="tabpanel"
        className="mk-panel min-h-[176px] rounded-t-none border-t-0 p-6 sm:p-7"
      >
        {active === 0 ? <StageDescribe /> : null}
        {active === 1 ? <StageResearch /> : null}
        {active === 2 ? <StageValidate /> : null}
        {active === 3 ? <StageDecide /> : null}
      </div>
    </div>
  );
}

function StageDescribe() {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
      <div className="min-w-0">
        <p className="type-eyebrow text-tertiary">What you typed</p>
        <p className="type-body-xl mt-3 max-w-[52ch] text-pretty text-primary">
          &ldquo;Solo dog groomers still run their whole book out of a paper
          diary, and a no-show leaves a two hour hole they cannot fill.&rdquo;
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="type-caption rounded-full border border-line px-3 py-1.5 text-secondary">
            Saved before anything runs
          </span>
          <span className="type-caption rounded-full border border-line px-3 py-1.5 text-secondary">
            Deck or link optional
          </span>
        </div>
      </div>
      <p className="type-caption shrink-0 leading-relaxed text-tertiary lg:max-w-[15rem]">
        <span className="text-primary">No form to fill.</span> Who it is for
        and where they are get asked next, once there is something to ask
        about.
      </p>
    </div>
  );
}

/**
 * Research carries the proposed change as well as the finding, because that
 * is where it lives in the product: `proposed_changes` is a field on
 * researchReportSchema, not a stage of its own. An earlier version split it
 * out as a fifth step called "Strengthen", which invented a stage the app
 * does not have.
 */
function StageResearch() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
      <div className="min-w-0 lg:flex-1">
        <p className="type-eyebrow text-tertiary">What we found</p>
        <p className="type-body-xl mt-3 max-w-[46ch] text-pretty text-primary">
          No-shows and late cancellations are the most cited revenue leak for
          solo groomers, not pricing, and not finding clients.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="type-caption inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-secondary">
            <ArrowSquareOutIcon size={12} aria-hidden="true" />3 sources
          </span>
          <span className="type-caption rounded-full bg-brand-subtle px-3 py-1.5 font-medium text-brand">
            Medium confidence
          </span>
        </div>
        <p className="type-caption mt-4 max-w-[36ch] leading-relaxed text-tertiary">
          <span className="text-primary">Not verified:</span> what that
          actually costs per month. We flag the gap instead of estimating a
          number for you.
        </p>
      </div>

      <div className="min-w-0 border-t border-line pt-6 lg:w-[46%] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
        <p className="type-eyebrow text-tertiary">Proposed change</p>
        <p className="type-body-l mt-3 font-medium text-pretty text-primary">
          Narrow to solo groomers with 15+ weekly appointments, not multi-site
          salons.
        </p>
        <p className="type-body-m mt-2.5 text-secondary">
          Multi-site salons already buy software. The paper diary survives at
          the solo end, which is where your wedge is.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="type-caption inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 font-medium text-on-accent">
            <CheckIcon size={12} weight="bold" aria-hidden="true" />
            Accept
          </span>
          <span className="type-caption inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-secondary">
            <XIcon size={12} weight="bold" aria-hidden="true" />
            Reject
          </span>
        </div>
        <p className="type-caption mt-3 text-tertiary">
          Your call. Nothing changes unless you accept it.
        </p>
      </div>
    </div>
  );
}

function StageValidate() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:gap-12">
      <div className="min-w-0">
        <p className="type-eyebrow text-tertiary">
          Where these people already are
        </p>
        <ul className="mt-3.5 flex flex-col gap-2.5">
          <li className="type-body-m flex items-center gap-2.5 text-primary">
            <UsersThreeIcon size={15} className="text-brand" aria-hidden="true" />
            r/doggrooming
            <span className="text-tertiary">48k members</span>
          </li>
          <li className="type-body-m flex items-center gap-2.5 text-primary">
            <UsersThreeIcon size={15} className="text-brand" aria-hidden="true" />
            Dog Grooming Business UK
            <span className="text-tertiary">Facebook, 12k</span>
          </li>
        </ul>
      </div>
      <div className="min-w-0 lg:max-w-sm">
        <p className="type-eyebrow text-tertiary">Ask them this</p>
        <p className="type-body-l mt-3.5 text-pretty text-primary">
          &ldquo;Walk me through the last time a client didn&apos;t show up.
          What did you do next?&rdquo;
        </p>
        <p className="type-caption mt-2.5 text-tertiary">
          Drafted for each thread, so you never start from a blank box.
        </p>
      </div>
    </div>
  );
}

function StageDecide() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="type-data-l text-primary">62</span>
          <span className="type-body-m text-tertiary">/ 100</span>
          <span className="type-caption rounded-full bg-brand-subtle px-3 py-1.5 font-medium text-brand">
            Worth building, with one change
          </span>
        </div>
        <div
          role="img"
          aria-label="Score 62 out of 100"
          className="mt-5 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-inset"
        >
          <div className="h-full w-[62%] rounded-full bg-brand" />
        </div>
        <p className="type-body-m mt-4 max-w-[52ch] text-secondary">
          <span className="text-primary">Biggest risk:</span> they may tolerate
          no-shows rather than pay to prevent them.
        </p>
      </div>
      <p className="type-caption shrink-0 leading-relaxed text-tertiary lg:max-w-[15rem]">
        Below 50 you get a rethink with a diagnosis, never a silent kill, and
        never a number without its reasoning.
      </p>
    </div>
  );
}
