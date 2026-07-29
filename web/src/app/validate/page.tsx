import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MobileCta } from "@/components/MobileCta";
import { Button } from "@/components/Button";
import { signUpUrl } from "@/lib/app-url";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Validation guides by idea type",
  description:
    "Idea validation guides written per business type, because the thing that kills a marketplace is not the thing that kills a SaaS product.",
  alternates: { canonical: `${SITE_URL}/validate` },
};

/**
 * The hub (pSEO guide 5.3): the crawl-discovery backbone for niche pages.
 * A sitemap alone is not a reliable way for a search engine to find and
 * value a set of pages, and readers need somewhere to browse sideways too.
 *
 * Lists only what exists. Guides are added here as they are written, rather
 * than seeding the grid with links to pages that would 404 - a hub full of
 * dead links is worse for both crawling and trust than a short honest one.
 */
const GUIDES = [
  {
    href: "/validate/marketplace-startup-idea",
    title: "Marketplace",
    body: "Two-sided businesses, the cold-start problem, and how to test the harder side first.",
  },
];

export default function ValidateHubPage() {
  return (
    <>
      <MobileCta />

      <section className="pt-8 pb-4 sm:pt-10">
        <Container>
          <Breadcrumbs
            siteUrl={SITE_URL}
            items={[{ href: "/", label: "Home" }, { label: "Validate" }]}
          />

          <div className="mt-8 max-w-[720px]">
            <h1 className="type-display-xl text-primary">
              Validation guides by idea type
            </h1>
            <p className="type-body-l mt-6 text-secondary">
              What kills a marketplace is not what kills a SaaS product, and a
              general validation checklist surfaces neither. These guides cover
              the failure modes specific to each kind of business, and what
              counts as real evidence for it.
            </p>
          </div>
        </Container>
      </section>

      <Section bordered>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group rounded-[12px] border border-line bg-raised p-6 transition-colors duration-[120ms] hover:border-line-strong"
            >
              <h2 className="type-display-m flex items-center gap-2 text-primary">
                {guide.title}
                <ArrowRightIcon
                  size={16}
                  aria-hidden="true"
                  className="text-brand transition-transform duration-[120ms] group-hover:translate-x-0.5"
                />
              </h2>
              <p className="type-body-m mt-2 text-secondary">{guide.body}</p>
            </Link>
          ))}
        </div>

        <p className="type-body-m mt-8 text-tertiary">
          More guides are being written. Each one is published only when it
          says something true about that specific kind of business.
        </p>
      </Section>

      <Section tone="sunken" bordered className="pb-28 sm:pb-32">
        <div className="mx-auto max-w-[560px] text-center">
          <h2 className="type-display-m text-primary">
            Or skip the reading
          </h2>
          <p className="type-body-l mt-4 text-secondary">
            Describe your idea and let the research run. It costs nothing and
            takes a couple of minutes.
          </p>
          <div className="mt-8">
            <Button href={signUpUrl} variant="primary">
              Start free
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
