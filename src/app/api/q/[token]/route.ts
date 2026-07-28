import { NextResponse } from "next/server";
import { z } from "zod";
import { submitPublicResponse } from "@/lib/data/questionnaire";

export const runtime = "nodejs";

const bodySchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string(), answer: z.string().max(5000) }))
    .max(40),
  confirmed: z.enum(["yes", "no", "unsure"]),
  source: z.string().max(200).default(""),
});

/**
 * Public submission endpoint - deliberately unauthenticated.
 *
 * The share token IS the credential. It only ever grants: read the questions,
 * post one set of answers. There is no read path here for the idea, the
 * research, the score, or anyone else's responses.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Something in that submission looked wrong." },
        { status: 400 },
      );
    }

    const result = await submitPublicResponse({
      token,
      answers: parsed.data.answers,
      confirmed: parsed.data.confirmed,
      source: parsed.data.source,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/q]", err);
    return NextResponse.json(
      { error: "We couldn't record that. Try again." },
      { status: 500 },
    );
  }
}
