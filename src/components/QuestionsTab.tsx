"use client";

import * as React from "react";
import {
  SparkleIcon,
  CopyIcon,
  CheckIcon,
  LinkSimpleIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { FastTrackTeaser } from "@/components/FastTrackTeaser";
import { QuestionEditor } from "@/components/QuestionEditor";
import { validationStage } from "@/lib/validation-stage";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
import { canMarketFastTrack } from "@/lib/validation-stage";
import {
  type IdeaState,
  type Question,
} from "@/lib/domain/types";

/**
 * The validation questions, built from this idea's research.
 *
 * One set drives everything: the founder's own validation, the public
 * questionnaire link, and any validation run on their behalf. Keeping a single
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
  const questionsLocked =
    validationStage(state) !== "not_started" || state.validation.responses.length > 0;

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
  * the validation they paid for - the token an answer arrives on is what
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
                lands in the same pool as your other responses - analysed together.
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
                The responses from your paid validation round come in on this link, so they stay
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


        <QuestionEditor
          questions={questions}
          onChange={setQuestions}
          onSave={() => void patch({ questions }, "Questions saved")}
          onRewrite={() => void generate()}
          saving={saving || generating}
          dirty={dirty}
          storageKey={`brains-questions-list-${ideaId}`}
          readOnly={questionsLocked}
        />
        {questionsLocked ? (
          <p className="type-caption mt-3 text-secondary">
            Questions are locked because validation has started or responses
            have been recorded. The approved question set is now being used.
          </p>
        ) : null}
      </div>

    </>
  );
}
