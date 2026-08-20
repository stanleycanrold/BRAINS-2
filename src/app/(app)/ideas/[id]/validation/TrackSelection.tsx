"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { TopBar } from "@/components/shell/AppShell";
import { PipelineStepper } from "@/components/shell/PipelineStepper";
import type { IdeaState } from "@/lib/domain/types";
import { ValidationInProgress } from "@/components/ValidationInProgress";
import { FastTrackButton } from "../FastTrackButton";

/**
 * B4 - Validation Track Selection (design system §4.4).
 *
 * Two tracks, presented side by side, both converging on the same
 * `validation_report` shape. The tracks differ in who does the legwork and how
 * fast - not in which capabilities are available: questionnaire generation and
 * social engagement assistance are shared by both (PRD §4.3 note).
 */

export function TrackSelection({
  ideaId,
  initialState,
  floorPerInterview,
  paymentsEnabled,
}: {
  ideaId: string;
  initialState: IdeaState;
  /** Formatted floor across tiers, e.g. "$40". What marketing quotes. */
  floorPerInterview: string;
  paymentsEnabled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [starting, setStarting] = React.useState(false);


  async function startNormal() {
    setStarting(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: "normal" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "We couldn't start that track.");
      }
      router.push(`/ideas/${ideaId}/validation/normal`);
    } catch (err) {
      setStarting(false);
      toast(
        err instanceof Error ? err.message : "We couldn't start that track.",
        "danger",
      );
    }
  }


  return (
    <>
      <TopBar>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="type-body-m hidden min-w-0 truncate font-medium text-primary sm:block">
            {initialState.title || "Your idea"}
          </span>
          <PipelineStepper
            ideaId={ideaId}
            status={initialState.status}
            currentStage="validate"
          />
          <div className="ml-auto shrink-0">
            <FastTrackButton ideaId={ideaId} state={initialState} />
          </div>
        </div>
      </TopBar>

      <header>
        <h1 className="type-display-l text-primary">
          How do you want to talk to people?
        </h1>
        <p className="type-body-l mt-1 max-w-prose text-secondary">
          Research says the problem probably exists. Only people can tell you it
          matters. Pick either - you get the same analysed report at the end.
        </p>
      </header>

      {/* An abandoned checkout is otherwise invisible here: the order exists
          but the track never moved, so without this the founder has no way
          back to a payment they started. */}
      <ValidationInProgress
        ideaId={ideaId}
        state={initialState}
        paymentsEnabled={paymentsEnabled}
        className="mt-6"
      />

      {/**
        * Two options, equal weight, decided at a glance.
        *
        * This screen previously asked for an interview count and showed an
        * itemised price table before the founder had chosen anything - a
        * spreadsheet in the middle of a yes/no decision. Quantity and
        * itemisation belong at checkout, where they already exist and where
        * someone has decided to buy. Here the only job is: which of these two.
        */}
      <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
        {/* ── Do it yourself ───────────────────────────────────────────── */}
        <Card elevation="raised" className="flex h-full flex-col p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="type-display-m text-primary">Do it yourself</h2>
            <Badge tone="success">Free</Badge>
          </div>
          <p className="type-body-l mt-2 text-secondary">
            We find where your people talk and write your questions. You go and
            have the conversations.
          </p>

          <ul className="mt-5 flex-1 space-y-2.5">
            <Feature>Named communities, with real threads to start from</Feature>
            <Feature>Questions written not to lead the witness</Feature>
            <Feature>Same AI analysis and scored report at the end</Feature>
          </ul>

          <div className="mt-6">
            <Button
              variant="secondary"
              size="large"
              fullWidth
              loading={starting}
              onClick={() => void startNormal()}
              iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
            >
              I&rsquo;ll validate with real people
            </Button>
            <p className="type-caption mt-2.5 text-center text-tertiary">
              Takes a minute to find your communities
            </p>
          </div>
        </Card>

        {/* ── Done for you ─────────────────────────────────────────────── */}
        <Card
          elevation="raised"
          className="flex h-full flex-col border-brand/35 p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="type-display-m text-primary">We do it for you</h2>
            <Badge tone="brand">
              From {floorPerInterview} per person
            </Badge>
          </div>
          <p className="type-body-l mt-2 text-secondary">
            Validation runs against your questions. Our AI reads every
            response, finds what people have in common, and scores it.
          </p>

          <ul className="mt-5 flex-1 space-y-2.5">
            <Feature>You choose how many people - more responses, firmer signal</Feature>
            <Feature>Nothing for you to chase or schedule</Feature>
            <Feature>Finished report on your dashboard in 1&ndash;2 weeks</Feature>
          </ul>

          <div className="mt-6">
            {paymentsEnabled ? (
              <>
                <Button
                  variant="primary"
                  size="large"
                  fullWidth
                  onClick={() =>
                    router.push(
                      `/ideas/${ideaId}/validation/fast-track/checkout`,
                    )
                  }
                  iconRight={<ArrowRightIcon size={18} aria-hidden="true" />}
                >
                  Contact us to arrange payment
                </Button>
                <p className="type-caption mt-2.5 text-center text-tertiary">
                  Pick your number next. We&rsquo;ll reply with your personal Wise link.
                </p>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled
                >
                  Payment contact not configured
                </Button>
                <p className="type-caption mt-2.5 text-center text-tertiary">
                  Add your payment contact email in the production environment.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>

      <p className="type-body-m mt-6 text-tertiary">
        You can switch later. Responses from either route land in the same pool,
        so nothing you gather is wasted.
      </p>
    </>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="type-body-m flex items-start gap-2.5 text-primary">
      <CheckIcon
        size={16}
        weight="bold"
        className="mt-1 shrink-0 text-success"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

