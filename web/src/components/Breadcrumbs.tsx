import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";

export type Crumb = { href?: string; label: string };

/**
 * Wayfinding for pSEO and blog pages only (UX guide 2.3). Single-level pages
 * do not need a trail back to themselves.
 *
 * Emits BreadcrumbList JSON-LD from the same array it renders, so the markup
 * and the structured data cannot drift.
 */
export function Breadcrumbs({
  items,
  siteUrl,
}: {
  items: Crumb[];
  siteUrl: string;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center gap-1.5">
              {i > 0 ? (
                <CaretRightIcon
                  size={12}
                  className="text-tertiary"
                  aria-hidden="true"
                />
              ) : null}
              {item.href ? (
                <Link
                  href={item.href}
                  className="type-caption text-secondary hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="type-caption text-tertiary" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
