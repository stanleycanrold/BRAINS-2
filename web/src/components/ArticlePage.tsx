import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./Container";
import { Section } from "./Section";
import { ArticleSection } from "./ArticleShell";
import { ReadingProgress } from "./ReadingProgress";
import { Breadcrumbs } from "./Breadcrumbs";
import { AnswerBox } from "./AnswerBox";
import { IdeaComposer } from "./IdeaComposer";
import { FaqJsonLd } from "./Faq";
import { MobileCta } from "./MobileCta";
import { BlockRenderer } from "./ContentBlocks";
import { ArticleJsonLd } from "./SiteJsonLd";
import { ReportPreview } from "./ReportPreview";
import { getFaq, getRelated } from "@/content";
import type { ContentPage } from "@/content/types";
import { SITE_URL } from "@/lib/urls";
import { useStudioEntry } from "@/components/landing/MarketingShell";

/**
 * The master template. Every pSEO page on the site is this component with a
 * different record passed in.
 *
 * One design, many URLs. That distinction is the whole point and worth being
 * explicit about, because "one page for all the content" can be heard two
 * ways and only one of them works. Each record still renders at its own
 * address with its own title, canonical, structured data and static HTML.
 * Nothing about sharing a React component is visible to a crawler.
 *
 * The order is fixed and not configurable per page: question, answer, tool,
 * the substance, related, tool again. Someone arriving from a search result
 * gets the answer before anything else and the tool beside it, on every page,
 * without an author having to remember to arrange it that way.
 *
 * The hero is two columns because the answer and the tool are both the point.
 * Stacking them, as an earlier version did, pushed the tool below the fold on
 * every laptop; side by side, a founder can read the answer and act on it
 * without scrolling at all.
 */
export function ArticlePage({ page }: { page: ContentPage }) {
  const related = getRelated(page);
  const faq = getFaq(page);
  const { openContact } = useStudioEntry();

  return (
    <>
      <ReadingProgress />
      <MobileCta onContact={openContact} />
      {faq ? <FaqJsonLd items={faq} /> : null}
      <ArticleJsonLd
        headline={page.metaTitle}
        description={page.metaDescription}
        slug={page.slug}
        updated={page.updated}
      />

      <section className="pt-8 pb-16 sm:pt-10 sm:pb-24">
        <Container>
          <Breadcrumbs
            siteUrl={SITE_URL}
            items={[
              { href: "/", label: "Home" },
              { href: "/validation", label: "Validation" },
              { label: page.shortTitle },
            ]}
          />

          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
            <div className="mk-rise">
              <h1 className="type-display-hero max-w-[20ch] text-balance text-primary">
                {page.title}
              </h1>
              <AnswerBox
                className="mt-8"
                stat={page.answer.stat}
                qualifier={page.answer.qualifier}
              >
                {page.answer.text}
              </AnswerBox>
            </div>

            {/* Sticky so the tool stays reachable through the whole article
                without a second copy being wedged between sections. */}
            <div className="mk-rise mk-delay-2 lg:sticky lg:top-28">
              <ToolPanel
                heading={page.tool.heading}
                body={page.tool.body}
                facet={page.tool.facet}
                starters={page.tool.starters}
              />
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="space-y-16 sm:space-y-24">
          {page.sections.map((section, i) => (
            <ArticleSection
              key={section.id}
              id={section.id}
              index={i + 1}
              title={section.title}
              lead={section.lead?.map((text) => (
                <p key={text} className="type-body-l text-secondary">
                  {text}
                </p>
              ))}
            >
              {section.blocks.map((block, j) => (
                <BlockRenderer key={`${section.id}-${j}`} block={block} />
              ))}
            </ArticleSection>
          ))}
        </div>
      </Container>

      {/* The sample sits after the argument and before the related links.
          A founder who has read this far has been told what evidence is worth
          collecting; this is the first chance to see what it looks like
          assembled, which is the question they actually decide on. Placing it
          after "Keep going" would put the strongest artifact on the page below
          four links out of it. */}
      <ReportPreview
        eyebrow="What you get back"
        title="A look inside a real brief"
        lead="Not a screenshot of an interface. This is the artifact a round produces, with every score attached to the evidence behind it. It is an extract; the full one goes further on all of it."
      />

      <Section bordered className="mt-16 sm:mt-24">
        <h2 className="type-display-hero text-primary">Keep going</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <Link key={item.href} href={item.href} className="mk-card group p-6">
              <p className="type-eyebrow text-tertiary">{item.label}</p>
              <p className="type-body-l mt-3 font-medium text-primary">
                {item.detail}
              </p>
              <ArrowRightIcon
                size={16}
                aria-hidden="true"
                className="mt-5 text-brand transition-transform duration-[160ms] group-hover:translate-x-1"
              />
            </Link>
          ))}
        </div>
      </Section>

      <section className="mk-section-sm mk-topline">
        <Container>
          <div className="mk-panel overflow-hidden p-8 sm:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
              <div>
                <h2 className="type-display-hero max-w-[16ch] text-balance text-primary">
                  {page.cta.heading}
                </h2>
                <p className="type-body-xl mt-5 max-w-[52ch] text-secondary">
                  {page.cta.body}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={openContact}
                    className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-accent rounded-xl text-sm font-bold inline-flex items-center gap-2"
                  >
                    Contact us
                  </button>
                  <a
                    href="https://calendar.app.google/PmNmyQbGWNgM5cfz7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 border border-line text-primary hover:bg-sunken rounded-xl text-sm font-bold inline-flex items-center gap-2"
                  >
                    Book a meeting
                  </a>
                </div>
              </div>
              <IdeaComposer
                facet={page.tool.facet}
                starters={page.tool.starters}
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/**
 * The tool, as the hero's right-hand column. Given panel treatment rather
 * than sitting bare on the page, because on a page whose job is to answer a
 * question the tool has to read as the product rather than as one more
 * section of the article.
 */
function ToolPanel({
  heading,
  body,
  facet,
  starters,
}: {
  heading: string;
  body: string;
  facet?: { label: string };
  starters?: { label: string; seed: string }[];
}) {
  return (
    <div className="mk-panel p-6 sm:p-7">
      <p className="type-eyebrow text-brand">Try it now</p>
      <h2 className="type-display-m mt-3 text-primary">{heading}</h2>
      <p className="type-body-m mt-2.5 text-secondary">{body}</p>
      <IdeaComposer className="mt-6" facet={facet} starters={starters} />
    </div>
  );
}
