"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  WarningIcon,
  InfoIcon,
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
  ProhibitIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ResponseMatrix, toMatrixRows } from "@/components/ResponseMatrix";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Field";
import { ProposalCard } from "@/components/ProposalCard";
import { useToast } from "@/components/ui/Toast";
import { TopBar } from "@/components/shell/AppShell";
import { PipelineStepper } from "@/components/shell/PipelineStepper";
import { cn } from "@/lib/cn";
import {
  CHANNEL_LABELS,
  type Channel,
  type IdeaState,
  type RiskFactor,
} from "@/lib/domain/types";

/**
 * B9 - Validation Report / Decision Gate (design system §4.9).
 *
 * The single most important screen in the product. Two rules shape it:
 *
 *  · A bare number is never acceptable output. The score is always
 *    accompanied by the reasoning, the risk factors, and - below threshold -
 *    a diagnostic saying WHY, so the founder can interrogate it.
 *
 *  · The raw responses are always reachable. The synthesis summarises; it
 *    never replaces access to what people actually said.
 */

const SEVERITY: Record<RiskFactor["severity"], { tone: BadgeTone; label: string }> = {
  high: { tone: "danger", label: "High" },
  caution: { tone: "caution", label: "Worth noting" },
  info: { tone: "neutral", label: "Context" },
};

const DIAGNOSTIC_LABEL: Record<string, string> = {
  wrong_problem_statement: "The problem is real, but not as you've framed it",
  wrong_audience: "The problem is real - for someone other than this audience",
  genuinely_weak_problem: "People cope with this fine today",
  not_applicable: "",
};

