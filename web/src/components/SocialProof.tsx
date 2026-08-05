import { StarIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/**
 * The proof badge that sits immediately above a hero headline.
 *
 * Placement is the whole point, and it is what every version of this pattern
 * gets right: HeadshotPro puts its Trustpilot score directly over the H1,
 * Heyo puts its positioning pill there. Read in that spot it frames the
 * headline. The same words as a strip under the nav - where this started -
 * are page furniture, scrolled past before the visitor is deciding anything.
 *
 * Small but not quiet. A pill with a border and a raised surface holds its
 * own against a 74px headline at 12px of type, where the same text set plain
 * would disappear.
 *
 * On the honest bit: there is no rating here because there is nothing to put
 * in one. No store listing, no Trustpilot profile, no customer count. A star
 * row with an invented number, on a site whose central argument is that it
 * never overstates evidence, would cost more than it earns. The `rating` prop
 * exists so that the day there is a real score it drops in without a redesign,
 * and the positioning line becomes the fallback rather than the whole badge.
 */
export function SocialProof({
  rating,
  className,
}: {
  /**
   * A real, verifiable score. Only ever populate this from a live listing:
   * `{ score: 4.8, count: 3480, source: "Trustpilot" }`.
   */
  rating?: { score: number; count: number; source: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-line bg-raised px-4 py-2",
        "shadow-[var(--shadow-raised)]",
        className,
      )}
    >
      {rating ? (
        <>
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon
                key={i}
                size={13}
                weight="fill"
                className={
                  i < Math.round(rating.score) ? "text-caution" : "text-tertiary"
                }
              />
            ))}
          </span>
          <span className="type-caption text-secondary">
            <span className="font-semibold text-primary">
              {rating.score.toFixed(1)}
            </span>{" "}
            from {rating.count.toLocaleString()} reviews on {rating.source}
          </span>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-brand"
          />
          <span className="type-caption font-medium text-secondary">
            Helping founders replace assumptions with evidence
          </span>
        </>
      )}
    </div>
  );
}
