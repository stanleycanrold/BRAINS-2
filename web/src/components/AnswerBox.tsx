import { cn } from "@/lib/cn";

/**
 * The 30-second answer. The signature block of every pSEO page.
 *
 * Two jobs, pulling in the same direction. For a founder who arrived from a
 * search result this is the whole transaction: the question they typed,
 * answered, before any scrolling. For an answer engine quoting the page it is
 * a self-contained passage that survives being lifted out of its
 * surroundings, which is why it must never open with "it depends" or refer to
 * anything further down the page.
 *
 * Rules for the text passed in, enforced by review and by the ship gate:
 *
 * - 40 to 60 words. Longer stops being quotable; shorter usually means the
 *   question was dodged.
 * - Contains a specific number or threshold. An answer with no number in it
 *   is an opinion, and opinions do not get cited.
 * - Makes sense with nothing above or below it.
 *
 * `stat` pulls the number the answer turns on out into its own large tabular
 * figure, the way a fee calculator leads with the amount before the fine
 * print. Optional, because some honest answers resist one clean figure and
 * forcing one would distort the claim.
 *
 * `qualifier` is the caveat that would otherwise bloat the answer past
 * quotable length. It sits outside the quoted block on purpose: the caveat is
 * true, but it is not the answer, and letting it into the main paragraph is
 * how a direct answer turns into a hedge.
 */
export function AnswerBox({
  children,
  qualifier,
  stat,
  className,
}: {
  children: React.ReactNode;
  qualifier?: string;
  stat?: { value: string; label: string };
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mk-panel overflow-hidden p-6 sm:p-8">
        {/* The accent edge runs the full height on the left, which reads as a
            pull quote. A top-only rule would read as a card header. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px] bg-brand"
        />

        <p className="type-eyebrow text-brand">The short answer</p>

        <div
          className={cn(
            "mt-4",
            stat && "flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-9",
          )}
        >
          {stat ? (
            <div className="shrink-0">
              <p className="type-data-l whitespace-nowrap text-primary">
                {stat.value}
              </p>
              <p className="type-caption mt-1.5 whitespace-nowrap text-secondary">
                {stat.label}
              </p>
            </div>
          ) : null}
          <p className="type-body-xl max-w-[62ch] text-primary">{children}</p>
        </div>
      </div>

      {qualifier ? (
        <p className="type-body-m mt-4 max-w-[68ch] pl-1 text-tertiary">
          {qualifier}
        </p>
      ) : null}
    </div>
  );
}
