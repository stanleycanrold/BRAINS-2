import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Same variant discipline as the app's own Button (design system §3.1): one
 * Primary per view, Secondary as the alternate, Ghost for low-stakes actions.
 * Sized up for a marketing hero, where the app's own 48px ceiling is too
 * small to anchor a page the way it needs to here.
 *
 * Deliberately narrow props (no open-ended passthrough) - this button only
 * ever needs to be a link or a plain click handler on a marketing page, not
 * every possible native attribute.
 */

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-40";

const variants = {
  primary:
    "bg-brand text-on-accent hover:bg-brand-hover active:bg-brand-active",
  secondary:
    "border border-line bg-transparent text-primary hover:bg-wash-hover active:bg-wash-active",
  ghost: "bg-transparent text-secondary hover:text-primary hover:bg-wash-hover",
};

const sizes = {
  compact: "h-9 px-4 type-body-m",
  default: "h-11 px-5 type-body-l",
  hero: "h-[52px] px-7 type-body-l",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  /** Renders as a Link when set, a native button otherwise. */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  tabIndex?: number;
  "aria-label"?: string;
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  href,
  onClick,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
}
