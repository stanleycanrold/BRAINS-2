import { cn } from "@/lib/cn";

/**
 * The 30-second answer. The signature block of every Answer page.
 *
 * Two jobs, and they pull in the same direction rather than against each
 * other. For a founder who arrived from a search result, this is the whole
 * transaction: the question they typed, answered, before any scrolling. For
 * an answer engine quoting the page, it is a self-contained passage that
 * survives being lifted out of its surroundings, which is why it must never
 * open with "it depends" or refer to anything further down the page.
 *
 * Rules for the text passed in, enforced by review rather than by types:
 *
 * - 40 to 60 words. Longer and it stops being quotable; shorter and it
 *   usually means the question was dodged.
 * - Contains a specific number or threshold. An answer with no number in it
 *   is an opinion, and opinions do not get cited.
 * - Makes sense with nothing above or below it.
 *
 * `qualifier` is for the honest caveat that would otherwise bloat the answer
 * past quotable length. It sits outside the quoted block on purpose: the
 * caveat is true, but it is not the answer, and letting it into the main
 * paragraph is how a direct answer turns into a hedge.
 *
 * `stat` pulls the one number the answer is built around out into its own
 * large, tabular figure, the way a fee calculator leads with the amount
 * before the fine print. It is optional because not every answer collapses
 * to one clean figure without distorting it - "two confirmation rates,
 * never averaged" is a real number, but the whole point of that answer is
 * that a single figure would misrepresent it, so nothing forces a stat where
 * the honest one is "it depends, but not vaguely."
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
    <div className={cn("max-w-[720px]", className)}>
      <div
        className={cn(
          "rounded-[12px] border border-line bg-raised p-6 shadow-[var(--shadow-raised)] sm:p-7",
          "border-l-[3px] border-l-brand",
        )}
      >
        <p className="type-caption text-brand uppercase">The short answer</p>

        <div
          className={cn(
            "mt-3",
            stat && "flex flex-col gap-5 sm:flex-row sm:items-baseline sm:gap-8",
          )}
        >
          {stat ? (
            <div className="shrink-0">
              <p className="type-data-l whitespace-nowrap text-primary">
                {stat.value}
              </p>
              <p className="type-caption mt-1 whitespace-nowrap text-secondary">
                {stat.label}
              </p>
            </div>
          ) : null}
          <p className="type-body-l text-primary">{children}</p>
        </div>
      </div>

      {qualifier ? (
        <p className="type-body-m mt-3 text-tertiary">{qualifier}</p>
      ) : null}
    </div>
  );
}
