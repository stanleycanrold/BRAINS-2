"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

/**
 * Design system §3.1.
 *
 * Hard rule: never two Primary buttons in one view. If two actions feel
 * equally important, the flow is wrong, not the button choice.
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "ghost"
  | "link";

export type ButtonSize = "compact" | "default" | "large";

const VARIANTS: Record<ButtonVariant, string> = {
  // Filled brand. The one next action per view.
  primary:
    "bg-brand text-on-accent border border-transparent hover:bg-brand-hover active:bg-brand-active shadow-none",
  // Alternate actions.
  secondary:
    "bg-raised text-primary border border-line hover:bg-wash-hover active:bg-wash-active",
  // Outlined, not filled, so it never visually competes with Primary until
  // deliberately hovered.
  destructive:
    "bg-transparent text-danger border border-danger-border hover:bg-danger-subtle active:bg-danger-subtle",
  // Cancel / Skip.
  ghost:
    "bg-transparent text-secondary border border-transparent hover:bg-wash-hover hover:text-primary active:bg-wash-active",
  link: "bg-transparent text-brand border border-transparent underline-offset-4 hover:underline px-0",
};

const SIZES: Record<ButtonSize, string> = {
  compact: "h-8 px-3 text-[13px]",
  default: "h-10 px-4 text-[14px]",
  // 48px is reserved for the entry point's primary CTA only (§3.1).
  large: "h-12 px-6 text-[15px]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction. Keeps the label for context. */
  loading?: boolean;
  /** Rendered before the label. Use 20px Phosphor icons at default size. */
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "secondary",
      size = "default",
      loading = false,
      iconLeft,
      iconRight,
      fullWidth,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-[6px] font-medium whitespace-nowrap",
          "transition-colors duration-[120ms] ease-out",
          "disabled:pointer-events-none disabled:opacity-40",
          VARIANTS[variant],
          SIZES[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner
            className={cn(
              "size-4 shrink-0",
              variant === "primary" ? "text-on-accent" : "text-secondary",
            )}
          />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);

/**
 * A navigation link wearing a button's clothes.
 *
 * Separate from `Button` rather than an `as` prop on it, because the two are
 * genuinely different elements: this one has an href, is middle-clickable, and
 * has no disabled or loading state - a link cannot be busy. Collapsing them
 * into one polymorphic component means every caller can reach props that make
 * no sense for what it rendered.
 *
 * Styling is shared, so a change to the button's shape changes both.
 */
export function ButtonLink({
  variant = "secondary",
  size = "default",
  iconLeft,
  iconRight,
  fullWidth,
  className,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <Link
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-[6px] font-medium whitespace-nowrap",
        "transition-colors duration-[120ms] ease-out",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
