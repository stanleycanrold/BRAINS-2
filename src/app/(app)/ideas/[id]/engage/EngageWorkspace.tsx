"use client";

import * as React from "react";
import {
  ArrowSquareOutIcon,
  SparkleIcon,
  CopyIcon,
  CheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tab, TabList, TabPanel } from "@/components/ui/Tabs";
import { Textarea, Input } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { TrackedSpaces } from "@/components/TrackedSpaces";
import type { DraftedComment, DraftedPost, IdeaState } from "@/lib/domain/types";

/**
 * B8 - Engage workspace (design system §4.8).
 *
 * Posts and comments are separate tabs because they are separate writing
 * tasks with separate agents: a cold-open post has to earn attention from
 * strangers; a reply has to respond to what someone actually said.
 *
 * "Mark as posted" is gated behind an "I edited this" checkbox - a soft nudge,
 * not a hard block. Unedited drafts read as templated, and templated posts get
 * treated as spam by exactly the communities we need.
 */

type Kind = "post" | "comment";
type TabKey = Kind | "tracked";

export function EngageWorkspace({
  ideaId,
  initialState,
  embedded = false,
}: {
  ideaId: string;
  initialState: IdeaState;
  /** True when rendered inside the slide-over, which supplies its own header. */
  embedded?: boolean;
}) {
  const { toast } = useToast();
  const [state, setState] = React.useState(initialState);
  const [tab, setTab] = React.useState<TabKey>("post");
  const [generating, setGenerating] = React.useState<Kind | null>(null);

  const posts = state.social_engagement.drafted_posts;
  const comments = state.social_engagement.drafted_comments;
  const drafts = tab === "comment" ? comments : posts;
  const postedCount =
    posts.filter((d) => d.posted_at).length +
    comments.filter((d) => d.posted_at).length;

  async function generate(kind: Kind) {
    setGenerating(kind);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/social/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "We couldn't write drafts.");
      setState(body.state);
      toast("Drafts ready", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't write drafts.",
        "danger",
      );
    } finally {
      setGenerating(null);
    }
  }

  return (
    <>
      {!embedded ? (
        <header>
          <h1 className="type-display-l text-primary">Engage</h1>
          <p className="type-body-l mt-1 max-w-prose text-secondary">
            Draft something worth reading, make it sound like you, then post it
            yourself.
          </p>
        </header>
      ) : null}

      <Card className={cn("border-brand/25 bg-brand-subtle p-4", !embedded && "mt-6")}>
        <p className="type-body-m text-primary">
          <strong className="font-medium">We never post as you.</strong> These
          are drafts. Nothing leaves this page unless you copy it there
          yourself.
        </p>
      </Card>

      <div className="mt-6">
        <TabList ariaLabel="Draft type">
          <Tab active={tab === "post"} onClick={() => setTab("post")} count={posts.length}>
            Posts to publish
          </Tab>
          <Tab
            active={tab === "comment"}
            onClick={() => setTab("comment")}
            count={comments.length}
          >
            Replies to leave
          </Tab>
          <Tab
            active={tab === "tracked"}
            onClick={() => setTab("tracked")}
            count={postedCount}
          >
            Posted &amp; tracked
          </Tab>
        </TabList>

        <TabPanel className="pt-6">
          {tab === "tracked" ? (
            <TrackedSpaces ideaId={ideaId} state={state} onUpdated={setState} />
          ) : (
          <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="type-body-m max-w-prose text-secondary">
              {tab === "post"
                ? "Standalone posts that open a genuine question, one per community."
                : "Replies to specific threads we found - each responds to what that person actually said."}
            </p>
            <Button
              variant={drafts.length > 0 ? "secondary" : "primary"}
              loading={generating === tab}
              onClick={() => void generate(tab === "comment" ? "comment" : "post")}
              iconLeft={<SparkleIcon size={16} aria-hidden="true" />}
            >
              {drafts.length > 0 ? "Write more" : "Write drafts"}
            </Button>
          </div>

          {drafts.length === 0 ? (
            <EmptyState title="No drafts yet" className="mt-6">
              {state.validation.communities.length === 0
                ? "We need to find your communities first - start a validation track on this idea."
                : `We'll write one ${tab === "post" ? "post" : "reply"} per community we found.`}
            </EmptyState>
          ) : (
            <ul className="mt-6 space-y-4">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  ideaId={ideaId}
                  kind={tab === "comment" ? "comment" : "post"}
                  draft={draft}
                  onUpdated={setState}
                />
              ))}
            </ul>
          )}
          </>
          )}
        </TabPanel>
      </div>
    </>
  );
}

