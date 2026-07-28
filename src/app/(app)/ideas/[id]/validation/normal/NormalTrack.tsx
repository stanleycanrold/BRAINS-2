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
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Textarea, Input, FormField } from "@/components/ui/Field";
import { RadioCardGroup } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IdeaTopBar } from "../../IdeaTopBar";
import { ValidationInProgress } from "@/components/ValidationInProgress";
import { QuestionsTab } from "@/components/QuestionsTab";
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

  const responses = state.validation.responses;
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

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="type-display-l text-primary">Gathering signal</h1>
          <p className="type-body-l mt-1 text-secondary">
            Go have the conversations. Log each one here as you go.
          </p>
        </div>

        {/* The number the track exists to produce - always in view */}
        <Card className="shrink-0 px-5 py-3">
          <div className="flex items-baseline gap-2">
            <span className="type-data-l text-[28px] text-primary">{rate}</span>
            <span className="type-body-m text-secondary">% confirmed</span>
          </div>
          <p className="type-caption mt-0.5 text-tertiary">
            {confirmed} of {total} logged
          </p>
        </Card>
      </header>

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

              {/* This round is already running by definition - reaching this
                  tab required choosing a track. So: state where it stands,
                  and keep the hand-it-over option available as plain text
                  rather than selling a round they've already begun. */}
              <ValidationInProgress
                ideaId={ideaId}
                state={state}
                className="mt-8"
              />
            </TabPanel>
          ) : null}
        </div>
      </div>

      {/* Soft gate: a nudge with a real reason, never a locked door (§4.5) */}
      <div className="sticky bottom-0 mt-10 -mx-4 border-t border-line bg-page/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
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
    <>
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
    </>
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

  const responses = state.validation.responses;

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
        <div className="mt-6 rounded-[8px] border border-line bg-raised">
          <Table>
            <Thead>
              <tr>
                <Th>Confirmed</Th>
                <Th>Channel</Th>
                <Th>Source</Th>
                <Th>Notes</Th>
              </tr>
            </Thead>
            <Tbody>
              {responses.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <Badge
                      tone={
                        r.confirmed === "yes"
                          ? "success"
                          : r.confirmed === "no"
                            ? "danger"
                            : "caution"
                      }
                      dot
                    >
                      {r.confirmed === "yes"
                        ? "Yes"
                        : r.confirmed === "no"
                          ? "No"
                          : "Unsure"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-secondary">
                    {CHANNEL_LABELS[r.channel]}
                  </Td>
                  <Td className="text-secondary">{r.source || "-"}</Td>
                  <Td className="min-w-[240px]">{r.notes || "-"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
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
