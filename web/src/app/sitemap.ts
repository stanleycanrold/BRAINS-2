import type { MetadataRoute } from "next";
import { getAllPages } from "@/content";
import { SITE_URL } from "@/lib/urls";

/**
 * The crawl map, generated from the same records that render the pages.
 *
 * This is the half of the arrangement that makes search the primary way
 * anyone finds a pSEO page. The articles are deliberately absent from the nav
 * and from the footer, so the sitemap plus the computed cross-links between
 * pages are how a crawler reaches them at all. A hand-maintained list would
 * fall out of step with the content within a dozen pages, and the pages it
 * forgot would simply never be discovered.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const marketing = ["", "/how-it-works", "/pricing", "/about", "/validation"];

  return [
    ...marketing.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    /**
     * Articles carry their own edit date rather than the build time.
     *
     * `new Date()` here meant every deploy re-dated all of them at once, so a
     * crawler was told the whole corpus changed whenever a button colour did.
     * A date that is wrong in the same direction for every page is worse than
     * no date, because it is the signal Google uses to decide which pages are
     * worth recrawling and it stops meaning anything once it always says
     * "today".
     */
    ...getAllPages().map((page) => ({
      url: `${SITE_URL}/validation/${page.slug}`,
      lastModified: new Date(page.updated),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
