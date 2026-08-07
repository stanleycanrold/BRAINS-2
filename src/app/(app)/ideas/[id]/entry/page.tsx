import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { IdeaTopBar } from "../IdeaTopBar";
import { EditEntryForm } from "./EditEntryForm";

export const metadata: Metadata = { title: "The idea" };

/**
 * B2b - the entry stage, for an idea that already exists.
 *
 * The pipeline has always shown Entry as a completed stage you can click back
 * to, and clicking it went to Research, because there was nowhere else to go:
 * the entry form only existed at /ideas/new. This is the screen that promise
 * always implied.
 */
export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  return (
    <>
      <IdeaTopBar
        ideaId={id}
        title={idea.title}
        status={idea.status}
        state={idea.state}
      />

      <header className="mb-8">
        <h1 className="type-display-l text-primary">The idea</h1>
        <p className="type-body-l mt-1 max-w-[70ch] text-secondary">
          What you wrote when you started, and everything the research was
          pointed at. Change any of it.
        </p>
      </header>

      <EditEntryForm
        ideaId={id}
        initialState={idea.state}
        hasResearch={Boolean(idea.state.research_report)}
      />
    </>
  );
}
