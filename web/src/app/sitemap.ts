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
    ...getAllPages().map((page) => ({
      url: `${SITE_URL}/validation/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
