"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  XIcon,
  WarningIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea, Input } from "@/components/ui/Field";
import { RadioCardGroup } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { ResponseAnswerList } from "@/components/ResponseMatrix";
// Ops sees every state; the founder-facing screens never do. The rule lives
// in lib/domain/response-visibility.
import { cn } from "@/lib/cn";
import type { Confirmed } from "@/lib/domain/types";

/**
 * Logging interviews and deciding which ones count.
 *
 * Interviewees are hired manually, so an interview arrives as something a
 * person typed up rather than as a form submission. Each one is screened by
 * the response_quality agent on the way in, but the machine's verdict is a
 * recommendation: this is where a human agrees or overrules it, because an
 * automated reject that silently bins a real person's answer is worse than a
 * queue to work through.
 *
 * Nothing is ever deleted. A rejected response stays readable so the decision
 * can be revisited, and so we can see later what the screen was getting wrong.
 */

type Response = {
  id: string;
  notes: string;
  source: string;
  respondentName: string;
  respondentCareer: string;
  respondentLocation: string;
  respondentEmail: string;
  respondentPhone: string;
  confirmed: string;
  reviewStatus: string;
  qualityFlags: string[];
  qualityReasoning: string;
  qualityConfidence: number | null;
  createdAt: string;
};

const CONFIRM_OPTIONS: { value: Confirmed; label: string; description: string }[] =
  [
    {
      value: "yes",
      label: "Yes, real problem",
      description: "They have it and it costs them something.",
    },
    {
      value: "unsure",
      label: "Sort of, minor",
      description: "Noticed, but they work around it.",
    },
    {
      value: "no",
      label: "No",
      description: "Does not apply to them.",
    },
  ];

