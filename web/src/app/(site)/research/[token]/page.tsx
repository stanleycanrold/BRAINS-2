import type { Metadata } from "next";
import { ResearchClient } from "./ResearchClient";

/**
 * One visitor's research brief.
 *
 * `noindex` and absent from the sitemap, deliberately. These pages are
 * generated per submission and hold someone's own idea: they are private in
 * the practical sense even though the token is the only thing protecting
 * them, and they would be exactly the thin, near-duplicate, auto-generated
 * pages that damage a domain's standing if a crawler ever indexed a few
 * thousand of them. The pSEO pages are the ones meant to rank; this is the
 * thing they lead to.
 *
 * A server component only so this metadata can be set. All the behaviour is
 * in the client child, which polls the app's public API directly. That keeps
 * this site free of any database or model dependency, which is what lets
 * every other route stay static HTML.
 */
export const metadata: Metadata = {
  title: "Your research brief",
  robots: { index: false, follow: false },
};

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResearchClient token={token} />;
}
