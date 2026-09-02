import { SITE_URL } from "@/lib/urls";

/**
 * The sitewide entity graph: who publishes this, and what the product is.
 *
 * Rendered once from the root layout rather than per page. `@id` anchors let
 * every other block on the site point at these two nodes instead of
 * redefining them, which is what makes the pages read as one publisher's
 * corpus rather than a set of unrelated documents.
 *
 * Nothing here states a fact the site does not state in its own visible copy.
 * That is a hard rule and not a stylistic one: structured data that overstates
 * what the page says is the specific thing Google penalises, and an invented
 * rating or a price that does not match the pricing page is worse than
 * emitting no schema at all. There is deliberately no `aggregateRating` here,
 * because there are no published reviews to aggregate.
 */
export function SiteJsonLd() {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BRAINS AI",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brains-mark.png`,
      },
      description:
        "A validation engine for founders. Research the problem against real sources, find the people who have it, and get a score with the reasoning attached.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "BRAINS AI",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "BRAINS AI",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      publisher: { "@id": `${SITE_URL}/#organization` },
      description:
        "Validate a startup idea before building it: sourced market research, community scanning, evidence questions, response screening, and a scored decision.",
      /**
       * The self-serve tier really is free with no card and no time limit, per
       * the pricing page. Fast Track is quoted per round and so has no fixed
       * price to publish; claiming one here would contradict that page, which
       * is exactly the mismatch this file exists to avoid.
       */
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        category: "free",
        url: `${SITE_URL}/#contact`,
      },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

/**
 * Article schema for one guide, tied back to the sitewide publisher node.
 *
 * `dateModified` comes from the same `updated` field the sitemap reads, so a
 * page cannot claim one edit date to a crawler and a different one to the
 * sitemap. Keeping both on one source is the only reason that stays true.
 */
export function ArticleJsonLd({
  headline,
  description,
  slug,
  updated,
}: {
  headline: string;
  description: string;
  slug: string;
  updated: string;
}) {
  const url = `${SITE_URL}/validation/${slug}`;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `${url}#article`,
          headline,
          description,
          url,
          mainEntityOfPage: url,
          dateModified: updated,
          datePublished: updated,
          author: { "@id": `${SITE_URL}/#organization` },
          publisher: { "@id": `${SITE_URL}/#organization` },
          isPartOf: { "@id": `${SITE_URL}/#website` },
        }),
      }}
    />
  );
}
