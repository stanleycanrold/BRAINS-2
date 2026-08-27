import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { getAllPages } from "@/content";

/**
 * An internal index of every pSEO page, for browsing them during development.
 *
 * Deliberately an index and nothing else. The pages themselves stay at
 * /validation/{slug}: moving the URLs a third time would throw away the
 * canonicals, the redirect chain from /answers and /validate, and whatever
 * standing those paths have already accumulated, in exchange for a browsing
 * convenience that this page provides anyway.
 *
 * It is `noindex` and absent from nav, footer and sitemap, so search engines
 * never see it and it cannot compete with the real pages. Deleting this one
 * file before launch removes it completely, with nothing else to unpick.
 *
 * It also renders the ship-gate metadata alongside each entry - track, tags,
 * word count of the answer - because the fastest way to spot a page that has
 * drifted thin is to see it next to its siblings.
 */

export const metadata: Metadata = {
  title: "Content index (internal)",
  robots: { index: false, follow: false },
};

export default function ContentIndexPage() {
  const pages = getAllPages();
  const questions = pages.filter((p) => p.track === "question");
  const businessTypes = pages.filter((p) => p.track === "business-type");

  return (
    <div className="mk-section">
      <Container>
        <p className="type-eyebrow text-caution">Internal, not indexed</p>
        <h1 className="type-display-hero mt-4 text-primary">Content index</h1>
        <p className="type-body-l mt-5 max-w-[70ch] text-secondary">
          Every published pSEO page, for previewing them in one place. This
          index is not linked from the site, not in the sitemap, and carries a
          noindex tag. The pages themselves live at /validation/{"{slug}"} and
          are found through search. Delete this file before launch.
        </p>

        <Group
          title="Question track"
          note="Search-only. Never listed in nav or on the validation page."
          pages={questions}
        />
        <Group
          title="Business-type track"
          note="Linked from the validation page grid."
          pages={businessTypes}
        />
      </Container>
    </div>
  );
}

function Group({
  title,
  note,
  pages,
}: {
  title: string;
  note: string;
  pages: ReturnType<typeof getAllPages>;
}) {
  return (
    <section className="mt-14">
      <h2 className="type-display-m text-primary">{title}</h2>
      <p className="type-body-m mt-1.5 text-tertiary">{note}</p>

      <div className="mk-grid mt-6">
        {pages.map((page) => {
          const words = page.answer.text.trim().split(/\s+/).length;
          return (
            <Link
              key={page.slug}
              href={`/validation/${page.slug}`}
              className="flex flex-col gap-2 p-6 hover:bg-wash-hover sm:flex-row sm:items-center sm:justify-between sm:gap-8"
            >
              <span className="min-w-0">
                <span className="type-body-l block font-medium text-primary">
                  {page.title}
                </span>
                <span className="type-caption mt-1 block text-tertiary">
                  /validation/{page.slug}
                </span>
              </span>

              <span className="flex shrink-0 flex-wrap items-center gap-2">
                {page.tags.map((tag) => (
                  <span
                    key={tag}
                    className="type-caption rounded-full border border-line px-2.5 py-1 text-tertiary"
                  >
                    {tag}
                  </span>
                ))}
                <span className="type-data-s ml-1 text-secondary">
                  {words}w
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
