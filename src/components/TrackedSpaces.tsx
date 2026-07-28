"use client";

import * as React from "react";
import {
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  PlusIcon,
  ChatCircleTextIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea, Input, FormField } from "@/components/ui/Field";
import { RadioCardGroup } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDistanceToNow } from "date-fns";
import type { Confirmed, IdeaState } from "@/lib/domain/types";

/**
 * Spaces the founder has posted in.
 *
 * Posting is the start of a conversation, not the end of a task. Once
 * something goes live it's kept here so it can be revisited, checked, and -
 * crucially - so any reply that comes back gets captured into the same
 * response pool as interviews, where it counts toward the score.
 */

type Tracked = {
  id: string;
  kind: "post" | "comment";
  community: string;
  url: string;
  postedAt: string | null;
  lastCheckedAt: string | null;
  repliesLogged: number;
};

type MonitorReport = {
  notable_activity: {
    summary: string;
    source_url: string;
    looks_like_problem_confirmation: boolean;
  }[];
  verdict: string;
  worth_revisiting: boolean;
};

const CONFIRM_OPTIONS: { value: Confirmed; label: string; description: string }[] =
  [
    {
      value: "yes",
      label: "They have the problem",
      description: "They described experiencing it themselves.",
    },
    {
      value: "unsure",
      label: "Hard to tell",
      description: "Engaged with the topic, but didn't claim the problem.",
    },
    {
      value: "no",
      label: "Not a problem for them",
      description: "They said it doesn't apply, or they cope fine.",
    },
  ];

