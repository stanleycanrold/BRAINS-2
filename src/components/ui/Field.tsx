"use client";

import * as React from "react";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/**
 * Design system §3.2 (inputs) and §1.7 (voice).
 *
 * Errors appear on blur, not on every keystroke - don't punish someone
 * mid-typing. Messages state the fix, not just the problem, and are announced
 * to assistive tech via aria-live (§Part 5), not just flagged visually.
 */

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("type-caption block text-secondary uppercase", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="text-danger" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  return (
    <div aria-live="polite" className="min-h-0">
      {children ? (
        <p className="type-body-m mt-2 flex items-start gap-1.5 text-danger">
          <WarningCircleIcon
            size={16}
            weight="regular"
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>{children}</span>
        </p>
      ) : null}
    </div>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="type-body-m mt-2 text-secondary">{children}</p>;
}

const controlBase =
  "w-full rounded-[8px] border bg-raised text-primary placeholder:text-tertiary " +
  "transition-colors duration-[120ms] ease-out " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  invalid?: boolean;
  /** Rendered inside the field's leading edge. */
  prefix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, prefix, ...props }, ref) {
    const input = (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          "type-body-l h-11 px-3 py-2.5",
          invalid
            ? "border-danger focus:border-danger"
            : "border-line focus:border-brand",
          prefix && "pl-9",
          className,
        )}
        {...props}
      />
    );

    if (!prefix) return input;

    return (
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-tertiary">
          {prefix}
        </span>
        {input}
      </div>
    );
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Shows "n characters" under the field, plus a minimum if given. */
  showCount?: boolean;
  minChars?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, invalid, showCount, minChars, value, ...props },
    ref,
  ) {
    const length = typeof value === "string" ? value.length : 0;
    const meetsMin = minChars ? length >= minChars : true;

    return (
      <div>
        <textarea
          ref={ref}
          value={value}
          aria-invalid={invalid || undefined}
          className={cn(
            controlBase,
            "type-body-l min-h-32 resize-y px-3 py-2.5",
            invalid
              ? "border-danger focus:border-danger"
              : "border-line focus:border-brand",
            className,
          )}
          {...props}
        />
        {showCount ? (
          <p
            className={cn(
              "type-caption mt-2 tabular-nums",
              meetsMin ? "text-tertiary" : "text-secondary",
            )}
          >
            {minChars && !meetsMin
              ? `${length} of ${minChars} characters minimum`
              : `${length} characters`}
          </p>
        ) : null}
      </div>
    );
  },
);

export function Select({
  className,
  invalid,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "type-body-l h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-3 pr-9",
        invalid
          ? "border-danger focus:border-danger"
          : "border-line focus:border-brand",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%236b7480' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

/** A labelled field wrapper: label + control + error/hint, consistently spaced. */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <Label htmlFor={htmlFor} required={required} className="mb-2">
          {label}
        </Label>
      ) : null}
      {children}
      <FieldError>{error}</FieldError>
      {hint && !error ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}
