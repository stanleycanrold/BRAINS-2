"use client";

import * as React from "react";
import {
  SparkleIcon,
  CopyIcon,
  CheckIcon,
  LinkSimpleIcon,
  TrashIcon,
  PlusIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Badge } from "@/components/ui/Badge";
import { Textarea, Input } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { FastTrackTeaser } from "@/components/FastTrackTeaser";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
import { canMarketFastTrack } from "@/lib/validation-stage";
import {
  QUESTION_KIND_LABELS,
  SELECTABLE_QUESTION_KINDS,
  kindHasOptions,
  type IdeaState,
  type Question,
  type QuestionKind,
} from "@/lib/domain/types";

/**
 * The interview questions, built from this idea's research.
 *
 * One set drives everything: the founder's own interviews, the public
 * questionnaire link, and any interviews run on their behalf. Keeping a single
 * set is what makes responses from all three comparable - and what lets the
 * Decision Gate score them as one pool rather than three.
 */
export function QuestionsTab({
  ideaId,
  state,
  onUpdated,
  fastTrackPerInterview,
  paymentsEnabled,
}: {
  ideaId: string;
  state: IdeaState;
  onUpdated: (next: IdeaState) => void;
  fastTrackPerInterview?: string;
  paymentsEnabled?: boolean;
}) {
  const { toast } = useToast();
  const questionnaire = state.validation.questionnaire;

  const [questions, setQuestions] = React.useState<Question[]>(
    questionnaire.questions,
  );
  const [generating, setGenerating] = React.useState(false);
  const marketFastTrack = canMarketFastTrack(state);
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const dirty =
    JSON.stringify(questions) !== JSON.stringify(questionnaire.questions);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = questionnaire.share_token
    ? `${origin}/q/${questionnaire.share_token}`
    : null;

  /**
   * The paid round answers on its own link.
   *
   * Two links rather than one so the founder can tell their own outreach from
   * the interviews they paid for - the token an answer arrives on is what
   * attributes it. Only exists once a round is paid.
   */
  const panelUrl = questionnaire.panel_share_token
    ? `${origin}/q/${questionnaire.panel_share_token}`
    : null;

  async function generate() {
    setGenerating(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/questions`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      onUpdated(body.state);
      setQuestions(body.state.validation.questionnaire.questions);
      toast("Questions written from your research", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't write the questions.",
        "danger",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function patch(payload: Record<string, unknown>, message?: string) {
    setSaving(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      onUpdated(body.state);
      setQuestions(body.state.validation.questionnaire.questions);
      if (message) toast(message, "success");
      return body.state as IdeaState;
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't save that.",
        "danger",
      );
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        title="No questions yet"
        action={
          <Button
            variant="primary"
            loading={generating}
            onClick={() => void generate()}
            iconLeft={<SparkleIcon size={16} aria-hidden="true" />}
          >
            Write questions from my research
          </Button>
        }
      >
        We&rsquo;ll write them from what the research actually found about your
        problem - so they ask about this specific situation, not a generic
        customer-research template.
      </EmptyState>
    );
  }

  /**
   * Two panels: the questions, and where they go.
   *
   * These were four stacked cards - an intro, an offer, a share box and the
   * editor - which meant scrolling past the thing you came to edit to find
   * out whether it had saved. Folded up, the whole tab fits on one screen and
   * you open the part you actually want.
   */
  return (
    <>
      {/* By the time anyone reaches this tab a track has been chosen, so the
          round is underway and this slot states where it stands. Pitching
          "start validation" here would ignore what they've already started - the offer belongs at the track decision, before they'd pay. */}
      {marketFastTrack && paymentsEnabled && fastTrackPerInterview ? (
        <div className="mt-5 flex justify-end">
          <FastTrackTeaser
            ideaId={ideaId}
            perInterviewPrice={fastTrackPerInterview}
            responsesLogged={state.validation.responses.length}
          />
        </div>
      ) : null}


      {/**
        * One panel, with the link at the top of it.
        *
        * Getting a link and sending it is the whole job of this tab, so it is
        * visible the moment the tab opens rather than behind a fold. The
        * questions are the long part and the part you only open when you
        * intend to edit, so they are the one thing that folds.
        */}
      <div className="mt-5 rounded-[12px] border border-line bg-raised p-5">
      {/* ── Share link ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="type-body-l font-medium text-primary">
              {panelUrl ? "Your own link" : "Share as a link"}
            </h3>
            <p className="type-body-m mt-1 max-w-prose text-secondary">
              Send it to anyone. They answer without signing up, and every reply
              lands in the same pool as your interviews - analysed together.
              {panelUrl
                ? " Answers here are counted as your own outreach."
                : ""}
            </p>
          </div>
          {!shareUrl ? (
            <Button
              variant="primary"
              loading={saving}
              onClick={() => void patch({ share: true }, "Link created")}
              iconLeft={<LinkSimpleIcon size={16} aria-hidden="true" />}
            >
              Create link
            </Button>
          ) : null}
        </div>

        {shareUrl ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="type-data-s min-w-0 flex-1 truncate rounded-[6px] border border-line bg-page px-3 py-2 text-secondary">
                {shareUrl}
              </code>
              <Button
                variant="secondary"
                onClick={() => void copyLink(shareUrl)}
                iconLeft={
                  copied ? (
                    <CheckIcon size={15} aria-hidden="true" />
                  ) : (
                    <CopyIcon size={15} aria-hidden="true" />
                  )
                }
              >
                {copied ? "Copied" : "Copy"}
              </Button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="type-body-m inline-flex items-center gap-1.5 px-2 text-brand hover:underline"
              >
                Preview
                <ArrowSquareOutIcon size={14} aria-hidden="true" />
              </a>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <Toggle
                checked={questionnaire.accepting_responses}
                onChange={(v) =>
                  void patch(
                    { accepting_responses: v },
                    v ? "Accepting responses" : "Questionnaire closed",
                  )
                }
                label="Accepting responses"
                description="Turn this off when you've got enough - the link stays, it just stops collecting."
              />
            </div>
          </>
        ) : null}
      </div>

      {/* ── The paid round's link ──────────────────────────────────────── */}
      {panelUrl ? (
        <div className="mt-5 rounded-[10px] border border-brand/30 bg-page p-4">
          <div className="flex items-start gap-2.5">
            <LightningIcon
              size={18}
              weight="fill"
              className="mt-0.5 shrink-0 text-brand"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <h3 className="type-body-l font-medium text-primary">
                Fast Track link
              </h3>
              <p className="type-body-m mt-1 max-w-prose text-secondary">
                The interviews you paid for come in on this link, so they stay
                countable separately from your own outreach. You don&rsquo;t
                need to send it anywhere - it&rsquo;s here so you can see where
                each answer came from.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <code className="type-data-s min-w-0 flex-1 truncate rounded-[6px] border border-line bg-page px-3 py-2 text-secondary">
                  {panelUrl}
                </code>
                <Button
                  variant="secondary"
                  onClick={() => void copyLink(panelUrl)}
                  iconLeft={
                    copied ? (
                      <CheckIcon size={15} aria-hidden="true" />
                    ) : (
                      <CopyIcon size={15} aria-hidden="true" />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}


        <Disclosure
          title="Your questions"
          count={questions.length}
          summary="What every respondent is asked"
          storageKey={`brains-questions-list-${ideaId}`}
          flush
          className="mt-5"
        >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="type-body-m max-w-prose flex-1 text-secondary">
            Built from your research. Edit anything - you know how your people
            talk better than we do, and questions that sound like a survey get
            survey-quality answers.
          </p>
          <Button
            variant="secondary"
            size="compact"
            loading={generating}
            onClick={() => void generate()}
            iconLeft={<SparkleIcon size={14} aria-hidden="true" />}
          >
            Rewrite
          </Button>
        </div>

        {/* ── Questions ──────────────────────────────────────────────────── */}
        <ul className="mt-6 space-y-3">
          {questions.map((question, index) => (
            <li
              key={question.id}
              className="rounded-[8px] border border-line bg-raised p-4"
            >
              <div className="flex items-start gap-3">
                <span className="type-data-s mt-2.5 shrink-0 text-tertiary">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <Textarea
                    value={question.text}
                    rows={2}
                    aria-label={`Question ${index + 1}`}
                    onChange={(e) =>
                      setQuestions((qs) =>
                        qs.map((q) =>
                          q.id === question.id ? { ...q, text: e.target.value } : q,
                        ),
                      )
                    }
                  />

                  {/* How they answer. The scored question is fixed: its whole
                      job is to produce a yes/unsure/no the rate is computed
                      from, so letting it become a paragraph would quietly
                      break the score. */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {question.kind === "confirmation" ? (
                      <Badge tone="brand" dot>
                        Scored question
                      </Badge>
                    ) : (
                      <label className="inline-flex items-center gap-2">
                        <span className="type-body-m text-tertiary">Answer</span>
                        <select
                          aria-label={`Answer type for question ${index + 1}`}
                          value={question.kind}
                          onChange={(e) =>
                            setQuestions((qs) =>
                              qs.map((q) =>
                                q.id === question.id
                                  ? {
                                      ...q,
                                      kind: e.target.value as QuestionKind,
                                      // Seed two blank rows so a choice question
                                      // never renders with nothing to pick.
                                      options: kindHasOptions(
                                        e.target.value as QuestionKind,
                                      )
                                        ? q.options.length
                                          ? q.options
                                          : ["", ""]
                                        : q.options,
                                    }
                                  : q,
                              ),
                            )
                          }
                          className="type-body-m rounded-[6px] border border-line bg-page px-2 py-1 text-primary"
                        >
                          {SELECTABLE_QUESTION_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {QUESTION_KIND_LABELS[k].label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {question.intent ? (
                      <span className="type-body-m text-tertiary">
                        {question.intent}
                      </span>
                    ) : null}
                  </div>

                  {kindHasOptions(question.kind) ? (
                    <div className="mt-3 space-y-2 border-l-2 border-line pl-3">
                      {question.options.map((option, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <Input
                            value={option}
                            aria-label={`Option ${oi + 1} for question ${index + 1}`}
                            placeholder={`Option ${oi + 1}`}
                            onChange={(e) =>
                              setQuestions((qs) =>
                                qs.map((q) =>
                                  q.id === question.id
                                    ? {
                                        ...q,
                                        options: q.options.map((o, i) =>
                                          i === oi ? e.target.value : o,
                                        ),
                                      }
                                    : q,
                                ),
                              )
                            }
                          />
                          <button
                            type="button"
                            aria-label={`Remove option ${oi + 1}`}
                            onClick={() =>
                              setQuestions((qs) =>
                                qs.map((q) =>
                                  q.id === question.id
                                    ? {
                                        ...q,
                                        options: q.options.filter(
                                          (_, i) => i !== oi,
                                        ),
                                      }
                                    : q,
                                ),
                              )
                            }
                            className="shrink-0 rounded-[6px] p-1.5 text-tertiary transition-colors hover:bg-wash-hover hover:text-danger"
                          >
                            <TrashIcon size={14} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="compact"
                        onClick={() =>
                          setQuestions((qs) =>
                            qs.map((q) =>
                              q.id === question.id
                                ? { ...q, options: [...q.options, ""] }
                                : q,
                            ),
                          )
                        }
                        iconLeft={<PlusIcon size={13} aria-hidden="true" />}
                      >
                        Add option
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* The confirmation question is what the score is computed from,
                    so it can't be removed - only reworded. */}
                {question.kind !== "confirmation" ? (
                  <button
                    type="button"
                    aria-label={`Remove question ${index + 1}`}
                    onClick={() =>
                      setQuestions((qs) => qs.filter((q) => q.id !== question.id))
                    }
                    className="-mt-1 shrink-0 rounded-[6px] p-1.5 text-tertiary transition-colors hover:bg-wash-hover hover:text-danger"
                  >
                    <TrashIcon size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="compact"
            onClick={() =>
              setQuestions((qs) => [
                ...qs,
                {
                  id: crypto.randomUUID(),
                  text: "",
                  kind: "open",
                  options: [],
                  intent: "",
                  required: false,
                },
              ])
            }
            iconLeft={<PlusIcon size={14} aria-hidden="true" />}
          >
            Add a question
          </Button>

          <Button
            variant="primary"
            size="compact"
            loading={saving}
            disabled={!dirty || questions.some((q) => !q.text.trim())}
            onClick={() => void patch({ questions }, "Questions saved")}
          >
            Save changes
          </Button>

          {dirty ? (
            <span className={cn("type-body-m text-secondary")}>
              Unsaved changes
            </span>
          ) : null}
        </div>
        </Disclosure>
      </div>

    </>
  );
}
