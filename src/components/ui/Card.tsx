import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Design system §3.3 / §1.4.
 *
 * Two elevation levels only — flat (page surface + hairline border) and raised
 * (raised surface + soft shadow). There is deliberately no third "floating"
 * level. In dark mode the raised surface is distinguished by background tone
 * rather than shadow, which is handled entirely by the tokens.
 */
export function Card({
  elevation = "flat",
  interactive = false,
  className,
  as: Component = "div",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  elevation?: "flat" | "raised";
  interactive?: boolean;
  as?: React.ElementType;
}) {
  return (
    <Component
      className={cn(
        "rounded-[8px] border border-line",
        elevation === "raised"
          ? "bg-raised shadow-[var(--shadow-raised)]"
          : "bg-raised",
        interactive &&
          "transition-shadow duration-[120ms] ease-out hover:shadow-[var(--shadow-raised-hover)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-5 pb-4", className)} {...props} />;
}

export function CardTitle({
  className,
  as: Component = "h3",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: React.ElementType }) {
  return (
    <Component className={cn("type-display-m text-primary", className)} {...props} />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("type-body-m mt-1 text-secondary", className)} {...props} />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-line px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}
