import { cn } from "@/lib/cn";

/**
 * Page gutter, not a max-width.
 *
 * This used to cap content at 1120px and then 1400px, which on any large
 * display left the page floating in the middle of the screen with empty
 * margins either side - the layout that makes a site read as a document
 * rather than a product.
 *
 * There is deliberately no cap now. Width is made readable by the layouts
 * inside it (a sticky heading rail, hairline grids, columns that cap their
 * own measure) rather than by squeezing the whole page into a ribbon. Nothing
 * in here should ever stretch a paragraph across the viewport; if a block
 * would, that block caps itself.
 *
 * `measure` is the exception: the few places that really are a single column
 * of prose, such as the About page.
 */
export function Container({
  className,
  measure,
  children,
}: {
  className?: string;
  /** Caps content at a readable single-column width and centres it. */
  measure?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full px-5 sm:px-7 lg:px-10 xl:px-14",
        measure && "mx-auto max-w-[820px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
