"use client";

import * as React from "react";
import {
  ArrowUpIcon,
  PaperclipIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * The idea composer - deliberately the same control as the app's own.
 *
 * Same geometry (16px radius, inset surface, 72px floor, 35vh ceiling), same
 * type scale, same focus behaviour. Someone who types their idea here and
 * then lands in the product should not notice they crossed a boundary; a
 * marketing page that mocks up its own lookalike input quietly breaks that
 * promise the moment the real one looks different.
 *
 * The placeholder is the one deliberate exception, and PLACEHOLDER below says
 * why.
 *
 * What it is NOT yet: the free instant-read widget from the pSEO plan. That
 * needs its own model key, rate limiting, and bot protection before it faces
 * the public internet, none of which exists yet. Faking an "AI read" with no
 * model behind it would be exactly the kind of overstated claim this product
 * refuses to make elsewhere. So today it carries the typed idea into signup
 * instead of discarding it, and becomes the real widget in place later.
 */

/**
 * The empty box asks and offers in one line.
 *
 * It used to cycle four example ideas, on the theory that showing a good
 * answer beats describing one. That works in the app, where the visitor has
 * already decided to be there. Out here the same space has to do a second
 * job: somebody who has never heard of this needs to know what happens after
 * they type, before they will type. The starter chips below still carry the
 * "what does a good answer look like" job.
 *
 * This is the one place the marketing composer deliberately differs from the
 * app's own, which keeps its cycling examples.
 */
const PLACEHOLDER =
  "Tell us about your idea. Get an evidence-backed validation plan in under 60 seconds.";

/**
 * Starters, not categories.
 *
 * Each one seeds the shape of a usable answer rather than a label, because
 * what makes research good is naming who has the problem and what they do
 * about it today. A blank box gets "an app for fitness"; this gets something
 * the agent can actually search for.
 */
export type Starter = { label: string; seed: string };

/**
 * A niche guide's business type, shown as a visible, dismissible tag rather
 * than left implicit in the starter text underneath it.
 *
 * A starter you have to open to read is easy to miss on a page you arrived
 * at from search; a tag sitting on the tool itself says "this is set up for
 * your kind of business" before anyone has typed a word. Dismissible because
 * it is a convenience, not a constraint - a marketplace founder testing an
 * unrelated feature idea should not have to work around a label that no
 * longer applies to what they are typing.
 */
export type ComposerFacet = { label: string };

export type Category = { label: string; seed: string };

/**
 * The kinds of business this works for, as a moving row under the box.
 *
 * Two jobs. It answers "is this for something like mine" faster than any
 * sentence could, and because the row is longer than the screen it implies a
 * breadth a fixed list of four would not. Each chip is clickable and seeds a
 * first sentence, so it replaces the starter chips rather than adding
 * decoration next to them.
 *
 * Not derived from what the founder types. Guessing a category from a
 * half-written sentence and rearranging the row underneath as they type would
 * be a control moving while in use, and wrong often enough to be irritating.
 */
export const CATEGORIES: Category[] = [
  {
    label: "SaaS",
    seed: "We're building a SaaS tool for [who]. Today they handle it with ",
  },
  {
    label: "AI startup",
    seed: "We're building an AI product that [what it does] for [who]. Today they ",
  },
  {
    label: "Marketplace",
    seed: "We're building a marketplace connecting [one side] with [other side]. Right now they find each other by ",
  },
  {
    label: "Fintech",
    seed: "We're building a fintech product for [who] who currently move money by ",
  },
  {
    label: "HealthTech",
    seed: "We're building a health product for [who]. The part of their care that breaks down today is ",
  },
  {
    label: "Developer tool",
    seed: "We're building a developer tool for [who] who currently do [task] by ",
  },
  {
    label: "Creator tool",
    seed: "We're building a tool for creators who [what they make]. The part that costs them most time is ",
  },
  {
    label: "B2B",
    seed: "We're selling to [what kind of company], specifically the person who [their job]. Today they ",
  },
  {
    label: "Consumer app",
    seed: "We're building an app for people who [what they do]. Right now they manage it with ",
  },
  {
    label: "Productivity app",
    seed: "We're building a productivity tool for [who]. The workflow that keeps breaking is ",
  },
  {
    label: "EdTech",
    seed: "We're building a learning product for [who]. Today they learn this by ",
  },
  {
    label: "Logistics",
    seed: "We're building a logistics product for [who] who currently coordinate [what] using ",
  },
];

const STARTERS: Starter[] = [
  {
    label: "A tool for a job people do already",
    seed: "We're building a tool for [who]. Today they [how they handle it now], which means [what goes wrong]. ",
  },
  {
    label: "A marketplace",
    seed: "We're building a marketplace connecting [one side] with [other side]. Right now they find each other by [current method], and the problem with that is ",
  },
  {
    label: "Replacing a spreadsheet",
    seed: "We're replacing the spreadsheet that [who] uses to [task]. It breaks down when ",
  },
  {
    label: "One feature I am unsure about",
    seed: "Our product already does [what]. The part I'm unsure about is [feature], which is meant to solve ",
  },
];

export function IdeaComposer({
  autoFocus,
  className,
  starters = STARTERS,
  categories,
  facet,
  size = "default",
}: {
  autoFocus?: boolean;
  className?: string;
  /**
   * Page-specific starters. An Answer page already knows something about who
   * is reading it, and a starter that names their situation back to them is
   * the difference between a blank box and a half-written first sentence.
   * This is the seam the pSEO templates fill from their own facets.
   *
   * Pass an empty array to drop the row entirely. That is right in a closing
   * call to action, where the reader has already been through the whole page
   * and prompts to get them unstuck are just clutter under the one control
   * that matters.
   */
  starters?: Starter[];
  /**
   * Business categories, as a moving row under the box. Replaces the starter
   * chips when set, rather than appearing alongside them: two rows of things
   * to click under one input is a menu, not a prompt.
   */
  categories?: Category[];
  /** The business type this page is written for, shown as a tag on the tool. */
  facet?: ComposerFacet;
  /**
   * `large` gives the box more presence where it is the only thing being
   * offered, rather than one element among several.
   */
  size?: "default" | "large";
}) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [facetDismissed, setFacetDismissed] = React.useState(false);
  const textarea = React.useRef<HTMLTextAreaElement>(null);

  /**
   * `pending` outlives the fetch on purpose. It is never cleared on success,
   * because the next thing that happens is a navigation and flipping the
   * button back to its resting state first would read as the click having
   * failed.
   */
  const [state, setState] = React.useState<
    | { kind: "idle" }
    | { kind: "pending" }
    | { kind: "error"; message: string; submitted: string }
  >({ kind: "idle" });

  const pending = state.kind === "pending";

  const large = size === "large";

  /**
   * Categories rotate through one fixed row rather than all being listed.
   *
   * Twelve chips wrapped under the box turned the row into a menu and pushed
   * the fold; a marquee kept it to one line but put every label in the DOM
   * twice and made the chips moving targets. Showing a few at a time and
   * swapping them keeps one row, keeps the whole list reachable over a few
   * seconds, and leaves every chip a stationary thing to click.
   *
   * Three on a phone, five once there is room. The count is measured after
   * mount rather than guessed during render, and it starts at the mobile
   * count so the server and the first client paint agree.
   */
  const [slots, setSlots] = React.useState(3);
  const [offset, setOffset] = React.useState(0);
  const [rotating, setRotating] = React.useState(true);

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const apply = () => setSlots(query.matches ? 5 : 3);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    if (!categories || categories.length <= slots) return;
    if (!rotating) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(
      () => setOffset((o) => (o + slots) % categories.length),
      3200,
    );
    return () => clearInterval(id);
  }, [categories, slots, rotating]);

  // Wraps rather than running short at the end of the list, so the row is
  // always full and the last group never renders as a single stray chip.
  const visibleCategories = categories
    ? Array.from(
        { length: Math.min(slots, categories.length) },
        (_, i) => categories[(offset + i) % categories.length],
      )
    : [];

  // Identical growth rule to the app's composer.
  React.useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    const ceiling = Math.min(320, Math.round(window.innerHeight * 0.35));
    el.style.height = "auto";
    const floor = large ? 116 : 72;
    el.style.height = `${Math.max(floor, Math.min(el.scrollHeight, Math.max(96, ceiling)))}px`;
  }, [value, large]);

  /**
   * Manual-first: SaaS research flow disabled. The composer now hands the
   * founder off to direct contact — email pre-filled with what they typed,
   * or the booking link. No API call, no token, no signup.
   */
  async function submit() {
    const description = value.trim();
    if (description.length < 20 || pending) return;

    setState({ kind: "pending" });
    // Give a brief tick for UX, then open mail client with the idea
    const subject = encodeURIComponent("BRAINS AI — idea to validate");
    const body = encodeURIComponent(
      `Hi Stanley,\n\nI'd like to validate this idea:\n\n${description}\n\n---\nSent from brains.im`,
    );
    window.location.href = `mailto:stanley@nexabrains.io?subject=${subject}&body=${body}`;
    setState({ kind: "idle" });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "rounded-[16px] bg-inset transition-colors duration-[120ms]",
          "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25",
          // A stronger resting border at large size, so the box reads as the
          // thing to use rather than as another panel on the page.
          large ? "border-2 border-line-strong" : "border border-line",
        )}
      >
        {facet && !facetDismissed ? (
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <span className="type-caption text-secondary">
              Tailored to{" "}
              <span className="font-medium text-primary">{facet.label}</span>
            </span>
            <button
              type="button"
              onClick={() => setFacetDismissed(true)}
              aria-label="Remove context"
              className="text-tertiary transition-colors duration-[120ms] hover:text-primary"
            >
              <XIcon size={13} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {/* A real placeholder rather than the animated overlay this used to
            carry. An instruction that types itself out, deletes and retypes is
            a distraction from the thing it is instructing you to do, and the
            native attribute is announced by screen readers for free. */}
        <div className="relative overflow-hidden">
          <textarea
            ref={textarea}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={PLACEHOLDER}
            rows={1}
            autoFocus={autoFocus}
            aria-label="Describe your idea"
            data-focus-ring="none"
            className={cn(
              "relative block w-full resize-none bg-transparent",
              "text-primary placeholder:text-tertiary focus:outline-none",
              large ? "type-body-xl px-5 pt-5 pb-2" : "type-body-l px-4 pt-4 pb-2",
            )}
          />
        </div>

        <div
          className={cn(
            "flex items-center gap-2",
            large ? "px-4 pt-1 pb-4" : "px-3 pt-1 pb-3",
          )}
        >
          {/* Attachments are handled manually for now — opens contact. */}
          <button
            type="button"
            onClick={submit}
            aria-label="Contact us to share documents"
            title="Contact us to share documents"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border border-line",
              "text-secondary transition-colors duration-[120ms]",
              "hover:border-line-strong hover:text-primary",
            )}
          >
            <PaperclipIcon size={15} aria-hidden="true" />
          </button>

          {/* Deliberately empty. The reassurance line lives once, beneath the
              composer, rather than being repeated inside it. */}
          <span className="flex-1" aria-hidden="true" />

          <button
            type="button"
            onClick={submit}
            disabled={pending || value.trim().length < 20}
            aria-label="Get a first read on this idea"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              "bg-brand text-on-accent transition-colors duration-[120ms] hover:bg-brand-hover",
              // Disabled until there is enough to reason about. A read
              // generated from four words is worse than no read at all, and
              // the founder would blame the product rather than the input.
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand",
            )}
          >
            <ArrowUpIcon size={15} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Held here rather than on the results page, because the wait before
          navigation is the one moment the visitor has no feedback at all. */}
      {pending ? (
        <p className="type-body-m mt-3 text-tertiary" aria-live="polite">
          Starting your research...
        </p>
      ) : null}

      {state.kind === "error" ? (
        <div className="mk-panel mt-4 p-5">
          <p className="type-body-m text-primary">{state.message}</p>
          <a
            href={`mailto:stanley@nexabrains.io?subject=${encodeURIComponent("BRAINS AI — idea to validate")}&body=${encodeURIComponent(state.submitted)}`}
            className="type-body-m mt-3 inline-block text-brand hover:underline"
          >
            Email us this idea
          </a>
        </div>
      ) : null}

      {/* Categories take the row when set. Like the starters they vanish the
          moment there is anything typed: chips under a paragraph somebody is
          mid-way through writing are noise. */}
      {value.length === 0 && categories && categories.length > 0 ? (
        <div
          className="mt-4 flex h-10 items-center justify-center gap-2"
          onMouseEnter={() => setRotating(false)}
          onMouseLeave={() => setRotating(true)}
        >
          {visibleCategories.map((category) => (
            <button
              key={category.label}
              type="button"
              onClick={() => {
                setValue(category.seed);
                textarea.current?.focus();
              }}
              className={cn(
                "type-body-m mk-rise shrink-0 rounded-full border border-line bg-raised px-4 py-2",
                "whitespace-nowrap text-secondary transition-colors duration-[120ms]",
                "hover:border-line-strong hover:text-primary",
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Starters disappear the moment there is anything to say - they exist
          to get someone unstuck, not to sit under a paragraph they have
          already written. An empty `starters` array drops the row entirely. */}
      {value.length === 0 && !categories && starters.length > 0 ? (
        /**
         * One scrolling row on a phone, wrapped and centred once there is
         * room - the app's entry screen behaves identically.
         *
         * The app bleeds this row to the screen edge to say "scrollable
         * rather than clipped". It cannot here: this composer is dropped into
         * four different wrappers, one of them a padded card on the pSEO
         * page, so a negative margin would break out of it. A fade on the
         * trailing edge says the same thing and does not care what contains
         * it.
         */
        <div
          className={cn(
            "mt-3 overflow-x-auto",
            "[mask-image:linear-gradient(to_right,#000_calc(100%_-_28px),transparent)]",
            "sm:overflow-x-visible sm:[mask-image:none]",
          )}
        >
          <div className="flex gap-2 sm:flex-wrap sm:justify-center">
            {starters.map((starter) => (
              <button
                key={starter.label}
                type="button"
                onClick={() => setValue(starter.seed)}
                className={cn(
                  "type-body-m shrink-0 rounded-full border border-line bg-raised px-3 py-1.5",
                  "whitespace-nowrap text-secondary transition-colors duration-[120ms]",
                  "hover:border-line-strong hover:text-primary sm:whitespace-normal",
                )}
              >
                {starter.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
