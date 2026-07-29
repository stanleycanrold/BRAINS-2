import { Container } from "./Container";
import { cn } from "@/lib/cn";

/**
 * The site's vertical rhythm, in one place.
 *
 * Marketing pages live or die on section spacing being consistent - the
 * fastest way to make a site feel templated is for every section to pick its
 * own padding. `tone="sunken"` alternates the background a half-step to
 * separate neighbouring sections without drawing a rule between them.
 */
export function Section({
  id,
  tone = "page",
  bordered = false,
  className,
  children,
}: {
  id?: string;
  tone?: "page" | "sunken";
  bordered?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 sm:py-28",
        tone === "sunken" && "bg-sunken",
        bordered && "border-t border-line",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Centred section heading with an optional lead paragraph beneath it. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "max-w-[620px]",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p className="type-caption text-brand uppercase">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "type-display-l text-primary",
          eyebrow && "mt-3",
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p className="type-body-l mt-4 text-secondary">{lead}</p>
      ) : null}
    </div>
  );
}
