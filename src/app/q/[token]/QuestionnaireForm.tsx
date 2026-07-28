"use client";

import * as React from "react";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Textarea, Input } from "@/components/ui/Field";
import { RadioCardGroup } from "@/components/ui/Checkbox";
import { Logo } from "@/components/brand/Logo";
import type { PublicQuestionnaire } from "@/lib/data/questionnaire";
import type { Confirmed } from "@/lib/domain/types";

/**
 * The public questionnaire.
 *
 * This is a stranger's only encounter with BRAINS AI, and they're doing the
 * founder a favour by being here. So: no signup, no marketing, no progress
 * gamification, and an explicit line about what happens to their answers.
 * Everything optional except the one question the score depends on.
 */

const CONFIRM_OPTIONS: { value: Confirmed; label: string; description: string }[] =
  [
    {
      value: "yes",
      label: "Yes, that's a real problem for me",
      description: "It comes up, and it costs me something.",
    },
    {
      value: "unsure",
      label: "Sort of, but it's minor",
      description: "I've noticed it, but I work around it fine.",
    },
    {
      value: "no",
      label: "No, that isn't a problem for me",
      description: "It doesn't really apply to my situation.",
    },
  ];

export function QuestionnaireForm({
  token,
  data,
}: {
  token: string;
  data: PublicQuestionnaire;
}) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = React.useState<Confirmed | null>(null);
  const [source, setSource] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // The confirmation question is asked through the radio group instead of a
  // free-text box, because the confirmation rate is computed from it and free
  // text can't be counted.
  const openQuestions = data.questions.filter((q) => q.kind !== "confirmation");
  const confirmationQuestion = data.questions.find(
    (q) => q.kind === "confirmation",
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!confirmed) {
      setError("Just the one required answer — is this a problem for you?");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/q/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed,
          source,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "That didn't send.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't send.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Shell>
        <div className="rounded-[12px] border border-line bg-raised p-8 text-center">
          <CheckCircleIcon
            size={40}
            weight="fill"
            className="mx-auto text-success"
            aria-hidden="true"
          />
          <h1 className="type-display-m mt-4 text-primary">Thank you</h1>
          <p className="type-body-l mt-2 text-secondary">
            That&rsquo;s genuinely useful. Answers like yours are what stop
            people building things nobody needed.
          </p>
        </div>
      </Shell>
    );
  }

  if (!data.acceptingResponses) {
    return (
      <Shell>
        <div className="rounded-[12px] border border-line bg-raised p-8 text-center">
          <h1 className="type-display-m text-primary">
            This questionnaire is closed
          </h1>
          <p className="type-body-l mt-2 text-secondary">
            Thanks for stopping by — they&rsquo;ve got what they needed.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header>
        <h1 className="type-display-l text-primary">
          A few questions about {data.ideaTitle}
        </h1>
        {data.intro ? (
          <p className="type-body-l mt-3 text-secondary">{data.intro}</p>
        ) : null}
        <p className="type-body-m mt-3 text-tertiary">
          Only one answer is required and there are no wrong ones — a &ldquo;this
          isn&rsquo;t a problem for me&rdquo; is just as useful as a yes.
        </p>
      </header>

      <form onSubmit={submit} className="mt-10 space-y-9">
        {confirmationQuestion ? (
          <fieldset>
            <legend className="type-body-l font-medium text-primary">
              {confirmationQuestion.text}
              <span className="text-danger" aria-hidden="true">
                {" "}
                *
              </span>
            </legend>
            <div className="mt-3">
              <RadioCardGroup
                ariaLabel={confirmationQuestion.text}
                options={CONFIRM_OPTIONS}
                value={confirmed}
                onChange={(v) => {
                  setConfirmed(v);
                  setError(null);
                }}
              />
            </div>
          </fieldset>
        ) : null}

        {openQuestions.map((question) => (
          <div key={question.id}>
            <label
              htmlFor={question.id}
              className="type-body-l block font-medium text-primary"
            >
              {question.text}
            </label>
            <Textarea
              id={question.id}
              rows={3}
              className="mt-2.5"
              value={answers[question.id] ?? ""}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [question.id]: e.target.value }))
              }
              placeholder="However much or little you like…"
            />
          </div>
        ))}

        <div>
          <label
            htmlFor="respondent"
            className="type-body-l block font-medium text-primary"
          >
            Anything to identify you by?{" "}
            <span className="type-body-m text-tertiary">Optional</span>
          </label>
          <Input
            id="respondent"
            className="mt-2.5"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="A first name or your role — or leave it blank"
          />
        </div>

        {error ? (
          <p className="type-body-m text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="border-t border-line pt-6">
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={submitting}
          >
            Send my answers
          </Button>
          <p className="type-body-m mt-3 text-tertiary">
            Your answers go to the person who sent you this link, and are read
            alongside everyone else&rsquo;s to find what people have in common.
            Leave the name field blank if you&rsquo;d rather stay anonymous.
          </p>
        </div>
      </form>
    </Shell>
  );
}

/**
 * The public shell.
 *
 * A respondent arrives from a link with no idea who we are or why they're
 * being asked. The masthead answers that in one line before anything is asked
 * of them — people give better answers when they know what the answers are
 * for, and a bare form from an unknown sender reads as spam.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-raised">
        <div className="mx-auto flex w-full max-w-[640px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Logo size={16} priority />
          <p className="type-body-m text-secondary">
            Helping founders find out if a problem is real
          </p>
        </div>
      </header>

      <div className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-[640px]">{children}</div>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-[640px] px-4 py-6 sm:px-6">
          <p className="type-body-m text-secondary">
            <span className="font-medium text-primary">What is this?</span>{" "}
            Someone is trying to work out whether a problem they&rsquo;ve
            noticed is real before they spend months building something for it.
            BRAINS AI reads answers like yours across everyone who replies and
            looks for what people genuinely have in common — so ideas that
            nobody needed get caught early.
          </p>
          <p className="type-caption mt-3 text-tertiary">
            Your answers go only to the person who sent you this link.
          </p>
        </div>
      </footer>
    </div>
  );
}
