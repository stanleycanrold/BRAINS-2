import { Container } from "./Container";
import { cn } from "@/lib/cn";

/**
 * The site's section shell and its vertical rhythm.
 *
 * Two layouts, and the default is the important one. In `split`, the heading
 * block sits in a narrow sticky rail on the left and the content takes the
 * whole remaining width. That is how an edge-to-edge page stays readable:
 * the rail carries the framing and stays with you as you read past it, while
 * grids, tables and comparisons get the real width they need. Nothing has to
 * be centred in a ribbon, and no paragraph ever stretches across the screen.
 *
 * `stack` is for content that genuinely wants the full width underneath a
 * heading, such as a wide comparison table.
 *
 * Spacing lives here rather than on each section, because the fastest way to
 * make a site feel templated is for every section to choose its own padding -
 * which is what had happened before this took the decision over.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  aside,
  tone = "page",
  bordered = true,
  layout = "split",
  size = "default",
  className,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  /** Extra content under the lead, inside the rail. */
  aside?: React.ReactNode;
  tone?: "page" | "sunken";
  bordered?: boolean;
  layout?: "split" | "stack";
  size?: "default" | "compact";
  className?: string;
  children?: React.ReactNode;
}) {
  const hasHeading = Boolean(eyebrow || title || lead || aside);

  const heading = hasHeading ? (
    <div className={cn(layout === "split" && "lg:sticky lg:top-28 lg:self-start")}>
      {eyebrow ? <p className="type-eyebrow text-brand">{eyebrow}</p> : null}
      {title ? (
        <h2
          className={cn(
            "type-display-hero text-balance text-primary",
            eyebrow && "mt-4",
          )}
        >
          {title}
        </h2>
      ) : null}
      {lead ? (
        <p className="type-body-l mt-5 max-w-[46ch] text-secondary">{lead}</p>
      ) : null}
      {aside ? <div className="mt-7">{aside}</div> : null}
    </div>
  ) : null;

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24",
        size === "compact" ? "mk-section-sm" : "mk-section",
        tone === "sunken" && "bg-sunken",
        bordered && "mk-topline",
        className,
      )}
    >
      <Container>
        {layout === "split" && hasHeading ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:gap-20">
            {heading}
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          <>
            {heading}
            <div className={cn("min-w-0", hasHeading && "mt-12")}>{children}</div>
          </>
        )}
      </Container>
    </section>
  );
}

/**
 * Standalone heading, for the few places that need one outside a Section.
 * Kept because several pages import it; new work should prefer passing
 * `eyebrow`/`title`/`lead` to Section directly.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn("max-w-[760px]", align === "center" && "mx-auto text-center")}
    >
      {eyebrow ? <p className="type-eyebrow text-brand">{eyebrow}</p> : null}
      <h2 className={cn("type-display-hero text-balance text-primary", eyebrow && "mt-4")}>
        {title}
      </h2>
      {lead ? <p className="type-body-xl mt-5 text-secondary">{lead}</p> : null}
    </div>
  );
}
