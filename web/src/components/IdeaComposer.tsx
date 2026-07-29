"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpIcon, PaperclipIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { signUpUrl } from "@/lib/app-url";
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

const EXAMPLES = [
  "A tool for freelancers who lose hours chasing unpaid invoices…",
  "A marketplace putting small farms in touch with restaurants…",
  "Replacing the spreadsheet receptionists use for appointments…",
  "An app for parents splitting the childcare run each week…",
];

export function IdeaComposer({
  autoFocus,
  className,
}: {
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
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
    const trimmed = value.trim();
    // Signup carries the context through rather than making anyone retype
    // what they already gave us (UX guide, Part 10). This raw query param is
    // an interim mechanism; it becomes a signed short-lived token once Clerk
    // satellite domains are wired up.
    router.push(
      trimmed ? `${signUpUrl}?draft=${encodeURIComponent(trimmed)}` : signUpUrl,
    );
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
          {/* Attachments are a signed-in capability, so this points into the
              product rather than pretending to accept a file here. */}
          <a
            href={signUpUrl}
            aria-label="Attach documents (sign up first)"
            title="Attach documents"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border border-line",
              "text-secondary transition-colors duration-[120ms]",
              "hover:border-line-strong hover:text-primary",
            )}
          >
            <PaperclipIcon size={15} aria-hidden="true" />
          </a>

          <span className="type-caption min-w-0 flex-1 truncate text-tertiary">
            Free to start. No card required.
          </span>

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
    </div>
  );
}
