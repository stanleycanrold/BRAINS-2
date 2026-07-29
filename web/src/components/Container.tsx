import { cn } from "@/lib/cn";

/**
 * The marketing site's own max-width, wider than the app's 960px per the
 * design system's appendix - marketing pages can breathe more than an
 * instrument-panel product screen affords itself.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1120px] px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}
