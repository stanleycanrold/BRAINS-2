import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/auth";
import { getIdea, listVersions } from "@/lib/data/ideas";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { IdeaTopBar } from "../IdeaTopBar";
import { ideaStateSchema } from "@/lib/domain/types";

export const metadata: Metadata = { title: "History" };

/**
 * B10 - Idea Version History (design system §4.10).
 *
 * The rework loop made visible. Versions are append-only, so this timeline is
 * the complete record of how the idea changed and what each round concluded -
 * including for ideas that were killed.
 */
export default async function VersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const idea = await getIdea(id, user.id);
  if (!idea) notFound();

  const versions = await listVersions(id, user.id);
  const ordered = [...versions].reverse();

  return (
    <>
      <IdeaTopBar ideaId={id} title={idea.title} status={idea.status} />

      <header>
        <h1 className="type-display-l text-primary">How this idea evolved</h1>
        <p className="type-body-l mt-1 text-secondary">
          Every round is kept. Nothing is overwritten, so you can always see
          what you thought before and why you changed it.
        </p>
      </header>

      <ol className="mt-8 space-y-4">
        {ordered.map((version, index) => {
          const state = ideaStateSchema.parse(version.stateJson);
          const gate = state.decision_gate;
          const isCurrent = version.id === idea.versionId;

          return (
            <li key={version.id} className="relative pl-8">
              {/* Connecting line - decorative, hidden from the timeline's
                  semantics so screen readers just hear an ordered list. */}
              {index < ordered.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-8 bottom-[-1rem] left-[11px] w-px bg-line"
                />
              ) : null}
              <span
                aria-hidden="true"
                className={`absolute top-6 left-1.5 size-3 rounded-full border-2 ${
                  isCurrent
                    ? "border-brand bg-brand"
                    : "border-line-strong bg-page"
                }`}
              />

              <Card
                elevation={isCurrent ? "raised" : "flat"}
                className="flex flex-wrap items-start justify-between gap-4 p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="type-data-m text-primary">
                      v{version.versionNumber}
                    </span>
                    <StatusBadge status={version.status} />
                    {isCurrent ? (
                      <span className="type-caption text-brand">Current</span>
                    ) : null}
                  </div>

                  <p className="type-body-l mt-2 text-primary">
                    {version.versionNote || "No summary recorded."}
                  </p>

                  <p className="type-body-m mt-1.5 line-clamp-2 text-secondary">
                    {state.structured.problem_statement ||
                      state.raw_submission.description}
                  </p>

                  <p className="type-caption mt-3 text-tertiary">
                    {formatDistanceToNow(version.createdAt, {
                      addSuffix: true,
                    })}
                    {state.validation.responses.length > 0
                      ? ` · ${state.validation.responses.length} responses`
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  {gate?.signal ? <ScoreGauge score={gate.score} size="sm" /> : null}
                  {gate?.signal ? (
                    <Link
                      href={`/ideas/${id}/report`}
                      className="type-body-m text-brand hover:underline"
                    >
                      {isCurrent ? "Open report" : "View"}
                    </Link>
                  ) : null}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </>
  );
}
