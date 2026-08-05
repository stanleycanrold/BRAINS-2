import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export type DisclosureItem = {
  title: string;
  /** One line shown next to the title while collapsed. */
  summary: string;
  body: string;
  /** Bullet detail, revealed with the body. */
  points?: string[];
};

/**
 * A stack of expandable rows, for pages that need to explain a lot without
 * becoming a wall.
 *
 * Native details/summary rather than hand-rolled state: keyboard accessible
 * and findable by the browser's own in-page search for free, open-able with
 * JavaScript disabled, and it ships no client bundle. The content is in the
 * HTML whether or not a row is open, so a crawler reads all of it - which is
 * the point on a page that exists partly to rank for what the product does.
 *
 * Each row carries a one-line summary beside its title. Collapsed, the stack
 * still reads as a scannable list of capabilities rather than a row of
 * mystery headings you have to open one by one to learn anything.
 */
export function Disclosure({
  items,
  className,
}: {
  items: DisclosureItem[];
  className?: string;
}) {
  return (
    <div className={cn("mk-grid", className)}>
      {items.map((item) => (
        <details key={item.title} className="group">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-start justify-between gap-6",
              "px-6 py-5 marker:content-none hover:bg-wash-hover",
            )}
          >
            <span className="min-w-0">
              <span className="type-body-l block font-medium text-primary">
                {item.title}
              </span>
              <span className="type-body-m mt-1 block text-tertiary group-open:hidden">
                {item.summary}
              </span>
            </span>
            <CaretDownIcon
              size={17}
              aria-hidden="true"
              className="mt-1 shrink-0 text-tertiary transition-transform duration-200 group-open:rotate-180"
            />
          </summary>

          <div className="px-6 pb-6">
            <p className="type-body-m max-w-[70ch] text-secondary">
              {item.body}
            </p>
            {item.points ? (
              <ul className="mt-4 flex flex-col gap-2">
                {item.points.map((point) => (
                  <li
                    key={point}
                    className="type-body-m flex items-start gap-2.5 text-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-brand"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
