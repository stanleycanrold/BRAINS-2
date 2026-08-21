"use client";

import * as React from "react";
import {
  PlusIcon,
  SparkleIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Disclosure } from "@/components/ui/Disclosure";
import { Input, Textarea } from "@/components/ui/Field";
import {
  QUESTION_KIND_LABELS,
  SELECTABLE_QUESTION_KINDS,
  kindHasOptions,
  type Question,
  type QuestionKind,
} from "@/lib/domain/types";

export function QuestionEditor({
  questions,
  onChange,
  onSave,
  onRewrite,
  saving,
  dirty,
  storageKey,
  readOnly = false,
}: {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  onSave: () => void;
  onRewrite?: () => void;
  saving?: boolean;
  dirty?: boolean;
  storageKey: string;
  readOnly?: boolean;
}) {
  function updateQuestion(id: string, update: (question: Question) => Question) {
    onChange(questions.map((question) => question.id === id ? update(question) : question));
  }

  return (
    <Disclosure
      title="Your questions"
      count={questions.length}
      summary="What every respondent is asked"
      storageKey={storageKey}
      flush
      className="mt-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="type-body-m max-w-prose flex-1 text-secondary">
          Built from your research. Edit anything - you know how your people
          talk better than we do, and questions that sound like a survey get
          survey-quality answers.
        </p>
        {onRewrite && !readOnly ? (
          <Button
            variant="secondary"
            size="compact"
            loading={saving}
            onClick={onRewrite}
            iconLeft={<SparkleIcon size={14} aria-hidden="true" />}
          >
            Rewrite
          </Button>
        ) : null}
      </div>

      <ul className="mt-6 space-y-3">
        {questions.map((question, index) => (
          <li key={question.id} className="rounded-[8px] border border-line bg-raised p-4">
            <div className="flex items-start gap-3">
              <span className="type-data-s mt-2.5 shrink-0 text-tertiary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <Textarea
                  value={question.text}
                  rows={2}
                  readOnly={readOnly}
                  aria-label={`Question ${index + 1}`}
                  onChange={(event) => updateQuestion(question.id, (current) => ({ ...current, text: event.target.value }))}
                />

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {question.kind === "confirmation" ? (
                    <Badge tone="brand" dot>Scored question</Badge>
                  ) : (
                    <label className="inline-flex items-center gap-2">
                      <span className="type-body-m text-tertiary">Answer</span>
                      <select
                        aria-label={`Answer type for question ${index + 1}`}
                        disabled={readOnly}
                        value={question.kind}
                        onChange={(event) => updateQuestion(question.id, (current) => {
                          const kind = event.target.value as QuestionKind;
                          return {
                            ...current,
                            kind,
                            options: kindHasOptions(kind)
                              ? current.options.length ? current.options : ["", ""]
                              : current.options,
                          };
                        })}
                        className="type-body-m rounded-[6px] border border-line bg-page px-2 py-1 text-primary"
                      >
                        {SELECTABLE_QUESTION_KINDS.map((kind) => (
                          <option key={kind} value={kind}>{QUESTION_KIND_LABELS[kind].label}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {question.intent ? <span className="type-body-m text-tertiary">{question.intent}</span> : null}
                </div>

                {kindHasOptions(question.kind) ? (
                  <div className="mt-3 space-y-2 border-l-2 border-line pl-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          readOnly={readOnly}
                          aria-label={`Option ${optionIndex + 1} for question ${index + 1}`}
                          placeholder={`Option ${optionIndex + 1}`}
                          onChange={(event) => updateQuestion(question.id, (current) => ({
                            ...current,
                            options: current.options.map((value, currentIndex) => currentIndex === optionIndex ? event.target.value : value),
                          }))}
                        />
                        {!readOnly ? (
                          <button
                            type="button"
                            aria-label={`Remove option ${optionIndex + 1}`}
                            onClick={() => updateQuestion(question.id, (current) => ({ ...current, options: current.options.filter((_, currentIndex) => currentIndex !== optionIndex) }))}
                            className="shrink-0 rounded-[6px] p-1.5 text-tertiary transition-colors hover:bg-wash-hover hover:text-danger"
                          >
                            <TrashIcon size={14} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {!readOnly ? (
                      <Button
                        variant="ghost"
                        size="compact"
                        onClick={() => updateQuestion(question.id, (current) => ({ ...current, options: [...current.options, ""] }))}
                        iconLeft={<PlusIcon size={13} aria-hidden="true" />}
                      >
                        Add option
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {!readOnly && question.kind !== "confirmation" ? (
                <button
                  type="button"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => onChange(questions.filter((current) => current.id !== question.id))}
                  className="-mt-1 shrink-0 rounded-[6px] p-1.5 text-tertiary transition-colors hover:bg-wash-hover hover:text-danger"
                >
                  <TrashIcon size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {!readOnly ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="compact"
            onClick={() => onChange([...questions, { id: crypto.randomUUID(), text: "", kind: "open", options: [], intent: "", required: false }])}
            iconLeft={<PlusIcon size={14} aria-hidden="true" />}
          >
            Add a question
          </Button>
          <Button
            variant="primary"
            size="compact"
            loading={saving}
            disabled={!dirty || questions.some((question) => !question.text.trim())}
            onClick={onSave}
          >
            Save changes
          </Button>
          {dirty ? <span className="type-body-m text-secondary">Unsaved changes</span> : null}
        </div>
      ) : null}
    </Disclosure>
  );
}
