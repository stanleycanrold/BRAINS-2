import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IdeaComposer } from "@/components/IdeaComposer";
import { MobileCta } from "@/components/MobileCta";
import { getBusinessTypePages } from "@/content";
import { SITE_URL } from "@/lib/urls";

/**
 * The validation service page. What the nav points at.
 *
 * Not a content index, and the distinction is deliberate. This page describes
 * what BRAINS does at the validation stage and offers the tool; it links to
 * the business-type guides, because there will only ever be a few dozen of
 * those and each one is a genuinely different kind of business someone might
 * be building.
 *
 * It does not list the question pages, and will not as they grow into the
 * hundreds. Those are reached from search, from the sitemap, and from the
 * computed cross-links between articles. A hub that tries to catalogue every
 * page becomes unreadable long before it becomes useful, and a nav that grows
 * with the content dilutes the handful of links that actually matter to
 * someone deciding whether to trust the product.
 *
 * The grid is generated from the content records, so a new business-type
 * guide appears here the moment it is written, with no edit to this file.
 */

export const metadata: Metadata = {
  title: "Validate your startup idea",
  description:
    "Research whether the problem is real, get the questions worth asking, and score the answers. Validation guides by kind of business.",
  alternates: { canonical: `${SITE_URL}/validation` },
};

export default function ValidationHubPage() {
  const guides = getBusinessTypePages();

  return (
    <>
      <MobileCta />

      <section className="pt-8 pb-4 sm:pt-10">
        <Container>
          <Breadcrumbs
            siteUrl={SITE_URL}
            items={[{ href: "/", label: "Home" }, { label: "Validation" }]}
          />

          <div className="mt-8 max-w-[680px]">
            <h1 className="type-display-xl text-primary">
              Validate the idea before you build it
            </h1>
            <p className="type-body-l mt-6 text-secondary">
              Describe what you are building. We research whether the problem
              is real and cite where we found it, write the questions worth
              asking, and score the answers that come back.
            </p>
          </div>

          <div className="mt-10 max-w-[680px] rounded-[16px] border border-line bg-raised p-6 shadow-[var(--shadow-raised)] sm:p-8">
            <IdeaComposer />
          </div>
        </Container>
      </section>

      <Section bordered>
        <div className="max-w-[860px]">
          <h2 className="type-display-l text-primary">
            Validate your kind of business
          </h2>
          <p className="type-body-l mt-4 max-w-[620px] text-secondary">
            What kills a marketplace is not what kills a SaaS product, and a
            general validation checklist surfaces neither. These cover the
            failure modes specific to each kind of business, and what counts as
            real evidence for it.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/validation/${guide.slug}`}
                className="group rounded-[12px] border border-line bg-raised p-6 transition-colors duration-[120ms] hover:border-line-strong"
              >
                <h3 className="type-display-m flex items-start gap-2 text-primary">
                  <span className="min-w-0">{guide.shortTitle}</span>
                  <ArrowRightIcon
                    size={16}
                    aria-hidden="true"
                    className="mt-1.5 shrink-0 text-brand transition-transform duration-[120ms] group-hover:translate-x-0.5"
                  />
                </h3>
                <p className="type-body-m mt-2.5 text-secondary">
                  {guide.summary}
                </p>
              </Link>
            ))}
          </div>

          <p className="type-body-m mt-8 text-tertiary">
            More guides are being written. Each one is published when it says
            something specific enough to be worth the page, and not before.
          </p>
        </div>
      </Section>
    </>
  );
}
