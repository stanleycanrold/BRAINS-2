"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, WarningIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ResponseAnswerList } from "@/components/ResponseMatrix";
import { CHANNEL_LABELS } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

/**
 * Working through responses one at a time.
 *
 * Cards rather than the grid the founder's report uses: the job here is to
 * read one write-up and decide whether it counts, not to compare a column of
 * answers across respondents. The question/answer rendering is shared, so a
 * reviewer sees the answers laid out the same way the founder eventually
 * will.
 *
 * Pending is the default filter. Everything else on this screen is history;
 * pending is work.
 */

export type QueueItem = {
  id: string;
  versionId: string;
  ideaId: string;
  ideaTitle: string;
  confirmed: string;
  channel: string;
  track: string;
  notes: string;
  source: string;
  reviewStatus: string;
  qualityFlags: string[];
  qualityReasoning: string;
  qualityConfidence: number | null;
  reviewedBy: string;
  createdAt: string;
};

type Filter = "pending" | "approved" | "rejected" | "all";

const STATUS_TONE = {
  approved: "success",
  rejected: "danger",
  pending: "caution",
} as const;

export function ReviewQueue({
  items,
  className,
}: {
  items: QueueItem[];
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>("pending");

  const counts = {
    pending: items.filter((i) => i.reviewStatus === "pending").length,
    approved: items.filter((i) => i.reviewStatus === "approved").length,
    rejected: items.filter((i) => i.reviewStatus === "rejected").length,
    all: items.length,
  };

  const visible =
    filter === "all" ? items : items.filter((i) => i.reviewStatus === filter);

  async function decide(item: QueueItem, status: "approved" | "rejected") {
    setBusyId(item.id);
    try {
      const response = await fetch(`/api/ops/responses/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_status: status,
          versionId: item.versionId,
        }),
      });
      if (!response.ok) throw new Error("failed");
      toast(
        status === "approved"
          ? "Approved - it now counts and the founder can see it"
          : "Rejected - it stays here and nowhere else",
        "success",
      );
      router.refresh();
    } catch {
      toast("That did not save.", "danger");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={cn(
              "type-body-m inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5",
              "transition-colors duration-[120ms]",
              filter === id
                ? "border-brand bg-brand-subtle text-brand"
                : "border-line text-secondary hover:border-line-strong hover:text-primary",
            )}
          >
            {id === "all" ? "Everything" : id}
            <span className="type-data-s opacity-70">{counts[id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="type-body-m mt-6 text-tertiary">
          {filter === "pending"
            ? "Nothing waiting. Every response has been decided on."
            : "Nothing in that state."}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-[8px] border p-4",
                item.reviewStatus === "pending"
                  ? "border-caution/40 bg-raised"
                  : "border-line bg-page",
                item.reviewStatus === "rejected" && "opacity-70",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    STATUS_TONE[item.reviewStatus as keyof typeof STATUS_TONE] ??
                    "neutral"
                  }
                  dot
                >
                  {item.reviewStatus}
                </Badge>
                <Badge tone="neutral">said {item.confirmed}</Badge>
                <span className="type-caption text-tertiary">
                  {CHANNEL_LABELS[item.channel as keyof typeof CHANNEL_LABELS] ??
                    item.channel}
                  {item.track === "fast" ? " · Fast Track" : ""}
                </span>
                {/* Which idea, because this queue spans all of them and the
                    same answer means different things under different
                    questions. */}
                <Link
                  href={`/ideas/${item.ideaId}/report`}
                  className="type-caption text-brand hover:underline"
                >
                  {item.ideaTitle}
                </Link>
                {item.source ? (
                  <span className="type-caption text-tertiary">
                    {item.source}
                  </span>
                ) : null}
                <span className="type-caption ml-auto text-tertiary">
                  {new Date(item.createdAt).toLocaleString("en-GB")}
                </span>
              </div>

              {item.qualityFlags.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {item.qualityFlags.map((flag) => (
                    <span
                      key={flag}
                      className="type-caption rounded-full bg-danger-subtle px-2 py-0.5 text-danger"
                    >
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : null}

              <ResponseAnswerList notes={item.notes} className="mt-3" />

              {/* The machine's opinion, marked as an opinion. A screening run
                  that never completed leaves this empty, which is the only
                  signal that a response is pending because of a failure
                  rather than because nobody has got to it. */}
              <p className="type-body-m mt-3 flex items-start gap-2 border-t border-line pt-3 text-secondary">
                <WarningIcon
                  size={15}
                  className="mt-0.5 shrink-0 text-tertiary"
                  aria-hidden="true"
                />
                <span>
                  {item.qualityReasoning ? (
                    <>
                      {item.qualityReasoning}
                      {item.qualityConfidence != null
                        ? ` (${Math.round(item.qualityConfidence)}% confident)`
                        : ""}
                    </>
                  ) : (
                    "Never screened - the automatic check did not run on this one."
                  )}
                  {item.reviewedBy ? ` Decided by ${item.reviewedBy}.` : ""}
                </span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.reviewStatus !== "approved" ? (
                  <Button
                    variant="secondary"
                    size="compact"
                    loading={busyId === item.id}
                    onClick={() => void decide(item, "approved")}
                    iconLeft={<CheckIcon size={14} aria-hidden="true" />}
                  >
                    Approve
                  </Button>
                ) : null}
                {item.reviewStatus !== "rejected" ? (
                  <Button
                    variant="ghost"
                    size="compact"
                    loading={busyId === item.id}
                    onClick={() => void decide(item, "rejected")}
                    iconLeft={<XIcon size={14} aria-hidden="true" />}
                  >
                    Reject
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
