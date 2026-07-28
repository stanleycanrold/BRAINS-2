"use client";

import * as React from "react";
import {
  PlusIcon,
  ArrowUpIcon,
  XIcon,
  FileTextIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import {
  MIN_IDEA,
  MAX_IDEA,
  describeIdeaProblem,
} from "@/lib/domain/limits";

/**
 * The idea composer.
 *
 * One box, with everything else tucked into it: attachments go in on the left,
 * the idea gets sent from the right, and nothing competes with the cursor.
 * The container carries the border and focus ring rather than the textarea, so
 * the whole thing reads as a single surface instead of a form control sitting
 * inside a card.
 *
 * The textarea grows with the content up to a ceiling and then scrolls, which
 * keeps a two-line idea from sitting in a box built for twenty while still
 * letting someone write properly.
 */

export type Attachment = { name: string; excerpt: string };

// The limits live in the domain layer so the server enforces the same ones.
export { MIN_IDEA, MAX_IDEA } from "@/lib/domain/limits";

export function IdeaComposer({
  value,
  onChange,
  onSubmit,
  attachments,
  onAttach,
  onRemoveAttachment,
  reading,
  submitting,
  placeholder = "Describe what you're building…",
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  attachments: Attachment[];
  onAttach: (files: FileList | null) => void;
  onRemoveAttachment: (index: number) => void;
  reading?: boolean;
  submitting?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const fileInput = React.useRef<HTMLInputElement>(null);
  const textarea = React.useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  // Same check the server runs, so the send button never promises something
  // the API will refuse.
  const problem = describeIdeaProblem(value);
  const ready = problem === null;
  const tooLong = trimmed.length > MAX_IDEA;

  // Grow to fit, then scroll. Done on every render rather than on change so
  // it is also correct when the value is set from outside (a starter chip).
  React.useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [value]);

  function onKeyDown(event: React.KeyboardEvent) {
    // Enter sends, Shift+Enter breaks the line. Matches every chat box people
    // already use, so nobody has to learn it.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (ready && !submitting) onSubmit();
    }
  }

  return (
    <div>
      <div
        className={cn(
          "rounded-[16px] border bg-inset transition-colors duration-[120ms]",
          "focus-within:border-brand/60",
          tooLong ? "border-danger/60" : "border-line",
        )}
      >
        {attachments.length > 0 ? (
          <ul className="flex flex-wrap gap-2 px-3 pt-3">
            {attachments.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="type-body-m inline-flex max-w-full items-center gap-2 rounded-[8px] border border-line bg-raised py-1 pr-1 pl-2.5 text-secondary"
              >
                <FileTextIcon size={14} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">{file.name}</span>
                {!file.excerpt ? (
                  <span className="type-caption shrink-0 text-tertiary">
                    unreadable
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemoveAttachment(i)}
                  className="shrink-0 rounded-[6px] p-1 text-tertiary transition-colors hover:bg-wash-hover hover:text-primary"
                >
                  <XIcon size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <textarea
          ref={textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          autoFocus={autoFocus}
          aria-label="Describe your idea"
          className={cn(
            "type-body-l block w-full resize-none bg-transparent px-4 pt-4 pb-2",
            "text-primary placeholder:text-tertiary focus:outline-none",
          )}
        />

        <div className="flex items-center gap-2 px-3 pt-1 pb-3">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.csv,.json"
            className="sr-only"
            onChange={(e) => onAttach(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={reading}
            aria-label="Attach documents"
            title="Attach documents"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border border-line",
              "text-secondary transition-colors duration-[120ms]",
              "hover:border-line-strong hover:text-primary disabled:opacity-50",
            )}
          >
            {reading ? (
              <SpinnerGapIcon
                size={15}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <PlusIcon size={15} aria-hidden="true" />
            )}
          </button>

          <span className="type-caption min-w-0 flex-1 truncate text-tertiary">
            {tooLong
              ? `${trimmed.length.toLocaleString()} characters. Trim it to ${MAX_IDEA.toLocaleString()}, or attach the long version.`
              : trimmed.length > 0 && trimmed.length < MIN_IDEA
                ? `${MIN_IDEA - trimmed.length} more characters`
                : trimmed.length > 0 && !ready
                  ? "What is the situation, and what goes wrong today?"
                  : ""}
          </span>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!ready || submitting}
            aria-label="Continue"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              "transition-colors duration-[120ms]",
              ready && !submitting
                ? "bg-brand text-on-accent hover:bg-brand-hover"
                : "bg-wash-hover text-tertiary",
            )}
          >
            {submitting ? (
              <SpinnerGapIcon
                size={15}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <ArrowUpIcon size={15} weight="bold" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
