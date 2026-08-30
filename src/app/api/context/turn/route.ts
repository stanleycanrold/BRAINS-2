import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { runAgent } from "@/lib/agents/runtime";
import { contextAgent } from "@/lib/agents/catalog/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  description: z.string().min(1),
  targetAudience: z.string().default(""),
  stageHint: z.string().optional(),
  formHint: z.string().optional(),
  productLink: z.string().nullable().optional(),
  productModelSummary: z.string().optional(),
  conversationHistory: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  lastAnswer: z.string().min(1),
  lastQuestionIds: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    await requireUser();
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    const { description, targetAudience, stageHint, formHint, productLink, productModelSummary, conversationHistory, lastAnswer, lastQuestionIds } = parsed.data;

    if (conversationHistory.length >= 4) {
      return NextResponse.json({ error: "Max 4 questions reached" }, { status: 400 });
    }

    const history = [...conversationHistory];
    // Append last Q/A (use lastQuestionIds joined as q)
    history.push({ q: lastQuestionIds.join(" | ") || "follow-up", a: lastAnswer });

    const out = await runAgent(contextAgent, {
      description,
      targetAudience,
      stageHint,
      formHint,
      productLink: productLink || undefined,
      productModelSummary,
      conversationHistory: history,
    }, {});

    // Enforce 4-Q cap in code (PRD NFR)
    if (history.length + out.nextQuestions.length > 4) {
      out.nextQuestions = out.nextQuestions.slice(0, 4 - history.length);
      if (out.nextQuestions.length === 0) out.isComplete = true;
    }

    return NextResponse.json({ ...out, conversationHistory: history });
  } catch (e) {
    console.error("[POST /api/context/turn]", e);
    return NextResponse.json({ error: "Context turn failed" }, { status: 500 });
  }
}
