"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  UsersThreeIcon,
  GaugeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { RadioCardGroup } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/brand/Logo";
import { IdeaComposer, type Attachment } from "@/components/IdeaComposer";
import { describeIdeaProblem } from "@/lib/domain/limits";
import type { StageAtEntry } from "@/lib/domain/types";

/**
 * B2 - Entry Point.
 *
 * One composer, centred, and nothing else above the fold.
 *
 * The screen used to ask for stage, audience and a product link alongside the
 * idea, which meant meeting a form before saying the one thing the person came
 * to say. Everything we still need is asked afterwards, in a short modal, once
 * they have already committed something. Answering three questions about an
 * idea you have just written is a different experience from filling in a form
 * before you have written anything.
 *
 * Those questions are not optional extras. The research agent searches
 * globally and returns evidence from markets the founder does not sell into
 * unless it is told where to look, and interviewees cannot be sourced without
 * knowing where they should be.
 */

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

/**
 * Starters, not categories.
 *
 * Each one seeds the shape of a usable answer rather than a label, because
 * the thing that makes research good is naming who has the problem and what
 * they do about it today. A blank box gets "an app for fitness"; this gets
 * something the agent can actually search for.
 */
const STARTERS = [
  {
    label: "A tool for a job people already do",
    seed: "We're building a tool for [who]. Today they [how they handle it now], which means [what goes wrong]. ",
  },
  {
    label: "A marketplace",
    seed: "We're building a marketplace connecting [one side] with [other side]. Right now they find each other by [current method], and the problem with that is ",
  },
  {
    label: "Replacing a spreadsheet",
    seed: "We're replacing the spreadsheet that [who] uses to [task]. It breaks down when ",
  },
  {
    label: "One feature I'm unsure about",
    seed: "Our product already does [what]. The part I'm unsure about is [feature], which is meant to solve ",
  },
];

export function EntryForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [reading, setReading] = React.useState(false);

  const [asking, setAsking] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [stage, setStage] = React.useState<StageAtEntry>("idea_only");
  const [audience, setAudience] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [productLink, setProductLink] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

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
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't read that.",
        "danger",
      );
    } finally {
      setReading(false);
    }
  }

  function begin() {
    if (describeIdeaProblem(description)) return;
    setStepIndex(0);
    setAsking(true);
  }

  function close() {
    setAsking(false);
  }

  /** Back steps within the flow before it closes the dialog. */
  function back() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
    else close();
  }


  /**
   * One question per screen.
   *
   * Four fields at once reads as a form to be got through; asked one at a
   * time they read as a short conversation, and each one gets an answer
   * worth having rather than whatever clears the field fastest. The link
   * step only exists when there is something to link to, so nobody is shown
   * a question that does not apply to them.
   */
  const steps = [
    {
      title: "Where is this today?",
      description: "It changes what we go looking for.",
      canAdvance: true,
      body: (
        <RadioCardGroup
          ariaLabel="Stage"
          options={STAGE_OPTIONS}
          value={stage}
          onChange={setStage}
        />
      ),
    },
    ...(wantsLink
      ? [
          {
            title: "Link to it",
            description:
              "We will read the page and pull in what we find, so you do not have to type it.",
            canAdvance: true,
            body: (
              <div>
                <Input
                  id="product-link"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="https://"
                  aria-label="Link to your product"
                />
                <p className="type-caption mt-2 text-tertiary">
                  Optional. Skip it if you would rather not share the link.
                </p>
              </div>
            ),
          },
        ]
      : []),
    {
      title: "Who is it for?",
      description: "Roughly is fine. It decides who we go and ask.",
      canAdvance: audience.trim().length > 0,
      body: (
        <div>
          <Input
            id="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Freelance designers, clinic receptionists, anyone who…"
            aria-label="Who it is for"
          />
          <p className="type-caption mt-2 text-tertiary">
            The one thing we cannot work out on our own.
          </p>
        </div>
      ),
    },
    {
      title: "Anywhere in particular?",
      description:
        "Leave it blank for worldwide. This decides which markets we search, and where we would find people to interview.",
      canAdvance: true,
      body: (
        <div>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Kenya, or the UK and Ireland"
            aria-label="Location focus"
          />
          <p className="type-caption mt-2 text-tertiary">
            Optional.
          </p>
        </div>
      ),
    },
  ];

  const stepIndexSafe = Math.min(stepIndex, steps.length - 1);
  const step = steps[stepIndexSafe];
  const isLastStep = stepIndexSafe === steps.length - 1;

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
      <IdeaComposer
        value={description}
        onChange={setDescription}
        onSubmit={begin}
        attachments={attachments}
        onAttach={(files) => void addFiles(files)}
        onRemoveAttachment={(i) =>
          setAttachments((a) => a.filter((_, j) => j !== i))
        }
        reading={reading}
        submitting={submitting}
        autoFocus={!compact}
      />

      {/* Starters disappear the moment there is anything to say - they exist
          to get someone unstuck, not to sit under a paragraph they have
          already written. */}
      {description.length === 0 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {STARTERS.map((starter) => (
            <button
              key={starter.label}
              type="button"
              onClick={() => setDescription(starter.seed)}
              className="type-body-m rounded-full border border-line bg-raised px-3 py-1.5 text-secondary transition-colors duration-[120ms] hover:border-line-strong hover:text-primary"
            >
              {starter.label}
            </button>
          ))}
        </div>
      ) : null}

      <Modal
        open={asking}
        onClose={close}
        title={step.title}
        description={step.description}
        footer={
          <ModalActions
            onCancel={back}
            cancelLabel={stepIndexSafe === 0 ? "Back to your idea" : "Back"}
          >
            <Button
              variant="primary"
              loading={submitting}
              disabled={!step.canAdvance}
              onClick={() => (isLastStep ? void create() : setStepIndex((i) => i + 1))}
            >
              {isLastStep ? "Start research" : "Next"}
            </Button>
          </ModalActions>
        }
      >
        {/* Position, not a progress bar: three dots is enough to say how much
            is left without dressing four questions up as a process. */}
        <div className="mb-5 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-[150ms]",
                i <= stepIndexSafe ? "bg-brand" : "bg-line",
              )}
            />
          ))}
        </div>

        {step.body}
      </Modal>
    </>
  );
}

