"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PaperclipIcon,
  XIcon,
  ArrowRightIcon,
  FileTextIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Textarea, Input } from "@/components/ui/Field";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { RadioCardGroup } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import type { StageAtEntry } from "@/lib/domain/types";

/**
 * B2 - Entry Point.
 *
 * One box and nothing else.
 *
 * This screen used to ask for stage, audience and a product link alongside
 * the idea, which meant meeting a form before saying the one thing the person
 * came to say. Everything we still need is asked afterwards, in a short
 * modal, once they have already committed something. Answering three quick
 * questions about an idea you have just written is a different experience
 * from filling in a form before you have written anything.
 *
 * Those questions are not optional extras. The research agent searches
 * globally and returns evidence from markets the founder does not sell into
 * unless it is told where to look, and interviewees cannot be sourced without
 * knowing where they should be.
 */

const MIN_DESCRIPTION = 40;

const STAGE_OPTIONS: {
  value: StageAtEntry;
  label: string;
  description: string;
}[] = [
  {
    value: "idea_only",
    label: "Just an idea",
    description: "Nothing built yet.",
  },
  {
    value: "mvp_built",
    label: "Something built, no users",
    description: "It exists but nobody is using it.",
  },
  {
    value: "live_with_users",
    label: "Live with real users",
    description: "People are using it today.",
  },
];

type Attachment = { name: string; excerpt: string };

export function EntryForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [reading, setReading] = React.useState(false);

  const [asking, setAsking] = React.useState(false);
  const [stage, setStage] = React.useState<StageAtEntry>("idea_only");
  const [audience, setAudience] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [productLink, setProductLink] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const fileInput = React.useRef<HTMLInputElement>(null);
  const ready = description.trim().length >= MIN_DESCRIPTION;

  // A link is only worth asking for when there is something to look at.
  const wantsLink = stage !== "idea_only";

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setReading(true);
    try {
      const form = new FormData();
      for (const file of Array.from(files).slice(0, 5)) {
        form.append("files", file);
      }
      const response = await fetch("/api/attachments", {
        method: "POST",
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "We couldn't read that.");

      setAttachments((a) => [...a, ...body.attachments].slice(0, 10));

      const unreadable = body.attachments.filter(
        (x: Attachment) => !x.excerpt,
      ).length;
      if (unreadable) {
        toast(
          `Attached, but we couldn't pull text out of ${unreadable} of them.`,
        );
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't read that.",
        "danger",
      );
    } finally {
      setReading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function create() {
    if (!audience.trim()) {
      toast("Tell us who this is for, even roughly.", "danger");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          target_audience: audience.trim(),
          stage_at_entry: stage,
          location_focus: location.trim(),
          product_link: wantsLink ? productLink.trim() || null : null,
          attachments,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "We couldn't save your idea.");
      }

      const { id } = await response.json();
      // Written before any agent runs, so the input survives a failed
      // research call (PRD §4.1).
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
    <>
      <div>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="We're building a tool that…"
          rows={9}
          aria-label="Describe your idea"
        />

        {attachments.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="type-body-m inline-flex items-center gap-2 rounded-full border border-line bg-raised py-1 pr-1 pl-3 text-secondary"
              >
                <FileTextIcon size={14} aria-hidden="true" />
                <span className="max-w-[220px] truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setAttachments((a) => a.filter((_, j) => j !== i))
                  }
                  className="rounded-full p-1 text-tertiary transition-colors hover:bg-wash-hover hover:text-primary"
                >
                  <XIcon size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.csv,.json"
              className="sr-only"
              onChange={(e) => void addFiles(e.target.files)}
            />
            <Button
              variant="ghost"
              size="compact"
              loading={reading}
              onClick={() => fileInput.current?.click()}
              iconLeft={<PaperclipIcon size={15} aria-hidden="true" />}
            >
              Attach documents
            </Button>
            <span className="type-caption text-tertiary">
              PDFs, decks, notes. Optional.
            </span>
          </div>

          <Button
            variant="primary"
            size="large"
            disabled={!ready}
            onClick={() => setAsking(true)}
            iconRight={<ArrowRightIcon size={17} aria-hidden="true" />}
          >
            Continue
          </Button>
        </div>

        {description.trim().length > 0 && !ready ? (
          <p className="type-caption mt-2 text-tertiary">
            A little more detail, so there is something to research.
          </p>
        ) : null}
      </div>

      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        title="Three quick things"
        description="These decide where we look for evidence, and who we would talk to."
        footer={
          <ModalActions
            onCancel={() => setAsking(false)}
            cancelLabel="Back"
          >
            <Button
              variant="primary"
              loading={submitting}
              onClick={() => void create()}
            >
              Start research
            </Button>
          </ModalActions>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="type-body-m block font-medium text-primary">
              Where is this today?
            </label>
            <div className="mt-2">
              <RadioCardGroup
                ariaLabel="Stage"
                options={STAGE_OPTIONS}
                value={stage}
                onChange={setStage}
              />
            </div>
          </div>

          {wantsLink ? (
            <div>
              <label
                htmlFor="product-link"
                className="type-body-m block font-medium text-primary"
              >
                Link to it{" "}
                <span className="text-tertiary">
                  Optional, but we will read it
                </span>
              </label>
              <Input
                id="product-link"
                className="mt-2"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="https://"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="audience"
              className="type-body-m block font-medium text-primary"
            >
              Who is it for?
            </label>
            <Input
              id="audience"
              className="mt-2"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Freelance designers, clinic receptionists, anyone who…"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="type-body-m block font-medium text-primary"
            >
              Anywhere in particular?{" "}
              <span className="text-tertiary">Optional</span>
            </label>
            <Input
              id="location"
              className="mt-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kenya, or the UK and Ireland"
            />
            <p className="type-caption mt-1.5 text-tertiary">
              Leave it blank for worldwide. This decides which markets we search
              and where we would find people to interview.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
