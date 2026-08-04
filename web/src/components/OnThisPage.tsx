import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export type TocItem = { id: string; label: string };

/**
 * Contents, collapsed, in the flow of the column.
 *
 * A founder who arrived on a specific question often wants one section rather
 * than the whole page, and a reader who can see the page has five parts reads
 * differently from one who cannot see the end. Both are worth one collapsed
 * line near the top.
 *
 * This used to also render as a sticky rail beside the text, with scroll-spy
 * marking the current section. The rail is gone, and with it the only reason
 * any of that was a client component: highlighting the section you are in is
 * meaningless when the list is folded shut. What is left renders on the
 * server, ships no JavaScript, and still opens without any.
 */
export function OnThisPage({
  items,
  className,
}: {
  items: TocItem[];
  className?: string;
}) {
  if (items.length < 2) return null;

  return (
    <details
      className={cn(
        "group rounded-[12px] border border-line bg-raised px-4",
        className,
      )}
    >
      <summary className="type-body-m flex cursor-pointer list-none items-center justify-between py-3.5 font-medium text-primary marker:content-none">
        On this page
        <CaretDownIcon
          size={16}
          aria-hidden="true"
          className="shrink-0 text-tertiary transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <ul className="space-y-0.5 pb-4">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="type-body-m block border-l border-line py-1.5 pl-3 text-secondary transition-colors duration-[120ms] hover:border-line-strong hover:text-primary"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
