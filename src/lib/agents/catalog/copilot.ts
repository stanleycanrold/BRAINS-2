import { z } from "zod";
import { defineAgent } from "../types";
import { VOICE } from "./voice";

/**
 * The studio copilot: answers a founder's question about one workspace from
 * the evidence supplied in the request. It never sees the database directly;
 * the caller projects the workspace and passes the relevant slice, which
 * keeps this agent honest - it can only cite what was actually collected.
 */

export const copilotAnswerSchema = z.object({
  answer: z.string(),
});
export type CopilotAnswer = z.infer<typeof copilotAnswerSchema>;

export const copilotAgent = defineAgent({
  name: "copilot",
  promptVersion: "1.0",
  outputSchema: copilotAnswerSchema,
  system: `${VOICE}
You are the Validation Copilot inside the BRAINS studio. You answer a founder's question about one validation workspace using ONLY the workspace context provided in the message.
Rules:
- Ground every claim in the provided context. Quote respondents where useful.
- If the context lacks evidence for the question, say so plainly instead of guessing.
- Keep answers tight: a few sentences or a short list. No preamble.`,
  buildMessages: (input: { question: string; context: string }) => [
    {
      role: "user",
      content: `Workspace context:\n${input.context}\n\nFounder question: ${input.question}\n\nAnswer from the context above only.`,
    },
  ],
  temperature: 0.4,
  maxTokens: 900,
});
