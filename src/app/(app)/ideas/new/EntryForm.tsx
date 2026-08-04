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
/**
 * Cycled inside the box while it is empty.
 *
 * These replace the paragraph that used to sit above the composer. A line of
 * instructions is read once and then ignored; watching three concrete
 * examples get written shows what a usable description looks like without
 * asking anyone to read anything, and it costs no vertical space - which is
 * exactly what a phone does not have.
 */
const EXAMPLES = [
  "A tool for freelancers who lose hours chasing unpaid invoices…",
  "A marketplace putting small farms in touch with restaurants…",
  "Replacing the spreadsheet receptionists use for appointments…",
  "An app for parents splitting the childcare run each week…",
];

const STARTERS = [
  {
    label: "A tool for a job people do already",
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
    label: "One feature I am unsure about",
    seed: "Our product already does [what]. The part I'm unsure about is [feature], which is meant to solve ",
  },
];

export function EntryForm({
  compact = false,
  initialDescription = "",
}: {
  compact?: boolean;
  /** Seeded from ?draft= when someone typed their idea before signing up. */
  initialDescription?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = React.useState(initialDescription);
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
        examples={EXAMPLES}
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
        /**
         * One scrolling row on a phone, wrapped and centred once there is
         * room. Four long labels wrapping into four stacked lines was most of
         * what made this screen look broken on mobile, so below `sm` they stay
         * on one line and the row scrolls sideways instead of growing
         * downwards - which matters on a screen that deliberately does not
         * scroll. The negative margin cancels the shell's page padding so the
         * row runs to the screen edge and reads as scrollable rather than
         * clipped.
         */
        <div className="-mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:overflow-x-visible sm:px-0">
          <div className="flex gap-2 sm:flex-wrap sm:justify-center">
            {STARTERS.map((starter) => (
              <button
                key={starter.label}
                type="button"
                onClick={() => setDescription(starter.seed)}
                className="type-body-m shrink-0 rounded-full border border-line bg-raised px-3 py-1.5 whitespace-nowrap text-secondary transition-colors duration-[120ms] hover:border-line-strong hover:text-primary sm:whitespace-normal"
              >
                {starter.label}
              </button>
            ))}
          </div>
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
export function EntryScreen({
  heading,
  initialDescription = "",
}: {
  heading: string;
  initialDescription?: string;
}) {
  return (
    /**
     * Two layouts, one component.
     *
     * On a phone this is a chat screen: it fills the viewport exactly, does
     * not scroll, and the composer sits at the bottom where a thumb already
     * is. Nothing lives below the box, so there is nothing to scroll to and
     * nothing to cut off. The negative margin cancels the padding the app
     * shell puts on every page, which is what would otherwise force a scroll.
     *
     * From `sm` up it goes back to an ordinary centred page with the starters
     * and the highlights underneath, where there is room for them.
     */
    <div
      className={cn(
        "mx-auto w-full max-w-[720px]",
        "-my-8 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden",
        "sm:my-0 sm:block sm:h-auto sm:overflow-visible sm:pt-[9vh] sm:pb-16",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center sm:block sm:flex-none">
        {/* The animation lives on a wrapper rather than on the image, so it
            cannot be dropped by class merging inside LogoMark and does not
            share the transform property with anything else. */}
        <span className="animate-orbit mx-auto block size-[clamp(44px,12vw,60px)]">
          <LogoMark size={112} priority className="size-full" />
        </span>

        {/* One sentence. Everything the paragraph here used to explain is
            now shown inside the box instead, by example. */}
        <h1 className="type-display-xl mt-4 text-center text-primary">
          {heading}
        </h1>
      </div>

      <div className="pb-4 sm:mt-8 sm:pb-0">
        <EntryForm initialDescription={initialDescription} />
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

  /**
   * Icon beside the text on a phone, above it once there are columns.
   *
   * As a three-column grid these stacked into three tall blocks with the icon
   * marooned on its own line, which is a lot of screen to scroll past on the
   * way to nothing. Inline they read as three short lines, and the whole
   * section sits closer to the composer instead of floating in space.
   */
  return (
    <div className="mt-10 hidden gap-5 border-t border-line pt-7 sm:mt-14 sm:grid sm:grid-cols-3 sm:gap-6 sm:pt-8">
      {items.map((item) => (
        <div key={item.title} className="flex gap-3 sm:block">
          <span className="mt-0.5 shrink-0 text-brand sm:mt-0">
            {item.icon}
          </span>
          <div className="min-w-0">
            <h2 className="type-body-l font-medium text-primary sm:mt-2">
              {item.title}
            </h2>
            <p className="type-body-m mt-1 text-secondary">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
