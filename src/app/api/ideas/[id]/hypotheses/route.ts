import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { hypothesisCategorySchema } from "@/lib/domain/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  statement: z.string().trim().min(10).max(600),
  category: hypothesisCategorySchema.default("Problem"),
  testable_expectation: z.string().trim().max(600).default(""),
});

/**
 * POST /ideas/:id/hypotheses - a hypothesis the founder states themselves.
 *
 * Stored with basis "feedback" so a later research pass never overwrites it,
 * and status "Testing" until the decision gate evaluates it against the pool.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await requireUser();
    const idea = await getIdea(id, user.id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Give the hypothesis a full sentence to test." },
        { status: 400 },
      );
    }

    const hypothesis = {
      id: randomUUID(),
      statement: parsed.data.statement,
      category: parsed.data.category,
      basis: "feedback" as const,
      status: "Testing" as const,
      confidence: 0,
      supporting: [] as string[],
      counter: [] as string[],
      takeaway: "",
      testable_expectation: parsed.data.testable_expectation,
      generated_at: new Date().toISOString(),
    };

    const state = await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      hypotheses: [...s.hypotheses, hypothesis],
    }));

    return NextResponse.json({ state, hypothesis });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/hypotheses]`, err);
    return NextResponse.json(
      { error: "We couldn't add that hypothesis." },
      { status: 500 },
    );
  }
}
