"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpIcon,
  PaperclipIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { signUpUrl, signUpWithDraft } from "@/lib/urls";
import { useTypewriter } from "@/lib/use-typewriter";

/**
 * The idea composer - deliberately the same control as the app's own.
 *
 * Same geometry (16px radius, inset surface, 72px floor, 35vh ceiling), same
 * type scale, same focus behaviour, same cycling examples. Someone who types
 * their idea here and then lands in the product should not notice they
 * crossed a boundary; a marketing page that mocks up its own lookalike input
 * quietly breaks that promise the moment the real one looks different.
 *
 * What it is NOT yet: the free instant-read widget from the pSEO plan. That
 * needs its own model key, rate limiting, and bot protection before it faces
 * the public internet, none of which exists yet. Faking an "AI read" with no
 * model behind it would be exactly the kind of overstated claim this product
 * refuses to make elsewhere. So today it carries the typed idea into signup
 * instead of discarding it, and becomes the real widget in place later.
 */

/**
 * Duplicated from the app's entry screen rather than shared, because `web` is
 * a standalone Next app that cannot import across the boundary. Both lists
 * have to be edited together - the point of this component is that the two
 * boxes are indistinguishable.
 */
const EXAMPLES = [
  "A tool for freelancers who lose hours chasing unpaid invoices…",
  "A marketplace putting small farms in touch with restaurants…",
  "Replacing the spreadsheet receptionists use for appointments…",
  "An app for parents splitting the childcare run each week…",
];

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
  facet,
}: {
  autoFocus?: boolean;
  className?: string;
  /**
   * Page-specific starters. An Answer page already knows something about who
   * is reading it, and a starter that names their situation back to them is
   * the difference between a blank box and a half-written first sentence.
   * This is the seam the pSEO templates fill from their own facets.
   */
  starters?: Starter[];
  /** The business type this page is written for, shown as a tag on the tool. */
  facet?: ComposerFacet;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [facetDismissed, setFacetDismissed] = React.useState(false);
  const textarea = React.useRef<HTMLTextAreaElement>(null);

  const typed = useTypewriter(EXAMPLES, { enabled: value.length === 0 });
  const showTypewriter = value.length === 0;

  // Identical growth rule to the app's composer.
  React.useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    const ceiling = Math.min(320, Math.round(window.innerHeight * 0.35));
    el.style.height = "auto";
    const floor = 72;
    el.style.height = `${Math.max(floor, Math.min(el.scrollHeight, Math.max(96, ceiling)))}px`;
  }, [value]);

  function submit() {
    // Signup carries the idea through rather than making anyone retype what
    // they already gave us (UX guide, Part 10). The app reads it back off the
    // query string and seeds its own composer with it. A raw param for now; it
    // becomes a signed short-lived token once Clerk satellite domains are up.
    router.push(signUpWithDraft(value));
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
          "rounded-[16px] border border-line bg-inset transition-colors duration-[120ms]",
          "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25",
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

        <div className="relative overflow-hidden">
          {showTypewriter ? (
            <div
              aria-hidden="true"
              className="type-body-l pointer-events-none absolute inset-0 overflow-hidden px-4 pt-4 pb-2 text-tertiary"
            >
              <span>{typed}</span>
              <span className="ml-px inline-block h-[1.1em] w-px translate-y-[0.18em] animate-pulse bg-tertiary" />
            </div>
          ) : null}

          <textarea
            ref={textarea}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={showTypewriter ? "" : "Describe what you're building…"}
            rows={1}
            autoFocus={autoFocus}
            aria-label="Describe your idea"
            data-focus-ring="none"
            className={cn(
              "type-body-l relative block w-full resize-none bg-transparent",
              "px-4 pt-4 pb-2",
              "text-primary placeholder:text-tertiary focus:outline-none",
            )}
          />
        </div>

        <div className="flex items-center gap-2 px-3 pt-1 pb-3">
          {/* Attaching a document is a signed-in capability. The control stays
              visible so the capability is discoverable, but it sends you to
              sign up rather than opening a file picker that could not do
              anything useful with the file out here. */}
          <a
            href={signUpUrl}
            aria-label="Sign up to attach documents"
            title="Sign up to attach documents"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border border-line",
              "text-secondary transition-colors duration-[120ms]",
              "hover:border-line-strong hover:text-primary",
            )}
          >
            <PaperclipIcon size={15} aria-hidden="true" />
          </a>

          {/* Deliberately empty. The reassurance line lives once, beneath the
              composer, rather than being repeated inside it. */}
          <span className="flex-1" aria-hidden="true" />

          <button
            type="button"
            onClick={submit}
            aria-label="Continue with this idea"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              "bg-brand text-on-accent transition-colors duration-[120ms] hover:bg-brand-hover",
            )}
          >
            <ArrowUpIcon size={15} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Starters disappear the moment there is anything to say - they exist
          to get someone unstuck, not to sit under a paragraph they have
          already written. */}
      {value.length === 0 ? (
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
