import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicJourney } from "@/lib/data/journey";
import { JourneyView } from "./JourneyView";

/**
 * The public journey. No account, no session, read-only.
 *
 * `noindex` for the same reason the questionnaire link is: this is for the
 * people the founder sent it to, not for search. It is also somebody's
 * unlaunched idea, and having it turn up in results because they showed a
 * co-founder would be a genuine betrayal of what sharing meant.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const journey = await getPublicJourney(token);

  return {
    title: journey ? `${journey.title} - validation journey` : "Not found",
    description: journey?.summary || undefined,
    robots: { index: false, follow: false },
  };
}

export default async function PublicJourneyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const journey = await getPublicJourney(token);
  if (!journey) notFound();

  return <JourneyView journey={journey} />;
}
