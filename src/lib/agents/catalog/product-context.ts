import { z } from "zod";
import { defineAgent } from "../types";

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

// ── 6.0 Product Context Agent ──────────────────────────────────────────────

export const productContextOutput = z.object({
  source_type: z.enum(["website", "app_store", "none"]),
  summary: z.string(),
  rating: z.number().nullable(),
  review_count: z.number().nullable(),
  notable_review_themes: z.array(z.string()),
});

export const productContextAgent = defineAgent<
  { url: string; pageText: string },
  z.infer<typeof productContextOutput>
>({
  name: "product_context",
  promptVersion: "1.0.0",
  outputSchema: productContextOutput,
  maxTokens: 1200,
  system: `${VOICE}

You read a founder's existing product page and extract what it tells us about their current traction. This runs BEFORE any external research, because a founder who already has users has real signal sitting in their own reviews.

Rules:
- Only report a rating or review count if the page actually states one. Otherwise null. Never estimate.
- notable_review_themes: what users repeatedly praise or complain about, in their words, not yours. Empty array if the page has no reviews.
- summary: 2-3 sentences on what the product does and who it is for, as the page presents it.`,
  buildMessages: ({ url, pageText }) => [
    {
      role: "user",
      content: `URL: ${url}\n\nPage content:\n${pageText.slice(0, 6000)}`,
    },
  ],
});
