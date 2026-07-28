import { z } from "zod";
import { defineAgent } from "../types";
import {
  nicheTierSchema,
} from "@/lib/domain/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Agent definitions - PRD §6.
 *
 * Every judgment call, synthesis, estimate, go/no-go and "propose changes"
 * step in the pipeline is an agent call, never hardcoded logic. Each one is a
 * tightly scoped prompt plus a strict output schema, so it can be swapped for
 * a fine-tuned specialist SLM later without touching a caller.
 *
 * Prompt versions are bumped whenever wording changes, so the training corpus
 * in `agent_run_logs` stays attributable.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { VOICE } from "./voice";

// ── 6.1 Extraction Agent ───────────────────────────────────────────────────

export const extractionOutput = z.object({
  title: z.string(),
  problem_statement: z.string(),
  icp: z.string(),
  value_prop: z.string(),
  niche: z.string(),
  niche_tier: nicheTierSchema,
  niche_tier_reasoning: z.string(),
});

export const extractionAgent = defineAgent<
  {
    description: string;
    targetAudience: string;
    stage: string;
    productContext?: string;
    attachments?: string;
  },
  z.infer<typeof extractionOutput>
>({
  name: "extraction",
  promptVersion: "1.0.0",
  outputSchema: extractionOutput,
  maxTokens: 1200,
  temperature: 0.2,
  system: `${VOICE}

You turn a founder's free-text submission into the structured fields the rest of the pipeline reads.

Rules:
- title: a short, concrete name for this idea (max 6 words). Not a tagline.
- problem_statement: the problem as experienced by the user, NOT the solution. If the founder only described a solution, infer the problem it implies and state it in user terms.
- icp: be as narrow as the submission supports. "Small businesses" is a failure; "freelance graphic designers who invoice 5-20 clients a month" is right.
- value_prop: one sentence on the change this makes for that user.
- niche_tier drives interview pricing later, so classify honestly:
  · general_consumer - broad consumer audience, easy to find people
  · vertical_b2b - a specific professional or industry role
  · highly_specialized - regulated, clinical, deep-technical, or otherwise scarce expertise`,
  buildMessages: ({ description, targetAudience, stage, productContext, attachments }) => [
    {
      role: "user",
      content: [
        `Stage: ${stage}`,
        `What they're building: ${description}`,
        `Who it's for: ${targetAudience}`,
        productContext ? `Existing product context: ${productContext}` : "",
        attachments ? `From uploaded documents: ${attachments.slice(0, 2000)}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ],
});
