import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { runAgent } from "@/lib/agents/runtime";
import { copilotAgent } from "@/lib/agents/catalog";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/copilot/chat - adapter for the floating Validation Copilot bubble.
 *
 * The bubble ships a message plus a compact workspace summary and wants back
 * {reply}. We flatten the summary into context for the copilot agent, which
 * answers only from what was supplied.
 */

const bodySchema = z.object({
  message: z.string().min(1),
  context: z
    .object({
      name: z.string().default(""),
      tagline: z.string().default(""),
      score: z.number().default(0),
      painRate: z.number().default(0),
      avgWtp: z.number().default(0),
      totalRespondents: z.number().default(0),
      targetMarket: z.string().default(""),
      competitors: z.array(z.string()).default([]),
      topQuotes: z.array(z.string()).default([]),
    })
    .default({
      name: "",
      tagline: "",
      score: 0,
      painRate: 0,
      avgWtp: 0,
      totalRespondents: 0,
      targetMarket: "",
      competitors: [],
      topQuotes: [],
    }),
});

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { message, context } = parsed.data;

    const lines = [
      context.name ? `Workspace: ${context.name}` : "",
      context.tagline ? `What it does: ${context.tagline}` : "",
      context.targetMarket ? `Target market: ${context.targetMarket}` : "",
      `Validation score: ${context.score}/100 across ${context.totalRespondents} respondents.`,
      `Unprompted pain mention rate: ${context.painRate}%. Mean willingness to pay: $${context.avgWtp}/mo.`,
      context.competitors.length
        ? `Known competitors/workarounds: ${context.competitors.join(", ")}.`
        : "",
      context.topQuotes.length
        ? `Top evidence quotes:\n${context.topQuotes.map((q) => `- "${q}"`).join("\n")}`
        : "",
    ].filter(Boolean);

    const result = await runAgent(copilotAgent, {
      question: message,
      context:
        lines.length > 0
          ? lines.join("\n")
          : "No workspace context was provided.",
    });

    return NextResponse.json({ reply: result.answer });
  } catch (err) {
    console.error("[POST /api/copilot/chat]", err);
    return NextResponse.json(
      { error: "The copilot could not answer that right now." },
      { status: 500 },
    );
  }
}
