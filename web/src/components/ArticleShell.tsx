import { cn } from "@/lib/cn";

/**
 * One section of a pSEO page, as a two-column editorial spread.
 *
 * The heading and its lead sit in a narrow left rail; the blocks take the
 * remaining width. This is how the page fills a large display honestly.
 * Stretching a paragraph across 1400px would be unreadable at roughly 180
 * characters a line, so the width gets used by *layout* instead: the rail
 * carries the framing, and tables, card grids and comparisons finally have
 * room to be their real size rather than being squeezed into a 680px column.
 *
 * The rail is sticky on large screens, so the section you are reading stays
 * labelled all the way down. That also replaces what the removed contents
 * sidebar was doing, without a second navigation element competing with the
 * text.
 *
 * Everything collapses to a single stacked column below `lg`, where there is
 * no spare width to spend and a rail would just push the content into a
 * gutter.
 */
export function ArticleSection({
  id,
  title,
  lead,
  index,
  className,
  children,
}: {
  id: string;
  title: string;
  lead?: React.ReactNode;
  /** Rendered as a small ordinal above the heading. */
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mk-topline scroll-mt-24 pt-14 sm:pt-20",
        className,
      )}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-16">
        <div>
          <div className="lg:sticky lg:top-28">
            {typeof index === "number" ? (
              <p className="type-data-s text-tertiary">
                {String(index).padStart(2, "0")}
              </p>
            ) : null}
            <h2 className="type-display-hero mt-2 text-primary text-balance">
              {title}
            </h2>
            {lead ? <div className="mt-5 space-y-4">{lead}</div> : null}
          </div>
        </div>

        <div className="min-w-0 space-y-10">{children}</div>
      </div>
    </section>
  );
}
