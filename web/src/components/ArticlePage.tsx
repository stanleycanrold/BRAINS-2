import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ArticleShell, ArticleSection } from "./ArticleShell";
import { OnThisPage } from "./OnThisPage";
import { ReadingProgress } from "./ReadingProgress";
import { Breadcrumbs } from "./Breadcrumbs";
import { AnswerBox } from "./AnswerBox";
import { IdeaComposer } from "./IdeaComposer";
import { FaqJsonLd } from "./Faq";
import { MobileCta } from "./MobileCta";
import { BlockRenderer } from "./ContentBlocks";
import { getFaq, getRelated, getToc } from "@/content";
import type { ContentPage } from "@/content/types";
import { SITE_URL, signUpUrl } from "@/lib/urls";

/**
 * The master template. Every pSEO page on the site is this component with a
 * different record passed in.
 *
 * One design, many URLs. That distinction is the whole point and it is worth
 * being explicit about, because "one page for all the content" can be heard
 * two ways and only one of them works. Each record still renders at its own
 * address, with its own title, its own canonical, its own structured data,
 * and its own static HTML. Nothing about sharing a React component is visible
 * to a crawler; as far as search engines are concerned these are entirely
 * separate pages, which is exactly what they need to be.
 *
 * Block order is fixed and not configurable per page: question, answer, tool,
 * contents, sections, related, tool again. Someone who arrived from a search
 * result gets the answer before anything else, and the tool immediately
 * after it, on every page, without an author having to remember to arrange
 * it that way.
 */
export function ArticlePage({ page }: { page: ContentPage }) {
  const toc = getToc(page);
  const related = getRelated(page);
  const faq = getFaq(page);

  return (
    <>
      <ReadingProgress />
      <MobileCta />
      {faq ? <FaqJsonLd items={faq} /> : null}

      <div className="pt-8 pb-24 sm:pt-10 sm:pb-28">
        <ArticleShell>
          <Breadcrumbs
            siteUrl={SITE_URL}
            items={[
              { href: "/", label: "Home" },
              { href: "/validation", label: "Validation" },
              { label: page.shortTitle },
            ]}
          />

          <h1 className="type-display-xl mt-8 text-primary">{page.title}</h1>

          <AnswerBox
            className="mt-6"
            stat={page.answer.stat}
            qualifier={page.answer.qualifier}
          >
            {page.answer.text}
          </AnswerBox>

          {/* The tool, immediately under the answer. Someone who searched this
              wants to do it, not only to read about it, and the gap between
              understanding the method and having no idea where to start is
              the gap this closes. */}
          <ToolCard
            heading={page.tool.heading}
            body={page.tool.body}
            facet={page.tool.facet}
            starters={page.tool.starters}
            headingClass="type-display-m"
          />

          <OnThisPage items={toc} className="mt-10" />

          {page.sections.map((section) => (
            <ArticleSection
              key={section.id}
              id={section.id}
              title={section.title}
              lead={section.lead?.map((text) => (
                <p key={text} className="type-body-l text-secondary">
                  {text}
                </p>
              ))}
            >
              <div className="space-y-8">
                {section.blocks.map((block, i) => (
                  <BlockRenderer key={`${section.id}-${i}`} block={block} />
                ))}
              </div>
            </ArticleSection>
          ))}

          <section className="mt-14 border-t border-line pt-12 sm:mt-16 sm:pt-14">
            <h2 className="type-display-m text-primary">Keep going</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[12px] border border-line bg-raised p-5 transition-colors duration-[120ms] hover:border-line-strong"
                >
                  <p className="type-body-m text-secondary">{item.label}</p>
                  <p className="type-body-l mt-1.5 flex items-center gap-1.5 font-medium text-brand">
                    {item.detail}
                    <ArrowRightIcon
                      size={15}
                      aria-hidden="true"
                      className="transition-transform duration-[120ms] group-hover:translate-x-0.5"
                    />
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <ToolCard
            heading={page.cta.heading}
            body={page.cta.body}
            facet={page.tool.facet}
            starters={page.tool.starters}
            headingClass="type-display-l"
            showAccountLink
          />
        </ArticleShell>
      </div>
    </>
  );
}

/**
 * The tool block. Appears twice on every page, near the top and at the end,
 * because someone reading a guide like this decides to act at one of two
 * moments: immediately, or once they have read enough to trust it.
 */
function ToolCard({
  heading,
  body,
  facet,
  starters,
  headingClass,
  showAccountLink,
}: {
  heading: string;
  body: string;
  facet?: { label: string };
  starters?: { label: string; seed: string }[];
  headingClass: string;
  showAccountLink?: boolean;
}) {
  return (
    <section className="mt-10 rounded-[16px] border border-line bg-raised p-6 shadow-[var(--shadow-raised)] sm:mt-14 sm:p-8">
      <h2 className={`${headingClass} text-primary`}>{heading}</h2>
      <p className="type-body-m mt-2 text-secondary">{body}</p>
      <IdeaComposer className="mt-6" facet={facet} starters={starters} />
      {showAccountLink ? (
        <p className="type-caption mt-5 text-tertiary">
          Or{" "}
          <a href={signUpUrl} className="text-brand hover:underline">
            create an account
          </a>{" "}
          first. Nothing you type here is lost when you sign up.
        </p>
      ) : null}
    </section>
  );
}