export function ReportView({
  ideaId,
  initialState,
}: {
  ideaId: string;
  initialState: IdeaState;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [state, setState] = React.useState(initialState);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [killOpen, setKillOpen] = React.useState(false);
  const [killReason, setKillReason] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState<Channel | "all">("all");

  const gate = state.decision_gate;
  const summary = state.validation.synthesis_summary;
  const responses = state.validation.responses;

  const isRethink = gate?.signal === "rethink";
  const decided = Boolean(gate?.user_decision);

  const visibleResponses =
    channelFilter === "all"
      ? responses
      : responses.filter((r) => r.channel === channelFilter);

  async function decide(
    decision: "proceed" | "rework" | "kill",
    resumeAt: "research" | "validation" = "validation",
  ) {
    setBusy(decision);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          resume_at: resumeAt,
          kill_reason: decision === "kill" ? killReason : undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "We couldn't record that.");
      }
      const body = await response.json();
      setKillOpen(false);
      router.push(body.next);
      router.refresh();
    } catch (err) {
      setBusy(null);
      toast(
        err instanceof Error ? err.message : "We couldn't record that.",
        "danger",
      );
    }
  }

  /**
   * Start another round on an already-decided version.
   *
   * Deliberately not `decide("rework")`. That records the founder's answer to
   * the gate, and this version's gate has already been answered - reusing it
   * would log a second decision against it and skew the agreement-rate metric.
   * `/rounds` forks without touching the gate.
   */
  async function startNewRound() {
    setBusy("new-round");
    try {
      const response = await fetch(`/api/ideas/${ideaId}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_at: "research" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "We couldn't start a new round.");
      }
      const body = await response.json();
      router.push(body.next);
      router.refresh();
    } catch (err) {
      setBusy(null);
      toast(
        err instanceof Error ? err.message : "We couldn't start a new round.",
        "danger",
      );
    }
  }

  async function decideProposal(
    id: string,
    status: "accepted" | "rejected" | "edited",
    editedText?: string,
  ) {
    const response = await fetch(`/api/ideas/${ideaId}/report/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal_id: id, status, edited_text: editedText }),
    });
    if (!response.ok) {
      toast("We couldn't save that decision.", "danger");
      return;
    }
    const body = await response.json();
    setState(body.state);
    toast(
      status === "rejected" ? "Suggestion dismissed" : "Suggestion applied",
      "success",
    );
  }

  if (!gate?.signal) {
    return (
      <>
        <ReportTopBar ideaId={ideaId} state={state} />
        <Card elevation="raised" className="p-6">
          <h1 className="type-display-m text-primary">No report yet</h1>
          <p className="type-body-l mt-2 text-secondary">
            Gather some responses first, then run the analysis.
          </p>
          <Button
            variant="primary"
            className="mt-5"
            onClick={() => router.push(`/ideas/${ideaId}/validation`)}
          >
            Back to validation
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <ReportTopBar ideaId={ideaId} state={state} />

      {/* ── Verdict ──────────────────────────────────────────────────── */}
      <Card elevation="raised" className="p-6 sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreGauge score={gate.score} size="lg" animate label="out of 100" />

          <div className="min-w-0 flex-1">
            <Badge tone={isRethink ? "caution" : "success"} dot>
              {isRethink ? "Rethink" : "Go ahead"}
            </Badge>

            <h1 className="type-display-l mt-3 text-primary">
              {isRethink
                ? "Not yet - this needs another pass"
                : "The signal is there. Go build it."}
            </h1>

            <p className="type-body-l mt-2 text-secondary">
              <span className="type-data-m text-primary">
                {Math.round(state.validation.confirmation_rate * 100)}%
              </span>{" "}
              of {responses.length}{" "}
              {responses.length === 1 ? "person" : "people"} confirmed they have
              this problem.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <h2 className="type-caption text-tertiary uppercase">
            How we got to that number
          </h2>
          <p className="type-body-l mt-2 text-secondary">{gate.reasoning}</p>
        </div>
      </Card>

      {/* ── Diagnostic (below threshold only) ────────────────────────── */}
      {isRethink && gate.diagnostic.verdict !== "not_applicable" ? (
        <section className="mt-10" aria-labelledby="diagnostic-heading">
          <h2 id="diagnostic-heading" className="type-display-m text-primary">
            What&rsquo;s actually going wrong
          </h2>
          <Card className="mt-4 border-caution/40 bg-caution-subtle p-5">
            <p className="type-body-l font-medium text-primary">
              {DIAGNOSTIC_LABEL[gate.diagnostic.verdict]}
            </p>
            <p className="type-body-l mt-2 text-secondary">
              {gate.diagnostic.explanation}
            </p>
          </Card>
        </section>
      ) : null}

      {/* ── What people told us ──────────────────────────────────────── */}
      <section className="mt-10" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="type-display-m text-primary">
          What people told us
        </h2>

        {summary.narrative ? (
          <p className="type-body-l mt-3 text-secondary">{summary.narrative}</p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ListCard title="Patterns that came up repeatedly" items={summary.themes} />
          <ListCard
            title="Push-back we heard"
            items={summary.objections}
            emptyNote="Nobody pushed back - which, with a small sample, can also mean nobody was being candid."
          />
        </div>

        {summary.notable_points.length > 0 ? (
          <div className="mt-4">
            <ListCard
              title="Worth your attention"
              items={summary.notable_points}
            />
          </div>
        ) : null}
      </section>

      {/* ── Risk factors ─────────────────────────────────────────────── */}
      {gate.risk_factors.length > 0 ? (
        <section className="mt-10" aria-labelledby="risks-heading">
          <h2 id="risks-heading" className="type-display-m text-primary">
            Reasons to hold this loosely
          </h2>
          <ul className="mt-4 space-y-3">
            {gate.risk_factors.map((risk, i) => {
              const meta = SEVERITY[risk.severity] ?? SEVERITY.info;
              return (
                <li
                  key={`${risk.label}-${i}`}
                  className={cn(
                    "flex items-start gap-3 rounded-[8px] border p-4",
                    risk.severity === "high"
                      ? "border-danger-border bg-danger-subtle"
                      : "border-line bg-raised",
                  )}
                >
                  {risk.severity === "high" ? (
                    <WarningIcon
                      size={20}
                      className="mt-0.5 shrink-0 text-danger"
                      aria-hidden="true"
                    />
                  ) : (
                    <InfoIcon
                      size={20}
                      className="mt-0.5 shrink-0 text-secondary"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="type-body-l font-medium text-primary">
                        {risk.label}
                      </p>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <p className="type-body-m mt-1 text-secondary">
                      {risk.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* ── Raw responses - never hidden behind the summary ──────────── */}
      <section className="mt-10" aria-labelledby="raw-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="raw-heading" className="type-display-m text-primary">
            Every response, unedited
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "interview", "survey", "social"] as const).map((c) => {
              const count =
                c === "all"
                  ? responses.length
                  : responses.filter((r) => r.channel === c).length;
              if (c !== "all" && count === 0) return null;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannelFilter(c)}
                  aria-pressed={channelFilter === c}
                  className={cn(
                    "type-caption rounded-full border px-2.5 py-1 transition-colors duration-[120ms]",
                    channelFilter === c
                      ? "border-brand bg-brand-subtle text-brand"
                      : "border-line text-secondary hover:text-primary",
                  )}
                >
                  {c === "all" ? "All" : CHANNEL_LABELS[c]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* The same grid the shared link shows, so the two cannot drift.
            Questions across the top rather than repeated inside every
            response: seven questions and eleven respondents printed the same
            seven sentences seventy-seven times, and comparing what everyone
            said about one of them meant reading all of it. */}
        <ResponseMatrix
          className="mt-4"
          responses={toMatrixRows(visibleResponses, { showSource: true })}
        />
      </section>

      {/* ── Improvement proposals ────────────────────────────────────── */}
      {gate.improvement_proposal.length > 0 ? (
        <section className="mt-10" aria-labelledby="improve-heading">
          <h2 id="improve-heading" className="type-display-m text-primary">
            {isRethink ? "What to change before trying again" : "Worth sharpening anyway"}
          </h2>
          <p className="type-body-m mt-1 text-secondary">
            Anything you accept gets applied to the next version automatically.
          </p>
          <ul className="mt-4 space-y-3">
            {gate.improvement_proposal.map((proposal, i) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                index={i}
                onDecide={decideProposal}
                disabled={decided}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── The decision ─────────────────────────────────────────────── */}
      <section className="mt-12" aria-labelledby="decide-heading">
        <h2 id="decide-heading" className="type-display-m text-primary">
          Your call
        </h2>
        <p className="type-body-m mt-1 max-w-prose text-secondary">
          The score is our read, not your decision. Reworking isn&rsquo;t a
          setback - it&rsquo;s the loop working. There&rsquo;s no limit on
          rounds, every past version stays readable, and you can narrow the next
          round to a single feature instead of the whole product.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {/* Rework is emphasised only on a rethink; otherwise equal weight */}
          <Button
            variant={isRethink ? "secondary" : "primary"}
            size="large"
            loading={busy === "proceed"}
            disabled={decided || Boolean(busy)}
            onClick={() => void decide("proceed")}
            iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
          >
            Proceed to build
          </Button>

          <Button
            variant={isRethink ? "primary" : "secondary"}
            size="large"
            loading={busy === "rework"}
            disabled={decided || Boolean(busy)}
            onClick={() => void decide("rework")}
            iconLeft={<ArrowCounterClockwiseIcon size={18} aria-hidden="true" />}
          >
            Rework and try again
          </Button>

          <Button
            variant="destructive"
            size="large"
            disabled={decided || Boolean(busy)}
            onClick={() => setKillOpen(true)}
            iconLeft={<ProhibitIcon size={18} aria-hidden="true" />}
          >
            Kill this idea
          </Button>
        </div>

        {/* A decided version used to end here, with all three buttons
            disabled and a line telling the founder to go and find the latest
            version themselves. That closed a loop the product promises is
            never closed: rework is meant to be unbounded whatever the score,
            including after a proceed. This is the way back in. */}
        {decided ? (
          <div className="mt-6 border-t border-line pt-6">
            <p className="type-body-m text-secondary">
              You already decided on this round, and this report stays readable
              for good. Sharpening the idea and going again is the loop
              working, not a step backwards.
            </p>
            <Button
              variant="secondary"
              size="large"
              className="mt-4"
              loading={busy === "new-round"}
              disabled={Boolean(busy)}
              onClick={() => void startNewRound()}
              iconLeft={
                <ArrowCounterClockwiseIcon size={18} aria-hidden="true" />
              }
            >
              Start another round
            </Button>
          </div>
        ) : null}
      </section>

      {/* Irreversible action - the one place a modal is warranted (§3.7) */}
      <Modal
        open={killOpen}
        onClose={() => setKillOpen(false)}
        danger
        title="Kill this idea?"
        description="It gets archived, not deleted - the full report stays readable forever, and you can always look back at what you learned."
        footer={
          <ModalActions onCancel={() => setKillOpen(false)}>
            <Button
              variant="destructive"
              loading={busy === "kill"}
              onClick={() => void decide("kill")}
            >
              Yes, kill it
            </Button>
          </ModalActions>
        }
      >
        <label
          htmlFor="kill-reason"
          className="type-caption mb-2 block text-secondary uppercase"
        >
          Why? (optional)
        </label>
        <Textarea
          id="kill-reason"
          value={killReason}
          onChange={(e) => setKillReason(e.target.value)}
          rows={3}
          placeholder="Nobody I spoke to actually cared…"
        />
        <p className="type-body-m mt-2 text-tertiary">
          Worth a line - patterns in why ideas die are useful later.
        </p>
      </Modal>
    </>
  );
}

function ReportTopBar({
  ideaId,
  state,
}: {
  ideaId: string;
  state: IdeaState;
}) {
  return (
    <TopBar>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="type-body-m hidden min-w-0 truncate font-medium text-primary sm:block">
          {state.title || "Your idea"}
        </span>
        <PipelineStepper
          ideaId={ideaId}
          status={state.status}
          currentStage="decide"
        />
      </div>
    </TopBar>
  );
}

function ListCard({
  title,
  items,
  emptyNote,
}: {
  title: string;
  items: string[];
  emptyNote?: string;
}) {
  return (
    <Card className="p-5">
      <h3 className="type-caption text-tertiary uppercase">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="type-body-m flex items-start gap-2.5 text-primary"
            >
              <span
                aria-hidden="true"
                className="mt-2 size-1 shrink-0 rounded-full bg-line-strong"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body-m mt-3 text-tertiary">
          {emptyNote ?? "Nothing stood out here."}
        </p>
      )}
    </Card>
  );
}
