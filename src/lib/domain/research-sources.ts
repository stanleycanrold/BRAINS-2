import type { ResearchReport } from "@/lib/domain/types";

/**
 * What counts as a source, defined once.
 *
 * The dashboard said SafeSpark had 4 sources and the shared report said 0, for
 * the same research run. Neither was lying and neither was right: the
 * dashboard was adding up evidence items and competitor entries, the report
 * was counting evidence items alone, and the actual research had no evidence
 * and four competitors citing two URLs between them.
 *
 * Both were counting FINDINGS and calling them sources. A finding is not a
 * source - four claims drawn from one G2 page is one page read, and a claim
 * the model asserted with no URL behind it is not a source at all. Counting
 * findings inflates the number precisely where the research is thinnest,
 * which is the worst place to be generous, because that count is the first
 * thing a sceptical client looks at.
 *
 * So: a source is a distinct URL that something in the report cites. Every
 * surface that wants to say how much reading stands behind a verdict asks
 * this module, and there is nowhere left for two screens to disagree.
 */

export type ResearchSource = {
  url: string;
  /** Best label seen for this page - an evidence title or a competitor name. */
  title: string;
  /** How many findings in the report cite this one page. */
  citations: number;
};

/**
 * Same page, written two ways, is one source.
 *
 * Deliberately conservative - it folds together the differences that are
 * definitely not a different page (case, trailing slash, the `#section` a
 * model appends when it quotes a heading) and leaves everything else alone.
 * Over-normalising would merge genuinely different pages and undercount,
 * which is the same failure in the other direction.
 */
function canonical(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.hostname.toLowerCase().replace(/^www\./, "")}${path}${parsed.search}`;
  } catch {
    // Not a parseable URL. Something was cited, so it is not nothing - but it
    // is not a link a reader can follow either, and the count promises links.
    return null;
  }
}

/**
 * Every distinct URL cited anywhere in a report.
 *
 * All four collections, not just evidence. A competitor page and a page
 * describing a workaround were both read, and leaving them out was how the
 * shared report reached zero on a run that had read two pages.
 */
export function sources(
  report: ResearchReport | null | undefined,
): ResearchSource[] {
  if (!report) return [];

  const cited: { url: string; title: string }[] = [
    ...report.evidence.map((e) => ({ url: e.source_url, title: e.source_title })),
    ...report.contrary_evidence.map((e) => ({ url: e.source_url, title: "" })),
    ...report.competitors.map((c) => ({ url: c.source_url, title: c.name })),
    ...report.current_workarounds.map((w) => ({ url: w.source_url, title: "" })),
  ];

  const seen = new Map<string, ResearchSource>();
  for (const { url, title } of cited) {
    const key = canonical(url);
    if (!key) continue;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, { url: url.trim(), title: title.trim(), citations: 1 });
      continue;
    }
    // How many findings lean on this page. A page cited four times is still
    // one source, but the reader deserves to know the four are not
    // independent - that is the difference the old count was hiding.
    existing.citations += 1;
    if (!existing.title && title.trim()) existing.title = title.trim();
  }

  return [...seen.values()];
}

export function sourceUrls(report: ResearchReport | null | undefined): string[] {
  return sources(report).map((s) => s.url);
}

/** How many findings cite something, whether or not the pages are distinct. */
export function countCitations(
  report: ResearchReport | null | undefined,
): number {
  return sources(report).reduce((n, s) => n + s.citations, 0);
}

export function countSources(report: ResearchReport | null | undefined): number {
  return sourceUrls(report).length;
}

/**
 * Sources across a whole journey - de-duplicated across rounds, not summed.
 *
 * A re-run round usually re-reads several of the same pages. Adding the
 * per-round counts together would report a journey as having read a page
 * twice as two sources, and the number would climb every time a founder
 * reworked without any new reading having happened.
 */
export function countSourcesAcross(
  reports: readonly (ResearchReport | null | undefined)[],
): number {
  const seen = new Set<string>();
  for (const report of reports) {
    for (const url of sourceUrls(report)) {
      const key = canonical(url);
      if (key) seen.add(key);
    }
  }
  return seen.size;
}
