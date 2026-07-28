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

// ── 6.4 Validation Synthesis Agent ─────────────────────────────────────────

export const synthesisOutput = z.object({
  themes: z.array(z.string()),
  notable_points: z.array(z.string()),
  objections: z.array(z.string()),
  narrative: z.string(),
});

export const synthesisAgent = defineAgent<
  {
    problemStatement: string;
    responses: {
      confirmed: string;
      notes: string;
      source: string;
      channel: string;
    }[];
  },
  z.infer<typeof synthesisOutput>
>({
  name: "validation_synthesis",
  promptVersion: "1.0.0",
  outputSchema: synthesisOutput,
  maxTokens: 2000,
  system: `${VOICE}

You read every response the founder gathered - across interviews, surveys and social replies - and report what people actually said. This is a pure read of the data: you do not score it and you do not decide anything. That is a separate step.

themes: patterns that recur across MULTIPLE responses. A one-off is not a theme.
notable_points: the most revealing individual responses, PARAPHRASED - never quote at length.
objections: the strongest reasons people gave for this not mattering to them. If people pushed back, say so clearly; do not bury it.
narrative: 3-5 sentences a founder can read in ten seconds and understand what they learned. Lead with the finding, not the methodology.

If responses are thin, one-word, or all from one source, say that plainly in the narrative - the quality of the input is part of the finding.`,
  buildMessages: ({ problemStatement, responses }) => [
    {
      role: "user",
      content: [
        `Problem being validated: ${problemStatement}`,
        `${responses.length} responses:`,
        responses
          .map(
            (r, i) =>
              `${i + 1}. [${r.channel}] confirmed=${r.confirmed} source=${r.source || "unspecified"}\n   ${r.notes || "(no notes)"}`,
          )
          .join("\n"),
      ].join("\n\n"),
    },
  ],
});
