"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowSquareOutIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tab, TabList, TabPanel } from "@/components/ui/Tabs";
import { Textarea, Input, FormField } from "@/components/ui/Field";
import { RadioCardGroup } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Disclosure } from "@/components/ui/Disclosure";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IdeaTopBar } from "../../IdeaTopBar";
import { ValidationInProgress } from "@/components/ValidationInProgress";
import { QuestionsTab } from "@/components/QuestionsTab";
import { ResponseMatrix, toMatrixRows } from "@/components/ResponseMatrix";
import { founderVisible } from "@/lib/domain/response-visibility";
import { cn } from "@/lib/cn";
import {
  CHANNEL_LABELS,
  MIN_RESPONSES,
  type Channel,
  type Confirmed,
  type IdeaState,
} from "@/lib/domain/types";

/**
 * B5 - Normal Track Workspace (design system §4.5).
 *
 * Three tabs: where to find people, what to ask them, and what they said.
 * The running confirmation rate is always visible in Data M mono, because it
 * is the number the whole track exists to produce.
 */

type TabKey = "communities" | "questions" | "responses";

const CONFIRMED_OPTIONS: {
  value: Confirmed;
  label: string;
  description: string;
}[] = [
  {
    value: "yes",
    label: "Yes - they have this problem",
    description: "They described it themselves, unprompted.",
  },
  {
    value: "unsure",
    label: "Sort of / unclear",
    description: "Polite agreement, or it didn't really land.",
  },
  {
    value: "no",
    label: "No - not a problem for them",
    description: "They cope fine, or it isn't relevant.",
  },
];

export function NormalTrack({
  ideaId,
  initialState,
  fastTrackPerInterview,
  paymentsEnabled,
}: {
  ideaId: string;
  initialState: IdeaState;
  fastTrackPerInterview: string;
  paymentsEnabled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [state, setState] = React.useState(initialState);
  const [tab, setTab] = React.useState<TabKey>("communities");
  const [analysing, setAnalysing] = React.useState(false);
  const [confirmEarly, setConfirmEarly] = React.useState(false);

  // The same set the rate below is computed over, so the two always agree.
  // See lib/domain/response-visibility.
  const responses = founderVisible(state.validation.responses);
  const total = responses.length;
  const confirmed = responses.filter((r) => r.confirmed === "yes").length;
  const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const remaining = Math.max(0, MIN_RESPONSES - total);

  async function analyse(force: boolean) {
    setConfirmEarly(false);
    setAnalysing(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/finalize-validation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Analysis didn't finish.");
      }
      router.push(`/ideas/${ideaId}/report`);
    } catch (err) {
      setAnalysing(false);
      toast(
        err instanceof Error ? err.message : "Analysis didn't finish.",
        "danger",
      );
    }
  }

  return (
    <>
      <IdeaTopBar
        ideaId={ideaId}
        title={state.title}
        status={state.status}
        state={state}
      />

      {/**
        * Title, rate and round status in one block.
        *
        * These were three stacked panels saying related things about the same
        * round, which pushed the actual workspace below the fold and made the
        * screen feel like an announcement rather than a place to work. They
        * belong together: what this is, how it is going, and what is running.
        */}
      <Card elevation="raised" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1 className="type-display-l text-primary">Gathering signal</h1>
            <p className="type-body-m mt-1 text-secondary">
              Go have the conversations. Log each one here as you go.
            </p>
          </div>

          {/* The number the track exists to produce, always in view. Before
              anything is logged there is no rate to show, and "0%" reads as a
              bad result rather than an empty one. */}
          <div className="shrink-0 text-left sm:text-right">
            {total > 0 ? (
              <>
                <div className="flex items-baseline gap-1.5 sm:justify-end">
                  <span className="type-data-l text-[26px] text-primary">
                    {rate}%
                  </span>
                  <span className="type-body-m text-secondary">confirmed</span>
                </div>
                <p className="type-caption mt-0.5 text-tertiary">
                  {confirmed} of {total} logged
                </p>
              </>
            ) : (
              <p className="type-body-m text-tertiary">
                Nothing logged yet
              </p>
            )}
          </div>
        </div>

        <ValidationInProgress
          ideaId={ideaId}
          state={state}
          paymentsEnabled={paymentsEnabled}
          bare
          className="mt-5"
        />
      </Card>

      <div className="mt-8">
        <TabList ariaLabel="Validation workspace">
          <Tab
            active={tab === "communities"}
            onClick={() => setTab("communities")}
            count={state.validation.communities.length}
          >
            Where to look
          </Tab>
          <Tab
            active={tab === "questions"}
            onClick={() => setTab("questions")}
            count={state.validation.questionnaire.questions.length}
          >
            What to ask
          </Tab>
          <Tab
            active={tab === "responses"}
            onClick={() => setTab("responses")}
            count={total}
          >
            What they said
          </Tab>
        </TabList>

        <div className="pt-6">
          {tab === "communities" ? (
            <TabPanel>
              <CommunitiesTab state={state} />
            </TabPanel>
          ) : null}

          {tab === "questions" ? (
            <TabPanel>
              <QuestionsTab
                ideaId={ideaId}
                state={state}
                onUpdated={setState}
                fastTrackPerInterview={fastTrackPerInterview}
                paymentsEnabled={paymentsEnabled}
              />
            </TabPanel>
          ) : null}

          {tab === "responses" ? (
            <TabPanel>
              <ResponsesTab
                ideaId={ideaId}
                state={state}
                onLogged={setState}
              />

            </TabPanel>
          ) : null}
        </div>
      </div>

      {/* Soft gate: a nudge with a real reason, never a locked door (§4.5) */}
      {/* Bleeds to the edge at every breakpoint. The inset has to match the
          main padding exactly (px-4 / sm:px-6 / lg:px-8) or the bar stops
          short of the edge on wide screens. */}
      <div className="sticky bottom-0 mt-10 -mx-4 border-t border-line bg-page/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            variant="primary"
            size="large"
            loading={analysing}
            disabled={total === 0}
            onClick={() => (remaining > 0 ? setConfirmEarly(true) : void analyse(false))}
          >
            Finish &amp; analyse
          </Button>

          <p className="type-body-m text-secondary">
            {total === 0
              ? "Log your first response to get started."
              : remaining > 0
                ? `${remaining} more would make this a lot more reliable - but it's your call.`
                : "You've got enough for a solid read."}
          </p>
        </div>
      </div>

      <Modal
        open={confirmEarly}
        onClose={() => setConfirmEarly(false)}
        title="Analyse with a small sample?"
        description={
          <>
            You&rsquo;ve logged <strong>{total}</strong>{" "}
            {total === 1 ? "response" : "responses"}. Below {MIN_RESPONSES}, a
            few strong opinions can swing the result either way. We&rsquo;ll run
            it and flag the small sample prominently on your report - the score
            just deserves less trust than it looks like it does.
          </>
        }
        footer={
          <ModalActions
            onCancel={() => setConfirmEarly(false)}
            cancelLabel="Keep gathering"
          >
            <Button
              variant="primary"
              loading={analysing}
              onClick={() => void analyse(true)}
            >
              Analyse anyway
            </Button>
          </ModalActions>
        }
      />
    </>
  );
}

