import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/urls";


/**
 * Hand-written pages only for now. Once pSEO pages exist, this generates
 * their entries from the same data source that renders them, rather than
 * listing them by hand.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/how-it-works",
    "/pricing",
    "/about",
    "/blog",
    "/validate",
    "/validate/marketplace-startup-idea",
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
