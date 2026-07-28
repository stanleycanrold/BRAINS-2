import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicQuestionnaire } from "@/lib/data/questionnaire";
import { QuestionnaireForm } from "./QuestionnaireForm";

export const metadata: Metadata = {
  title: "A few questions",
  // A share link shouldn't end up indexed - it's for the people the founder
  // sends it to, not for search.
  robots: { index: false, follow: false },
};

export default async function PublicQuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPublicQuestionnaire(token);
  if (!data) notFound();

  return <QuestionnaireForm token={token} data={data} />;
}