/**
 * The full entry screen: mark, one line, the composer, then what happens next.
 *
 * The greeting is deliberately fixed rather than time-aware. Reading the clock
 * during render is what produces hydration mismatches, and the novelty wears
 * off long before the thousandth visit anyway.
 */
export function EntryScreen({ heading }: { heading: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col justify-center px-1 pt-[6vh] pb-16 sm:pt-[10vh]">
      {/* The mark is sized in CSS rather than by its width attribute so it
          tracks the heading, which now scales with the viewport. At 26px it
          sat noticeably below the cap height of 40px text and read as an
          afterthought next to it. */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-3">
        <LogoMark
          size={64}
          priority
          className="size-[clamp(26px,6.4vw,37px)]"
        />
        <h1 className="type-display-xl text-center text-primary">{heading}</h1>
      </div>

      <p className="type-body-l mx-auto mt-3 max-w-[46ch] text-center text-secondary">
        Describe it in a paragraph. Attach anything you have. We will find out
        whether the problem is real before you build for it.
      </p>

      <div className="mt-8">
        <EntryForm />
      </div>

      <Highlights />
    </div>
  );
}

/** What they get, in three lines, below the fold-ish. */
function Highlights() {
  const items = [
    {
      icon: <MagnifyingGlassIcon size={17} aria-hidden="true" />,
      title: "Researched, with sources",
      body: "Every claim links to where we found it, including the evidence against you.",
    },
    {
      icon: <UsersThreeIcon size={17} aria-hidden="true" />,
      title: "Answers from real people",
      body: "Share a link, or have the interviews run and analysed for you.",
    },
    {
      icon: <GaugeIcon size={17} aria-hidden="true" />,
      title: "A score you can argue with",
      body: "Never a bare number. You always get the reasoning behind it.",
    },
  ];

  return (
    <div className="mt-14 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title}>
          <span className="text-brand">{item.icon}</span>
          <h2 className="type-body-l mt-2 font-medium text-primary">
            {item.title}
          </h2>
          <p className="type-body-m mt-1 text-secondary">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
