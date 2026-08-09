/**
 * The shape every pSEO page is written in.
 *
 * One template renders all of these, so this file is the actual contract of
 * the content system: if a page needs something that cannot be expressed
 * here, that is a deliberate decision to extend the vocabulary for every page
 * at once, not licence to hand-build a one-off layout. The whole value of the
 * arrangement disappears the first time a page gets its own bespoke design.
 *
 * Content is data rather than JSX for three reasons. It can be validated
 * before it ships (see the ship gate in `index.ts`). It can be counted,
 * diffed, and audited across hundreds of pages. And the source can move from
 * these files to a database without touching a single component, because
 * nothing downstream knows or cares where a `ContentPage` came from.
 */

/**
 * A section's body, as a small closed vocabulary of block types.
 *
 * Deliberately small. Every block here earns its place by appearing in real
 * pages with real content behind it; a vocabulary that grows a variant per
 * page is just JSX with extra steps.
 */
export type Block =
  /** Plain paragraphs. The default, and the right answer more often than not. */
  | { kind: "prose"; paragraphs: string[] }
  /**
   * The one line from the section worth screenshotting. Set apart and heavier
   * than the prose around it. At most one per section: a page where every
   * paragraph is emphasised has emphasised nothing.
   */
  | { kind: "callout"; text: string }
  /**
   * An ordered list where sequence or rank carries meaning. `badge` is for
   * ranked lists that need a verdict per item, like the evidence ladder
   * marking which rungs are evidence and which are only encouragement.
   */
  | {
      kind: "steps";
      items: {
        title: string;
        body: string;
        badge?: { text: string; tone: "success" | "danger" };
      }[];
    }
  /** A grid of short titled points. Unordered, scannable, no sequence implied. */
  | { kind: "cards"; items: { title: string; body: string }[] }
  /** Ticked list. For criteria that are met or not met, never for prose. */
  | { kind: "checklist"; items: string[] }
  /**
   * Two facing lists, one affirmative and one negative. The shape a page needs
   * whenever the useful content is a boundary rather than a list.
   */
  | {
      kind: "compare";
      positive: { heading: string; items: string[] };
      negative: { heading: string; items: string[] };
    }
  /**
   * A real table. Scrolls horizontally on narrow screens rather than wrapping
   * into unreadable columns. Every row must have `columns.length` cells.
   */
  | { kind: "table"; columns: string[]; rows: string[][] }
  /**
   * Questions and answers. Emits FAQPage structured data as well as markup,
   * from this one array, so the two cannot drift apart.
   */
  | { kind: "faq"; items: { question: string; answer: string }[] };

export type Section = {
  /** Also the anchor and the contents-list target. Stable: changing it breaks links. */
  id: string;
  title: string;
  /** Intro paragraphs, before the blocks. */
  lead?: string[];
  blocks: Block[];
};

/**
 * The 30-second answer. Written to survive being lifted out of the page by an
 * answer engine, which is why it may not open with "it depends" or refer to
 * anything further down.
 */
export type Answer = {
  /** 40 to 60 words. Longer stops being quotable, shorter usually dodged the question. */
  text: string;
  /**
   * The single number the answer turns on, pulled out large. Optional because
   * some honest answers resist one clean figure, and forcing one distorts the
   * claim.
   */
  stat?: { value: string; label: string };
  /** The caveat that would otherwise bloat the answer past quotable length. */
  qualifier?: string;
};

/**
 * Which of the two tracks a page belongs to.
 *
 * `question` pages answer a founder question and are found through search
 * only. `business-type` pages cover a kind of business, and are the only ones
 * the hub links to. Same template either way: the distinction governs
 * discovery and cross-linking, never layout.
 */
export type Track = "question" | "business-type";

export type ContentPage = {
  /** The URL segment. `/validation/{slug}`. */
  slug: string;
  track: Track;
  /**
   * The date this page's content last meaningfully changed, `YYYY-MM-DD`.
   *
   * Hand-set rather than derived from the build, because it feeds
   * `lastModified` in the sitemap and that field is a claim to a crawler
   * rather than a timestamp. Stamping every page with the build time tells
   * Google that all of them changed on every deploy, which is false for all
   * but one of them and trains it to stop believing the signal. Bump this
   * when the words change; leave it alone for a typo or a styling pass.
   */
  updated: string;
  /** The H1. Phrased as the search query wherever that reads naturally. */
  title: string;
  /** `<title>`. May be longer and more specific than the H1. */
  metaTitle: string;
  metaDescription: string;
  /** Short label for breadcrumbs and cards, where the full title is too long. */
  shortTitle: string;
  /**
   * One line for the hub card. Written for someone scanning a grid, so it
   * states the finding rather than describing what the page covers: the
   * difference between "how to test the harder side first" and "a guide to
   * marketplace validation".
   */
  summary: string;
  /**
   * Topic tags, used to compute related links. Not shown to the reader and
   * not keywords: they exist so a new page automatically finds its siblings
   * instead of needing every existing page edited to point at it.
   */
  tags: string[];
  answer: Answer;
  /** The tool block, directly beneath the answer. */
  tool: {
    heading: string;
    body: string;
    /** Business type shown as a tag on the composer itself. */
    facet?: { label: string };
    /** Page-specific composer starters. Falls back to the site defaults. */
    starters?: { label: string; seed: string }[];
  };
  sections: Section[];
  /** The closing tool block. */
  cta: { heading: string; body: string };
};