function DraftCard({
  ideaId,
  kind,
  draft,
  onUpdated,
}: {
  ideaId: string;
  kind: Kind;
  draft: DraftedPost | DraftedComment;
  onUpdated: (next: IdeaState) => void;
}) {
  const { toast } = useToast();
  const [text, setText] = React.useState(draft.edited_text ?? draft.draft_text);
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [postedUrl, setPostedUrl] = React.useState("");

  const posted = draft.status === "posted" || draft.status === "reply_logged";
  const changed = text !== draft.draft_text;
  const threadUrl = "thread_url" in draft ? draft.thread_url : "";

  async function save(status: "edited" | "posted") {
    setBusy(true);
    try {
      // Saving an edit and recording a publish are different things: the
      // second keeps the space so it can be revisited and monitored.
      const response =
        status === "posted"
          ? await fetch(`/api/ideas/${ideaId}/social/track`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "mark_posted",
                draft_id: draft.id,
                posted_url: postedUrl,
              }),
            })
          : await fetch(`/api/ideas/${ideaId}/social/drafts`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                draft_id: draft.id,
                kind,
                status,
                edited_text: text,
              }),
            });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      onUpdated(body.state);
      toast(
        status === "posted"
          ? "Saved - we'll keep this space so you can check back"
          : "Draft saved",
        "success",
      );
    } catch {
      toast("We couldn't save that draft.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <li>
      <Card elevation="raised" className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="type-body-l font-medium text-primary">
                {draft.community}
              </h3>
              {posted ? (
                <Badge tone="success" dot>
                  Posted
                </Badge>
              ) : null}
            </div>
            {"thread_context" in draft && draft.thread_context ? (
              <p className="type-body-m mt-1 text-secondary">
                {draft.thread_context}
              </p>
            ) : null}
          </div>

          {threadUrl ? (
            <a
              href={threadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="type-body-m inline-flex shrink-0 items-center gap-1.5 text-brand hover:underline"
            >
              Open thread
              <ArrowSquareOutIcon size={14} aria-hidden="true" />
            </a>
          ) : null}
        </div>

        {"title" in draft && draft.title ? (
          <p className="type-body-l mt-4 font-medium text-primary">
            {draft.title}
          </p>
        ) : null}

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="mt-3"
          aria-label={`Draft for ${draft.community}`}
          disabled={posted}
        />

        {draft.rationale ? (
          <p className="type-body-m mt-2 text-tertiary">{draft.rationale}</p>
        ) : null}

        {!posted ? (
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <Checkbox
              checked={acknowledged || changed}
              onChange={setAcknowledged}
              label="I've made this sound like me"
              description="Word-for-word drafts read as templated - and get treated that way."
            />

            <Input
              value={postedUrl}
              onChange={(e) => setPostedUrl(e.target.value)}
              placeholder="Paste the link once it's live (optional)"
              aria-label="Link to your published post"
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="compact"
                onClick={() => void copy()}
                iconLeft={
                  copied ? (
                    <CheckIcon size={14} aria-hidden="true" />
                  ) : (
                    <CopyIcon size={14} aria-hidden="true" />
                  )
                }
              >
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="ghost"
                size="compact"
                disabled={!changed || busy}
                onClick={() => void save("edited")}
              >
                Save edit
              </Button>
              <Button
                variant="primary"
                size="compact"
                loading={busy}
                disabled={!acknowledged && !changed}
                onClick={() => void save("posted")}
              >
                Mark as posted
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </li>
  );
}