// ── Communities ─────────────────────────────────────────────────────────────

function CommunitiesTab({ state }: { state: IdeaState }) {
  const communities = state.validation.communities;

  if (communities.length === 0) {
    return (
      <EmptyState title="No communities found yet">
        Live search didn&rsquo;t surface named communities for this problem.
        That usually means your people gather somewhere search can&rsquo;t see - a private Slack, a professional body, or simply in person. Start with
        anyone you already know who fits the description.
      </EmptyState>
    );
  }

  return (
    <Disclosure
      title="Where your people gather"
      count={communities.length}
      summary="Communities and threads to start from"
      storageKey={`brains-validation-communities-${state.idea_id}`}
      defaultOpen
    >
      <p className="type-body-m max-w-prose text-secondary">
        These are places your target user already gathers. Read the example
        thread first - it tells you how people there actually talk about this.
      </p>

      <ul className="mt-4 space-y-3">
        {communities.map((community) => (
          <li
            key={community.id}
            className="rounded-[8px] border border-line bg-raised p-4"
          >
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="type-body-l font-medium text-primary">
                {community.name}
              </h3>
              {community.platform ? (
                <Badge tone="neutral">{community.platform}</Badge>
              ) : null}
            </div>

            <p className="type-body-m mt-1.5 text-secondary">
              {community.why_relevant}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {community.url ? (
                <ExternalLink href={community.url}>
                  Open community
                </ExternalLink>
              ) : null}
              {community.example_thread_url ? (
                <ExternalLink href={community.example_thread_url}>
                  {community.example_thread_title || "Example thread"}
                </ExternalLink>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Disclosure>
  );
}

// ── Script ──────────────────────────────────────────────────────────────────

// ── Responses ───────────────────────────────────────────────────────────────

function ResponsesTab({
  ideaId,
  state,
  onLogged,
}: {
  ideaId: string;
  state: IdeaState;
  onLogged: (next: IdeaState) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [confirmedValue, setConfirmedValue] = React.useState<Confirmed | null>(null);
  const [channel, setChannel] = React.useState<Channel>("interview");
  const [notes, setNotes] = React.useState("");
  const [source, setSource] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const responses = founderVisible(state.validation.responses);

  function reset() {
    setConfirmedValue(null);
    setChannel("interview");
    setNotes("");
    setSource("");
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!confirmedValue) {
      setError("Pick one so we know how to count this.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: confirmedValue,
          channel,
          notes,
          source,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "We couldn't log that response.");
      }
      const body = await response.json();
      onLogged(body.state);
      reset();
      setOpen(false);
      toast("Response logged", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't log that response.",
        "danger",
      );
    } finally {
      setSaving(false);
    }
  }

  /**
   * Ours and theirs, kept apart.
   *
   * A founder needs to know which answers they gathered themselves and which
   * ones they paid for, because the two carry different weight when a number
   * looks surprising. The paid panel only appears once something has actually
   * arrived - an empty box promising interviews is noise on a screen that is
   * meant to be about the conversations already had.
   */
  const own = responses.filter((r) => r.track !== "fast");
  const paid = responses.filter((r) => r.track === "fast");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="type-body-m max-w-prose text-secondary">
          Log every conversation, including the ones that went badly. A
          &ldquo;no&rdquo; is data - filtering them out just moves the problem
          to after you&rsquo;ve built.
        </p>
        <Button
          variant="primary"
          onClick={() => setOpen(true)}
          iconLeft={<PlusIcon size={16} weight="bold" aria-hidden="true" />}
        >
          Log a response
        </Button>
      </div>

      {responses.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          className="mt-6"
          action={
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Log your first response
            </Button>
          }
        >
          After each conversation, come back and record what you heard while
          it&rsquo;s fresh.
        </EmptyState>
      ) : (
        <div className="mt-6 space-y-3">
          <Disclosure
            title="What you gathered"
            count={own.length}
            summary="Conversations you had yourself"
            storageKey={`brains-responses-own-${ideaId}`}
            defaultOpen
          >
            <ResponseList responses={own} />
          </Disclosure>

          {paid.length > 0 ? (
            <Disclosure
              title="Interviews we ran"
              count={paid.length}
              summary="From your Fast Track round"
              storageKey={`brains-responses-paid-${ideaId}`}
              defaultOpen
            >
              <ResponseList responses={paid} />
            </Disclosure>
          ) : null}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          reset();
          setOpen(false);
        }}
        title="Log a response"
        description="One conversation, one entry. Notes matter more than you'd think - the synthesis reads them."
        footer={
          <ModalActions
            onCancel={() => {
              reset();
              setOpen(false);
            }}
          >
            <Button
              variant="primary"
              loading={saving}
              onClick={(e) => void submit(e as unknown as React.FormEvent)}
            >
              Log it
            </Button>
          </ModalActions>
        }
      >
        <form onSubmit={submit} className="space-y-5">
          <div>
            <p className="type-caption mb-2 text-secondary uppercase">
              Did they have the problem?
            </p>
            <RadioCardGroup
              ariaLabel="Did they confirm the problem"
              options={CONFIRMED_OPTIONS}
              value={confirmedValue}
              onChange={(v) => {
                setConfirmedValue(v);
                setError(null);
              }}
            />
            {error ? (
              <p className="type-body-m mt-2 text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div>
            <p className="type-caption mb-2 text-secondary uppercase">
              How did you talk to them?
            </p>
            <div className="flex flex-wrap gap-2">
              {(["interview", "survey", "social"] as Channel[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  aria-pressed={channel === c}
                  className={cn(
                    "type-body-m rounded-full border px-3 py-1.5 transition-colors duration-[120ms]",
                    channel === c
                      ? "border-brand bg-brand-subtle text-brand"
                      : "border-line text-secondary hover:text-primary",
                  )}
                >
                  {CHANNEL_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <FormField
            label="Who was it?"
            htmlFor="response-source"
            hint="A name, a role, or the community - whatever helps you remember."
          >
            <Input
              id="response-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Maya, freelance designer - r/freelance"
            />
          </FormField>

          <FormField
            label="What did they say?"
            htmlFor="response-notes"
            hint="Their words beat your summary. Quotes are gold."
          >
            <Textarea
              id="response-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="They said chasing invoices costs them about half a day a month…"
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

/**
 * Logged responses, in the same grid the report and the shared link use.
 *
 * This screen had its own list - verdict, channel, then the whole note as a
 * paragraph - which was fine for the three responses it was designed against
 * and unreadable at eleven. More to the point it was a fourth rendering of
 * the same rows, so the wording of the screening states differed from the
 * report's and the ops desk's for no reason anyone chose.
 */
function ResponseList({
  responses,
}: {
  responses: IdeaState["validation"]["responses"];
}) {
  return <ResponseMatrix responses={toMatrixRows(responses, { showSource: true })} />;
}


function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="type-body-m inline-flex max-w-full items-center gap-1.5 text-brand hover:underline"
    >
      <span className="truncate">{children}</span>
      <ArrowSquareOutIcon size={14} className="shrink-0" aria-hidden="true" />
    </a>
  );
}
