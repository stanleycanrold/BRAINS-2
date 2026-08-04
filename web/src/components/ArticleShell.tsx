import { Container } from "./Container";
import { cn } from "@/lib/cn";

/**
 * The reading shell for answer pages.
 *
 * The marketing pages on this site alternate full-bleed bands the whole way
 * down, which is right for a page whose job is to present a product in
 * chapters. It is wrong for a page whose job is to be read: every band edge
 * reads as "this section is over, you may leave now", and stacking eight of
 * them turns one argument into eight unrelated pitches.
 *
 * So an answer page is a document instead. One centred column, hairline rules
 * between sections rather than background changes, and nothing in the margins
 * competing with the text. An earlier version carried a sticky contents rail
 * out to the side; it was removed because it pulled the eye away from the
 * column on every scroll and bought very little on pages this length, and
 * because a centred column is what the reference pSEO pages we are aiming at
 * actually do.
 *
 * Measure is deliberately 680px, not the 720px the marketing pages use. At
 * this type size 720 runs to about ninety characters a line, which is past
 * the point where the eye starts losing its place on the return sweep.
 */
export function ArticleShell({ children }: { children: React.ReactNode }) {
  return (
    <Container>
      <div className="mx-auto min-w-0 max-w-[680px]">{children}</div>
    </Container>
  );
}

/**
 * One section of an answer page.
 *
 * The rule and the spacing live here rather than on each page so that section
 * rhythm cannot drift between pages, which is the fastest way a set of
 * templated pages starts looking templated. `scroll-mt` keeps a heading clear
 * of the sticky header when it is jumped to from the contents.
 */
export function ArticleSection({
  id,
  title,
  lead,
  className,
  children,
}: {
  id: string;
  title: string;
  lead?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mt-14 scroll-mt-24 border-t border-line pt-12 sm:mt-16 sm:pt-14",
        className,
      )}
    >
      <h2 className="type-display-l text-primary">{title}</h2>
      {lead ? <div className="mt-4 space-y-4">{lead}</div> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}
