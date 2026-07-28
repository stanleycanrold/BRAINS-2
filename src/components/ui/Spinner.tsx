import { cn } from "@/lib/cn";

/**
 * A determinate-looking arc, not a bouncing-dots animation. Used inline in
 * buttons and beside narrative status lines — never as a full-page loader
 * (§3.13 mandates per-component skeletons for that).
 */
export function Spinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <>
      <svg
        className={cn("size-4 animate-spin", className)}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="8"
          cy="8"
          r="6.5"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.2"
        />
        <path
          d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}
