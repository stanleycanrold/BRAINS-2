import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { EngageWorkspace } from "./EngageWorkspace";

export const metadata: Metadata = { title: "Engage" };

export default async function IdeaEngagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  return <EngageWorkspace ideaId={id} initialState={idea.state} />;
}