export function OrderWorkspace({
  orderId,
  versionId,
  nRequested,
  panelUrl,
  responses,
}: {
  orderId: string;
  versionId: string;
  nRequested: number;
  /** Where sourced respondents answer. Null until the round is paid. */
  panelUrl: string | null;
  responses: Response[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [notes, setNotes] = React.useState("");
  const [source, setSource] = React.useState("");
  const [confirmed, setConfirmed] = React.useState<Confirmed | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function copyPanelLink() {
    if (!panelUrl) return;
    try {
      await navigator.clipboard.writeText(panelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy failed. Select the link and copy it manually.", "danger");
    }
  }

  const approved = responses.filter((r) => r.reviewStatus === "approved");
  const pending = responses.filter((r) => r.reviewStatus === "pending");

  async function logInterview() {
    if (!confirmed || notes.trim().length < 20) {
      toast("Type up the interview and pick an outcome first.", "danger");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/ops/orders/${orderId}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, source, confirmed, versionId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "That did not save.");
      setNotes("");
      setSource("");
      setConfirmed(null);
      toast("Interview logged and sent for screening", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "That did not save.", "danger");
    } finally {
      setSaving(false);
    }
  }

  async function decide(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      const response = await fetch(`/api/ops/responses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_status: status, versionId }),
      });
      if (!response.ok) throw new Error("That did not save.");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "That did not save.", "danger");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {/* Two ways to get an answer in, and the team needs both. Typing up a
          call goes in below; sending the link lets a sourced respondent answer
          in their own time. Answers arriving on this link are attributed to
          the paid round rather than to the founder's own outreach, which is
          the whole reason it is a separate token. */}
      {panelUrl ? (
        <Card elevation="raised" className="mt-4 p-5">
          <h2 className="type-display-m text-primary">
            Link for sourced respondents
          </h2>
          <p className="type-body-m mt-1 max-w-prose text-secondary">
            Send this to anyone you have sourced for this order. Answers that
            arrive on it count as paid interviews, separately from the
            founder&rsquo;s own outreach.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="type-data-s min-w-0 flex-1 truncate rounded-[6px] border border-line bg-page px-3 py-2 text-secondary">
              {panelUrl}
            </code>
            <Button variant="secondary" onClick={() => void copyPanelLink()}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card elevation="raised" className="mt-4 p-5">
        <h2 className="type-display-m text-primary">Log an interview</h2>
        <p className="type-body-m mt-1 max-w-prose text-secondary">
          Type up what they actually said, in their words where you can. It gets
          screened for quality on the way in, and you decide below whether it
          counts.
        </p>

        <div className="mt-4">
          <label className="type-body-m block font-medium text-primary">
            Did they confirm the problem?
          </label>
          <div className="mt-2">
            <RadioCardGroup
              ariaLabel="Outcome"
              options={CONFIRM_OPTIONS}
              value={confirmed}
              onChange={setConfirmed}
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="interview-notes"
            className="type-body-m block font-medium text-primary"
          >
            What they said
          </label>
          <Textarea
            id="interview-notes"
            rows={6}
            className="mt-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Their own words wherever possible. Specifics matter more than tidy summaries."
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="interview-source"
            className="type-body-m block font-medium text-primary"
          >
            Who was it? <span className="text-tertiary">Optional</span>
          </label>
          <Input
            id="interview-source"
            className="mt-2"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="A role and rough location is enough"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Button
            variant="primary"
            loading={saving}
            onClick={() => void logInterview()}
            iconLeft={<PlusIcon size={15} aria-hidden="true" />}
          >
            Log response
          </Button>
          <span className="type-body-m text-tertiary">
            {approved.length} of {nRequested} approved
            {pending.length ? ` · ${pending.length} waiting on you` : ""}
          </span>
        </div>
      </Card>

      <Card elevation="raised" className="mt-4 p-5">
        <h2 className="type-display-m text-primary">
          Validation responses{" "}
          <span className="type-body-m text-tertiary">{responses.length}</span>
        </h2>

        {responses.length === 0 ? (
          <p className="type-body-m mt-3 text-tertiary">
            Nothing logged yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {responses.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "rounded-[8px] border p-4",
                  r.reviewStatus === "approved" && "border-line bg-page",
                  r.reviewStatus === "pending" && "border-caution/40 bg-page",
                  r.reviewStatus === "rejected" &&
                    "border-line bg-page opacity-60",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      r.reviewStatus === "approved"
                        ? "success"
                        : r.reviewStatus === "rejected"
                          ? "danger"
                          : "caution"
                    }
                    dot
                  >
                    {r.reviewStatus}
                  </Badge>
                  <Badge tone="neutral">{r.confirmed}</Badge>
                  {r.qualityFlags.map((f) => (
                    <span
                      key={f}
                      className="type-caption rounded-full bg-danger-subtle px-2 py-0.5 text-danger"
                    >
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                  {r.source ? (
                    <span className="type-body-m text-tertiary">{r.source}</span>
                  ) : null}
                </div>

                  {(r.respondentName || r.respondentCareer || r.respondentLocation) ? (
                    <div className="mt-3 grid gap-2 border-y border-line py-3 text-sm sm:grid-cols-3">
                      <span><strong className="font-medium text-primary">Name:</strong> {r.respondentName || "-"}</span>
                      <span><strong className="font-medium text-primary">Career:</strong> {r.respondentCareer || "-"}</span>
                      <span><strong className="font-medium text-primary">Location:</strong> {r.respondentLocation || "-"}</span>
                      <span><strong className="font-medium text-primary">Email:</strong> {r.respondentEmail || "-"}</span>
                      <span><strong className="font-medium text-primary">Phone:</strong> {r.respondentPhone || "-"}</span>
                    </div>
                  ) : null}

                {/* Split into its questions rather than printed raw. A
                    screener deciding whether an answer is real has to see
                    which question it was answering. */}
                <ResponseAnswerList notes={r.notes} className="mt-2.5" />

                {r.qualityReasoning ? (
                  <p className="type-body-m mt-2.5 flex items-start gap-2 border-t border-line pt-2.5 text-secondary">
                    <WarningIcon
                      size={15}
                      className="mt-0.5 shrink-0 text-tertiary"
                      aria-hidden="true"
                    />
                    <span>
                      {r.qualityReasoning}
                      {r.qualityConfidence != null
                        ? ` (${Math.round(r.qualityConfidence)}% confident)`
                        : ""}
                    </span>
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.reviewStatus !== "approved" ? (
                    <Button
                      variant="secondary"
                      size="compact"
                      loading={busyId === r.id}
                      onClick={() => void decide(r.id, "approved")}
                      iconLeft={<CheckIcon size={14} aria-hidden="true" />}
                    >
                      Approve
                    </Button>
                  ) : null}
                  {r.reviewStatus !== "rejected" ? (
                    <Button
                      variant="ghost"
                      size="compact"
                      loading={busyId === r.id}
                      onClick={() => void decide(r.id, "rejected")}
                      iconLeft={<XIcon size={14} aria-hidden="true" />}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
