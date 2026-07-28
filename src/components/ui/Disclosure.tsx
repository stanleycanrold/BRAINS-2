"use client";

import * as React from "react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { usePersistedFlag } from "@/lib/client-state";

/**
 * A section that can be folded away.
 *
 * The research report is genuinely long - verdict, evidence, competitors and
 * proposals all matter, but not all at once, and a founder scrolling past
 * three screens of detail to reach the thing they came for reads it less
 * carefully, not more.
 *
 * Two decisions worth keeping:
 *
 *  1. The state persists per section. Someone who folds competitors away is
 *     usually done with competitors, and having it spring open on every visit
 *     makes the control feel like it didn't work.
 *
 *  2. Collapsed content is unmounted, not hidden with CSS. Hidden content is
 *     still reachable by screen readers and by in-page search, which is how a
 *     "collapsed" section ends up read aloud in full.
 */
export function Disclosure({
  title,
  count,
  summary,
  storageKey,
  defaultOpen = false,
  children,
  className,
  flush,
}: {
  title: string;
  /** Shown beside the title - how much is inside, without opening it. */
  count?: number;
  /** One line describing the contents while collapsed. */
  summary?: string;
  /**
   * Persists the open/closed choice. Omit for sections whose state shouldn't
   * outlive the visit.
   */
  storageKey?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Drops the panel chrome, for when it already sits inside a card. */
  flush?: boolean;
}) {
  const [persisted, setPersisted] = usePersistedFlag(
    storageKey ?? "__disclosure_unused",
    defaultOpen,
  );
  const [local, setLocal] = React.useState(defaultOpen);

  const open = storageKey ? persisted : local;
  const setOpen = storageKey ? setPersisted : setLocal;

  const id = React.useId();

  return (
    <section
      className={cn(
        flush ? "border-t border-line" : "rounded-[12px] border border-line bg-raised",
        className,
      )}
    >
      <h2>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={id}
          className={cn(
            "flex w-full items-center gap-3 text-left",
            "transition-colors duration-[120ms] hover:bg-wash-hover",
            flush
              ? "-mx-2 w-[calc(100%+1rem)] rounded-[8px] px-2 py-3"
              : "rounded-[12px] px-5 py-4",
          )}
        >
          <CaretRightIcon
            size={15}
            weight="bold"
            aria-hidden="true"
            className={cn(
              "shrink-0 text-tertiary transition-transform duration-[150ms]",
              open && "rotate-90",
            )}
          />
          <span className="type-display-m min-w-0 flex-1 text-primary">
            {title}
            {typeof count === "number" ? (
              <span className="type-body-m ml-2 text-tertiary">{count}</span>
            ) : null}
          </span>
          {!open && summary ? (
            <span className="type-body-m hidden truncate text-tertiary sm:block sm:max-w-[45%]">
              {summary}
            </span>
          ) : null}
        </button>
      </h2>

      {open ? (
        <div
          id={id}
          className={cn(
            flush ? "pt-1 pb-1" : "border-t border-line px-5 py-5 sm:px-6",
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
