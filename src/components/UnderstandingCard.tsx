"use client";

import * as React from "react";
import {
  PencilSimpleIcon,
  CheckIcon,
  CaretDownIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import type { Structured } from "@/lib/domain/types";

/**
 * "Here's what we understood" — shown before any research findings.
 *
 * The founder wrote free text; an agent turned it into these three fields, and
 * every downstream step (community search, interview script, confirmation
 * rate, score) is computed from them. Showing the interpretation back — and
 * letting them correct it in place — is the cheapest possible moment to catch
 * a misread. Without this, a wrong ICP only surfaces after a validation round.
 */

type EditableField = "problem_statement" | "icp" | "value_prop";

const FIELDS: { key: EditableField; label: string; hint: string }[] = [
  {
    key: "problem_statement",
    label: "The problem",
    hint: "Stated as the person with it would describe it — not as your solution.",
  },
  {
    key: "icp",
    label: "Who has it",
    hint: "The narrower this is, the sharper everything downstream gets.",
  },
  {
    key: "value_prop",
    label: "What changes for them",
    hint: "The difference your product makes to that person.",
  },
];

export function UnderstandingCard({
  ideaId,
  structured,
  onUpdated,
}: {
  ideaId: string;
  structured: Structured;
  onUpdated: (next: Structured) => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<EditableField | null>(null);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  function startEdit(field: EditableField) {
    setDraft(structured[field]);
    setEditing(field);
  }

  async function save(field: EditableField) {
    const value = draft.trim();
    if (!value || value === structured[field]) {
      setEditing(null);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/structured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error();

      const body = await response.json();
      onUpdated(body.state.structured);
      setEditing(null);
      toast("Updated", "success");
    } catch {
      toast("We couldn't save that change.", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="understanding-heading"
      className="rounded-[8px] border border-line bg-raised"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-wash-hover"
      >
        <span className="min-w-0 flex-1">
          <span
            id="understanding-heading"
            className="type-body-m block font-medium text-primary"
          >
            We read this as: {structured.problem_statement || "—"}
          </span>
          <span className="type-body-m mt-0.5 block text-secondary">
            For {structured.icp || "—"}.{" "}
            <span className="text-brand">
              {open ? "Hide" : "Not right? Fix it"}
            </span>
          </span>
        </span>
        <CaretDownIcon
          size={18}
          aria-hidden="true"
          className={cn(
            "mt-0.5 shrink-0 text-tertiary transition-transform duration-[120ms]",
            open && "rotate-180",
          )}
        />
      </button>

      <dl
        className={cn(
          "divide-y divide-[var(--border-default)] border-t border-line",
          !open && "hidden",
        )}
      >
        {FIELDS.map((field) => {
          const isEditing = editing === field.key;
          const value = structured[field.key];

          return (
            <div key={field.key} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <dt className="type-caption pt-0.5 text-tertiary uppercase">
                  {field.label}
                </dt>
                {!isEditing ? (
                  <Button
                    size="compact"
                    variant="ghost"
                    onClick={() => startEdit(field.key)}
                    iconLeft={<PencilSimpleIcon size={14} aria-hidden="true" />}
                    className="-mt-1 -mr-2 shrink-0"
                  >
                    Edit
                  </Button>
                ) : null}
              </div>

              <dd className="mt-1.5">
                {isEditing ? (
                  <div>
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      aria-label={field.label}
                      autoFocus
                    />
                    <p className="type-body-m mt-2 text-tertiary">
                      {field.hint}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="compact"
                        variant="primary"
                        loading={saving}
                        onClick={() => void save(field.key)}
                        iconLeft={<CheckIcon size={14} aria-hidden="true" />}
                      >
                        Save
                      </Button>
                      <Button
                        size="compact"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className={cn(
                      "type-body-l",
                      value ? "text-primary" : "text-tertiary italic",
                    )}
                  >
                    {value || "Not captured yet."}
                  </p>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {open ? (
        <p className="type-body-m border-t border-line px-5 py-3 text-tertiary">
          Everything else on this page — and every step after it — is built on
          these three lines.
        </p>
      ) : null}
    </section>
  );
}
