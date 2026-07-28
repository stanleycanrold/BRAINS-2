"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useToast } from "@/components/ui/Toast";
import { STAGE_LABELS, type StageAtEntry } from "@/lib/domain/types";

/**
 * B2 — Entry Point (design system §4.2, PRD §4.1).
 *
 * The form is DYNAMIC by stage, not merely conditionally showing extra fields:
 * at "Idea only" the product-link field is absent from the layout entirely, so
 * there is nothing to skip past. At MVP/Live a single link field appears —
 * that is the only thing the founder types for that part; everything else is
 * fetched automatically rather than asked for.
 */

const MIN_DESCRIPTION = 40;

const STAGE_OPTIONS = (
  ["idea_only", "mvp_built", "live_with_users"] as const
).map((value) => ({ value, label: STAGE_LABELS[value] }));

export function EntryForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = React.useState("");
  const [stage, setStage] = React.useState<StageAtEntry>("idea_only");
  const [audience, setAudience] = React.useState("");
  const [productLink, setProductLink] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Errors appear on blur, never on every keystroke — don't punish someone
  // mid-typing (§1.7).
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const showsLinkField = stage !== "idea_only";

  const descriptionError =
    touched.description && description.trim().length < MIN_DESCRIPTION
      ? `Describe it in a bit more detail — at least ${MIN_DESCRIPTION} characters so we have something to research.`
      : null;

  const audienceError =
    touched.audience && audience.trim().length === 0
      ? "Tell us who this is for, even roughly."
      : null;

  const linkError =
    touched.productLink && showsLinkField && productLink.trim().length > 0
      ? isValidUrl(productLink)
        ? null
        : "Enter a valid URL (starting with https://)"
      : null;

  const canSubmit =
    description.trim().length >= MIN_DESCRIPTION &&
    audience.trim().length > 0 &&
    !linkError;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ description: true, audience: true, productLink: true });
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          target_audience: audience.trim(),
          stage_at_entry: stage,
          product_link: showsLinkField ? productLink.trim() || null : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "We couldn't save your idea.");
      }

      const { id } = await response.json();
      // The record is written before any agent runs, so the founder's input is
      // never lost even if research fails (PRD §4.1 acceptance criteria).
      router.push(`/ideas/${id}/research`);
    } catch (err) {
      setSubmitting(false);
      toast(
        err instanceof Error ? err.message : "We couldn't save your idea.",
        "danger",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <FormField
        label="What are you building?"
        htmlFor="description"
        error={descriptionError}
        hint="A paragraph beats a tagline. What's the situation, and what goes wrong today? This doesn't have to be a whole product — if only one feature is uncertain, describe just that."
      >
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, description: true }))}
          invalid={Boolean(descriptionError)}
          placeholder="We're building a tool that…"
          rows={6}
          showCount
          minChars={MIN_DESCRIPTION}
          autoFocus
        />
      </FormField>

      <div>
        <p className="type-caption mb-2 text-secondary uppercase">
          Where are you today?
        </p>
        <SegmentedControl
          name="stage"
          ariaLabel="Your current stage"
          options={STAGE_OPTIONS}
          value={stage}
          onChange={setStage}
        />
      </div>

      {/* Absent from the layout entirely at Idea-only — not hidden (§4.2) */}
      {showsLinkField ? (
        <FormField
          label="Link to your product"
          htmlFor="product-link"
          error={linkError}
          hint="Website or app store listing. We'll read it and pull in what we find — you won't need to type your metrics."
        >
          <Input
            id="product-link"
            type="url"
            inputMode="url"
            value={productLink}
            onChange={(e) => setProductLink(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, productLink: true }))}
            invalid={Boolean(linkError)}
            placeholder="https://"
            prefix={<LinkSimpleIcon size={16} aria-hidden="true" />}
          />
        </FormField>
      ) : null}

      <FormField
        label="Who is this for?"
        htmlFor="audience"
        error={audienceError}
        hint="The narrower the better. 'Freelance designers who invoice 5–20 clients a month' beats 'small businesses'."
      >
        <Input
          id="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, audience: true }))}
          invalid={Boolean(audienceError)}
          placeholder="Freelance graphic designers…"
        />
      </FormField>

      <div className="flex items-center gap-4 border-t border-line pt-6">
        {/* The one place a 48px CTA is used (§3.1) */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={submitting}
          disabled={!canSubmit}
        >
          {submitting ? "Saving your idea…" : "Continue"}
        </Button>
        <p className="type-body-m text-secondary">
          Takes about a minute to research.
        </p>
      </div>
    </form>
  );
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return Boolean(url.hostname) && url.hostname.includes(".");
  } catch {
    return false;
  }
}
