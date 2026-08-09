import type { Block, ContentPage } from "./types";
import { page as howToValidate } from "./pages/how-to-validate-a-startup-idea";
import { page as howManyInterviews } from "./pages/how-many-customer-interviews";
import { page as marketplace } from "./pages/marketplace-startup-idea";
import { page as saas } from "./pages/saas-startup-idea";
import { page as aiApp } from "./pages/ai-app-startup-idea";
import { page as mobileApp } from "./pages/mobile-app-startup-idea";
import { page as b2bService } from "./pages/b2b-service-startup-idea";
import { page as ecommerce } from "./pages/ecommerce-startup-idea";

export type { Block, ContentPage, Section, Track } from "./types";

/**
 * Every published page, and the only place that knows where content lives.
 *
 * Content sits in typed modules rather than a database today, and that is a
 * deliberate starting point rather than a limitation: it version-controls with
 * the code, it type-checks in CI, it costs nothing to serve, and every page
 * renders as static HTML at build time, which is the best possible starting
 * position for pages whose entire job is to be crawled.
 *
 * Moving to a database later is a change to this file and nothing else. Every
 * consumer goes through `getPage`, `getAllPages`, and `getRelated`, none of
 * which promise anything about where the records came from. The functions are
 * already async-shaped in spirit; if the source becomes a query, they become
 * `async` and the route awaits them.
 *
 * What must not happen is content leaking back into components. The moment a
 * page needs bespoke JSX, the one-template arrangement is over and we are
 * maintaining hundreds of layouts again.
 */
const PAGES: ContentPage[] = [
  howToValidate,
  howManyInterviews,
  marketplace,
  saas,
  aiApp,
  mobileApp,
  b2bService,
  ecommerce,
];

/** Sorted for stable output: build order must not depend on import order. */
const BY_SLUG = new Map(
  [...PAGES].sort((a, b) => a.slug.localeCompare(b.slug)).map((p) => [p.slug, p]),
);

export function getAllPages(): ContentPage[] {
  return [...BY_SLUG.values()];
}

export function getPage(slug: string): ContentPage | undefined {
  return BY_SLUG.get(slug);
}

/** The business-type track. The only pages the hub grid links to. */
export function getBusinessTypePages(): ContentPage[] {
  return getAllPages().filter((p) => p.track === "business-type");
}

/** The question track. Search-only: never listed in nav or the hub grid. */
export function getQuestionPages(): ContentPage[] {
  return getAllPages().filter((p) => p.track === "question");
}

export type RelatedLink = { href: string; label: string; detail: string };

/**
 * Related pages, computed from tags rather than hand-authored per page.
 *
 * Hand-authored cross-links do not survive scale. At twenty pages, adding one
 * means editing the ones that should point at it, and the ones nobody
 * remembers to edit quietly become orphans that search engines reach but
 * readers never do. Computing the links means a new page is fully connected
 * the moment it is added, in both directions, for free.
 *
 * Tag overlap is the ranking signal, with one thumb on the scale: a page from
 * the opposite track outranks an equally-related page from the same one. A
 * founder reading about marketplaces is better served by the evidence ladder
 * than by a fourth marketplace page, and a founder reading a question page is
 * usually trying to place their own business somewhere.
 */
export function getRelated(page: ContentPage, limit = 3): RelatedLink[] {
  const scored = getAllPages()
    .filter((other) => other.slug !== page.slug)
    .map((other) => {
      const shared = other.tags.filter((t) => page.tags.includes(t)).length;
      const crossTrack = other.track !== page.track ? 1 : 0;
      return { other, score: shared * 2 + crossTrack };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.other.slug.localeCompare(b.other.slug),
    )
    .slice(0, limit);

  const links: RelatedLink[] = scored.map(({ other }) => ({
    href: `/validation/${other.slug}`,
    label: other.track === "business-type" ? "By business type" : "Related question",
    detail: other.shortTitle,
  }));

  // The hub always closes the list, so every page has a way back up into the
  // cluster even when it is too new to have earned any tag overlap yet.
  links.push({
    href: "/validation",
    label: "Building something else?",
    detail: "Validate your kind of business",
  });

  return links;
}

/** The FAQ block, if the page has one. Used for FAQPage structured data. */
export function getFaq(page: ContentPage) {
  for (const section of page.sections) {
    for (const block of section.blocks) {
      if (block.kind === "faq") return block.items;
    }
  }
  return null;
}

/**
 * The ship gate.
 *
 * Structural checks only, and that is the point: this cannot tell whether a
 * page says anything worth reading, so it does not pretend to. What it can do
 * is make the failure modes that scale impossible to ship, because those are
 * the ones nobody catches by eye at page two hundred - a duplicate slug
 * silently shadowing another page, a table whose rows do not match its
 * columns, an answer that has drifted past quotable length, a page with no
 * tags that can never be linked to by anything.
 *
 * Runs at build time via the route's `generateStaticParams`, so a broken
 * record fails the build rather than reaching production.
 */
export function validateContent(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const page of PAGES) {
    const at = `[${page.slug}]`;

    if (seen.has(page.slug)) problems.push(`${at} duplicate slug`);
    seen.add(page.slug);

    if (!/^[a-z0-9-]+$/.test(page.slug)) {
      problems.push(`${at} slug must be lowercase, digits and hyphens only`);
    }

    if (page.tags.length === 0) {
      problems.push(`${at} has no tags, so nothing can ever link to it`);
    }

    // The sitemap passes this straight to `new Date()`, where a malformed
    // string becomes an Invalid Date and Next emits a sitemap entry with no
    // lastModified at all - silently, on a page that was fine yesterday.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(page.updated) || Number.isNaN(Date.parse(page.updated))) {
      problems.push(`${at} updated "${page.updated}" is not a valid YYYY-MM-DD date`);
    }

    // The answer is the one block that gets quoted out of context, so its
    // length is a correctness property rather than a style preference.
    const words = page.answer.text.trim().split(/\s+/).length;
    if (words < 30 || words > 75) {
      problems.push(`${at} answer is ${words} words, wanted roughly 40 to 60`);
    }

    if (page.metaDescription.length > 165) {
      problems.push(
        `${at} meta description is ${page.metaDescription.length} chars, will be truncated`,
      );
    }

    const ids = new Set<string>();
    for (const section of page.sections) {
      if (ids.has(section.id)) {
        problems.push(`${at} duplicate section id "${section.id}"`);
      }
      ids.add(section.id);

      if (section.blocks.length === 0) {
        problems.push(`${at} section "${section.id}" has no blocks`);
      }

      for (const block of section.blocks) {
        problems.push(...validateBlock(block, `${at} ${section.id}`));
      }
    }
  }

  return problems;
}

function validateBlock(block: Block, at: string): string[] {
  const problems: string[] = [];

  switch (block.kind) {
    case "table":
      for (const [i, row] of block.rows.entries()) {
        if (row.length !== block.columns.length) {
          problems.push(
            `${at} table row ${i} has ${row.length} cells, header has ${block.columns.length}`,
          );
        }
      }
      break;

    case "faq":
      // Five is the floor for a page to be worth its own FAQ block at all;
      // fewer usually means the questions were padding rather than real.
      if (block.items.length < 5) {
        problems.push(`${at} faq has ${block.items.length} items, wanted 5 or more`);
      }
      break;

    case "compare":
      if (
        block.positive.items.length === 0 ||
        block.negative.items.length === 0
      ) {
        problems.push(`${at} compare block needs items on both sides`);
      }
      break;

    default:
      break;
  }

  return problems;
}
