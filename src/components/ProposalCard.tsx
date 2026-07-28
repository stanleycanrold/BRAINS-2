"use client";

import * as React from "react";
import {
  CheckIcon,
  XIcon,
  PencilSimpleIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import type { Proposal } from "@/lib/domain/types";

/**
 * The accept/reject/edit proposal card.
 *
 * Deliberately ONE component used in two places (design system §4.3 and §4.9):
 * the Research step's proposed changes and the Decision Gate's improvement
 * proposals are the same interaction, so they are the same component. Accepting
 * one patches the idea's structured fields directly for the next loop.
 *
 * The founder's accept/reject/edit decisions are stored — they're a strong
 * signal for later SLM training on "what changes founders actually take"
 * (PRD §4.2 acceptance criteria).
 */
export function ProposalCard({
  proposal,
  index,
  onDecide,
  disabled,
}: {
  proposal: Proposal;
  index: number;
  onDecide: (
    id: string,
    status: "accepted" | "rejected" | "edited",
    editedText?: string,
  ) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(
    proposal.edited_text ?? proposal.text,
  );
  const [busy, setBusy] = React.useState(false);

  const decided = proposal.status !== "pending";

  async function decide(
    status: "accepted" | "rejected" | "edited",
    text?: string,
  ) {
    setBusy(true);
    try {
      await onDecide(proposal.id, status, text);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  const fieldLabel: Record<Proposal["patches"], string> = {
    problem_statement: "Problem statement",
    icp: "Target user",
    value_prop: "Value prop",
    none: "",
  };

  return (
    <li
      className={cn(
        "rounded-[8px] border p-5 transition-colors duration-[120ms]",
        proposal.status === "rejected"
          ? "border-line bg-page opacity-60"
          : proposal.status === "accepted" || proposal.status === "edited"
            ? "border-success/40 bg-success-subtle"
            : "border-line bg-raised",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="type-data-s mt-0.5 shrink-0 text-tertiary">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              aria-label="Edit this suggestion"
              autoFocus
            />
          ) : (
            <p className="type-body-l text-primary">
              {proposal.edited_text ?? proposal.text}
            </p>
          )}

          <p className="type-body-m mt-2 text-secondary">
            {proposal.reasoning}
          </p>

          {proposal.patches !== "none" && proposal.patch_value ? (
            <div className="mt-3 rounded-[6px] border border-line bg-page p-3">
              <p className="type-caption text-tertiary uppercase">
                Accepting rewrites your {fieldLabel[proposal.patches]}
              </p>
              <p className="type-body-m mt-1 text-primary">
                {proposal.patch_value}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {decided ? (
              <>
                <Badge
                  tone={proposal.status === "rejected" ? "neutral" : "success"}
                  dot
                >
                  {proposal.status === "rejected"
                    ? "Rejected"
                    : proposal.status === "edited"
                      ? "Accepted with edits"
                      : "Accepted"}
                </Badge>
                <Button
                  size="compact"
                  variant="ghost"
                  loading={busy}
                  disabled={disabled}
                  onClick={() => decide("rejected")}
                  iconLeft={
                    <ArrowCounterClockwiseIcon size={14} aria-hidden="true" />
                  }
                >
                  Undo
                </Button>
              </>
            ) : editing ? (
              <>
                <Button
                  size="compact"
                  variant="primary"
                  loading={busy}
                  onClick={() => decide("edited", draft)}
                >
                  Save &amp; accept
                </Button>
                <Button
                  size="compact"
                  variant="ghost"
                  onClick={() => {
                    setDraft(proposal.text);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="compact"
                  variant="secondary"
                  loading={busy}
                  disabled={disabled}
                  onClick={() => decide("accepted")}
                  iconLeft={<CheckIcon size={14} aria-hidden="true" />}
                >
                  Accept
                </Button>
                <Button
                  size="compact"
                  variant="ghost"
                  disabled={disabled || busy}
                  onClick={() => setEditing(true)}
                  iconLeft={<PencilSimpleIcon size={14} aria-hidden="true" />}
                >
                  Edit
                </Button>
                <Button
                  size="compact"
                  variant="ghost"
                  disabled={disabled || busy}
                  onClick={() => decide("rejected")}
                  iconLeft={<XIcon size={14} aria-hidden="true" />}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
