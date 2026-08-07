"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowClockwiseIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { RadioCardGroup } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { describeIdeaProblem } from "@/lib/domain/limits";
import { STAGE_LABELS, type IdeaState, type StageAtEntry } from "@/lib/domain/types";

/**
 * Editing the idea after it was first written.
 *
 * The entry screen only ever existed at /ideas/new, so the first draft was
 * permanent: a typo, the wrong audience, or a location left blank stayed that
 * way for the life of the idea unless the founder abandoned it and started
 * again, losing the history with it.
 *
 * Saving patches the current round rather than forking one. Correcting how an
 * idea was written down is not the same claim as changing what the idea is,
 * and only the second deserves a new version in the history.
 *
 * What it does not do is quietly re-run anything. Research is downstream of
 * this text, so once it has run, editing here makes it stale - and the honest
 * response is to say so and offer the re-run as a button, rather than spend a
 * couple of minutes of agent time the founder did not ask for.
 */

const STAGE_OPTIONS: {
  value: StageAtEntry;
  label: string;
  description: string;
}[] = [
  {
    value: "idea_only",
    label: STAGE_LABELS.idea_only,
    description: "Nothing built yet. The idea is the thing being tested.",
  },
  {
    value: "mvp_built",
    label: STAGE_LABELS.mvp_built,
    description: "Something exists, but nobody is using it in anger yet.",
  },
  {
    value: "live_with_users",
    label: STAGE_LABELS.live_with_users,
    description: "Real people use it. We start from evidence you already own.",
  },
];

export function EditEntryForm({
  ideaId,
  initialState,
  hasResearch,
}: {
  ideaId: string;
  initialState: IdeaState;
  hasResearch: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const raw = initialState.raw_submission;
  const [description, setDescription] = React.useState(raw.description);
  const [audience, setAudience] = React.useState(raw.target_audience);
  const [location, setLocation] = React.useState(raw.location_focus);
  const [productLink, setProductLink] = React.useState(raw.product_link ?? "");
  const [stage, setStage] = React.useState<StageAtEntry>(
    initialState.stage_at_entry,
  );
  const [busy, setBusy] = React.useState<string | null>(null);

  const problem = describeIdeaProblem(description);
  const dirty =
    description !== raw.description ||
    audience !== raw.target_audience ||
    location !== raw.location_focus ||
    productLink !== (raw.product_link ?? "") ||
    stage !== initialState.stage_at_entry;

  async function save(thenResearch: boolean) {
    if (problem) {
      toast(problem, "danger");
      return;
    }
    setBusy(thenResearch ? "research" : "save");

    try {
      const response = await fetch(`/api/ideas/${ideaId}/entry`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          target_audience: audience,
          location_focus: location,
          product_link: productLink.trim() || null,
          stage_at_entry: stage,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "We couldn't save that.");
      }

      if (thenResearch) {
        const research = await fetch(`/api/ideas/${ideaId}/research`, {
          method: "POST",
        });
        if (!research.ok) {
          throw new Error("Saved, but the research run didn't start.");
        }
        router.push(`/ideas/${ideaId}/research`);
        router.refresh();
        return;
      }

      toast("Idea updated", "success");
      router.push(`/ideas/${ideaId}`);
      router.refresh();
    } catch (err) {
      setBusy(null);
      toast(
        err instanceof Error ? err.message : "We couldn't save that.",
        "danger",
      );
    }
  }

  return (
    <div className="space-y-6">
      {hasResearch ? (
        <Card className="flex items-start gap-3 border-caution/40 bg-caution-subtle p-4">
          <WarningIcon
            size={18}
            className="mt-0.5 shrink-0 text-caution"
            aria-hidden="true"
          />
          <p className="type-body-m text-primary">
            The research on this round was run against the current wording.
            Changing it here does not update the research or the questions
            written from it. When you are happy with the text, re-run the
            research so the two agree.
          </p>
        </Card>
      ) : null}

      <Card className="p-5 sm:p-6">
        <FormField
          label="What are you building?"
          htmlFor="description"
          hint="The situation, and what goes wrong today. A paragraph is plenty."
        >
          <Textarea
            id="description"
            rows={7}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="We're building a tool for…"
          />
        </FormField>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <FormField
            label="Who is it for?"
            htmlFor="audience"
            hint="The narrower the better. This decides who gets interviewed."
          >
            <Input
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Solo dog groomers"
            />
          </FormField>

          <FormField
            label="Where are they?"
            htmlFor="location"
            hint="A country, a region, or blank for anywhere."
          >
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="United Kingdom"
            />
          </FormField>
        </div>

        <FormField
          className="mt-5"
          label="Product link"
          htmlFor="product-link"
          hint="Optional. If it is already live we read your ratings and reviews first."
        >
          <Input
            id="product-link"
            value={productLink}
            onChange={(e) => setProductLink(e.target.value)}
            placeholder="https://"
          />
        </FormField>
      </Card>

      <Card className="p-5 sm:p-6">
        <p className="type-body-m mb-3 font-medium text-primary">
          Where is this today?
        </p>
        <RadioCardGroup
          options={STAGE_OPTIONS}
          value={stage}
          onChange={setStage}
          ariaLabel="Stage at entry"
        />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          loading={busy === "save"}
          disabled={!dirty || Boolean(busy)}
          onClick={() => void save(false)}
        >
          Save changes
        </Button>

        {hasResearch ? (
          <Button
            variant="secondary"
            loading={busy === "research"}
            disabled={Boolean(busy)}
            onClick={() => void save(true)}
            iconLeft={<ArrowClockwiseIcon size={18} aria-hidden="true" />}
          >
            Save and re-run research
          </Button>
        ) : null}

        {!dirty && !busy ? (
          <span className="type-caption text-tertiary">
            Nothing changed yet.
          </span>
        ) : null}
      </div>
    </div>
  );
}