export function TrackedSpaces({
  ideaId,
  state,
  onUpdated,
}: {
  ideaId: string;
  state: IdeaState;
  onUpdated: (next: IdeaState) => void;
}) {
  const { toast } = useToast();
  const [checking, setChecking] = React.useState<string | null>(null);
  const [reports, setReports] = React.useState<Record<string, MonitorReport>>({});
  const [replyFor, setReplyFor] = React.useState<Tracked | null>(null);

  const tracked: Tracked[] = [
    ...state.social_engagement.drafted_posts
      .filter((d) => d.posted_at)
      .map((d) => ({
        id: d.id,
        kind: "post" as const,
        community: d.community,
        url: d.posted_url || d.community_url,
        postedAt: d.posted_at,
        lastCheckedAt: d.last_checked_at,
        repliesLogged: d.replies_logged,
      })),
    ...state.social_engagement.drafted_comments
      .filter((d) => d.posted_at)
      .map((d) => ({
        id: d.id,
        kind: "comment" as const,
        community: d.community,
        url: d.posted_url || d.thread_url,
        postedAt: d.posted_at,
        lastCheckedAt: d.last_checked_at,
        repliesLogged: d.replies_logged,
      })),
  ].sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));

  async function check(item: Tracked) {
    setChecking(item.id);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/social/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", draft_id: item.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      onUpdated(body.state);
      setReports((r) => ({ ...r, [item.id]: body.report }));
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't check that space.",
        "danger",
      );
    } finally {
      setChecking(null);
    }
  }

  if (tracked.length === 0) {
    return (
      <EmptyState title="Nothing posted yet">
        Once you publish a draft and mark it as posted, the space is kept here
        so you can come back to it - and so any reply you get counts toward
        your score.
      </EmptyState>
    );
  }

  return (
    <>
      <p className="type-body-m max-w-prose text-secondary">
        Every space you&rsquo;ve posted in. When someone replies, log it - a
        reply from a real person counts exactly the same as an interview.
      </p>

      <ul className="mt-5 space-y-3">
        {tracked.map((item) => {
          const report = reports[item.id];

          return (
            <li key={item.id}>
              <Card elevation="raised" className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="type-body-l font-medium text-primary">
                        {item.community}
                      </h3>
                      <Badge tone="neutral">
                        {item.kind === "post" ? "Post" : "Reply"}
                      </Badge>
                      {item.repliesLogged > 0 ? (
                        <Badge tone="success" dot>
                          {item.repliesLogged}{" "}
                          {item.repliesLogged === 1 ? "reply" : "replies"} logged
                        </Badge>
                      ) : null}
                    </div>
                    <p className="type-caption mt-1 text-tertiary">
                      Posted{" "}
                      {item.postedAt
                        ? formatDistanceToNow(new Date(item.postedAt), {
                            addSuffix: true,
                          })
                        : "recently"}
                      {item.lastCheckedAt
                        ? ` · checked ${formatDistanceToNow(new Date(item.lastCheckedAt), { addSuffix: true })}`
                        : ""}
                    </p>
                  </div>

                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-body-m inline-flex shrink-0 items-center gap-1.5 text-brand hover:underline"
                    >
                      Open
                      <ArrowSquareOutIcon size={14} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>

                {report ? (
                  <div className="mt-4 rounded-[8px] border border-line bg-page p-4">
                    <p className="type-body-m text-primary">{report.verdict}</p>
                    {report.notable_activity.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {report.notable_activity.map((a, i) => (
                          <li key={i} className="type-body-m text-secondary">
                            <a
                              href={a.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand hover:underline"
                            >
                              {a.summary}
                            </a>
                            {a.looks_like_problem_confirmation ? (
                              <Badge tone="success" className="ml-2">
                                Looks like confirmation
                              </Badge>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="type-caption mt-3 text-tertiary">
                      Based on a web search, not a live read of the thread - so
                      treat it as a nudge to go look, not a full picture.
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  <Button
                    variant="primary"
                    size="compact"
                    onClick={() => setReplyFor(item)}
                    iconLeft={<PlusIcon size={14} aria-hidden="true" />}
                  >
                    Log a reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="compact"
                    loading={checking === item.id}
                    onClick={() => void check(item)}
                    iconLeft={<ArrowsClockwiseIcon size={14} aria-hidden="true" />}
                  >
                    Anything new?
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <LogReplyModal
        ideaId={ideaId}
        item={replyFor}
        onClose={() => setReplyFor(null)}
        onLogged={onUpdated}
      />
    </>
  );
}

function LogReplyModal({
  ideaId,
  item,
  onClose,
  onLogged,
}: {
  ideaId: string;
  item: Tracked | null;
  onClose: () => void;
  onLogged: (next: IdeaState) => void;
}) {
  const { toast } = useToast();
  const [confirmed, setConfirmed] = React.useState<Confirmed | null>(null);
  const [notes, setNotes] = React.useState("");
  const [source, setSource] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setConfirmed(null);
    setNotes("");
    setSource("");
    setError(null);
  }

  async function submit() {
    if (!confirmed) {
      setError("Pick one so we know how to count it.");
      return;
    }
    if (!item) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/social/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_reply",
          draft_id: item.id,
          confirmed,
          notes,
          source: source || item.community,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      onLogged(body.state);
      reset();
      onClose();
      toast("Reply logged", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't log that.",
        "danger",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={item !== null}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Log a reply"
      description={
        <span className="flex items-start gap-2">
          <ChatCircleTextIcon
            size={18}
            className="mt-0.5 shrink-0 text-secondary"
            aria-hidden="true"
          />
          <span>
            Someone answered in {item?.community}. This counts toward your score
            exactly like an interview does.
          </span>
        </span>
      }
      footer={
        <ModalActions
          onCancel={() => {
            reset();
            onClose();
          }}
        >
          <Button variant="primary" loading={saving} onClick={() => void submit()}>
            Log it
          </Button>
        </ModalActions>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="type-caption mb-2 text-secondary uppercase">
            Did they describe having the problem?
          </p>
          <RadioCardGroup
            ariaLabel="Did they confirm the problem"
            options={CONFIRM_OPTIONS}
            value={confirmed}
            onChange={(v) => {
              setConfirmed(v);
              setError(null);
            }}
          />
          {error ? (
            <p className="type-body-m mt-2 text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <FormField
          label="Who replied?"
          htmlFor="reply-source"
          hint="A username or role is plenty."
        >
          <Input
            id="reply-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={item?.community ?? ""}
          />
        </FormField>

        <FormField
          label="What did they say?"
          htmlFor="reply-notes"
          hint="Their words, not your summary - the synthesis reads these."
        >
          <Textarea
            id="reply-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="They said they lose about a day a month to this…"
          />
        </FormField>
      </div>
    </Modal>
  );
}
