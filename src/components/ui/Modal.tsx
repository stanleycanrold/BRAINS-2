"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/**
 * Design system §3.7.
 *
 * Reserved for irreversible / high-consequence actions ONLY — killing an idea,
 * confirming a Fast Track payment, deleting an account. Never for routine
 * multi-step flows; those live on their own pages (§Part 6 anti-patterns).
 *
 * Implements a focus trap, Escape-to-close, scroll lock, and returns focus to
 * the trigger on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog once it's mounted.
    const raf = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? panelRef.current)?.focus();
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="animate-fade-in absolute inset-0 bg-scrim"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-rise relative w-full max-w-[480px] rounded-[12px] border border-line",
          "bg-raised shadow-[var(--shadow-overlay)] outline-none",
        )}
      >
        <div className="px-6 pt-6 pb-4">
          <h2
            id={titleId}
            className={cn(
              "type-display-m",
              danger ? "text-danger" : "text-primary",
            )}
          >
            {title}
          </h2>
          {description ? (
            <div id={descId} className="type-body-l mt-2 text-secondary">
              {description}
            </div>
          ) : null}
        </div>
        {children ? <div className="px-6 pb-4">{children}</div> : null}
        {footer ? (
          // Actions right-aligned, Secondary left of Primary/Destructive.
          <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The standard two-button footer: Cancel (secondary) then the real action. */
export function ModalActions({
  onCancel,
  cancelLabel = "Cancel",
  children,
}: {
  onCancel: () => void;
  cancelLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel}>
        {cancelLabel}
      </Button>
      {children}
    </>
  );
}
