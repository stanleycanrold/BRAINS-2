import { NextResponse } from "next/server";
import { z } from "zod";
import { submitPublicResponse } from "@/lib/data/questionnaire";

export const runtime = "nodejs";

const bodySchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string(), answer: z.string().max(5000) }))
    .max(40),
  confirmed: z.enum(["yes", "no", "unsure"]),
  respondent_name: z.string().trim().min(1).max(120),
  respondent_career: z.string().trim().min(1).max(160),
  respondent_location: z.string().trim().min(1).max(160),
  respondent_email: z.string().trim().email().max(320),
  respondent_phone: z.string().trim().min(7).max(40),
  // Optional context about the respondent, used for ICP fit only. Contact
  // fields stay private; these never identify anyone on their own.
  company_size: z.string().trim().max(80).optional(),
  industry: z.string().trim().max(160).optional(),
  decision_maker: z.boolean().optional(),
  current_tools: z.array(z.string().trim().max(120)).max(20).optional(),
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
      respondentName: parsed.data.respondent_name,
      respondentCareer: parsed.data.respondent_career,
      respondentLocation: parsed.data.respondent_location,
      respondentEmail: parsed.data.respondent_email,
      respondentPhone: parsed.data.respondent_phone,
      respondentProfile: {
        company_size: parsed.data.company_size,
        industry: parsed.data.industry,
        decision_maker: parsed.data.decision_maker,
        current_tools: parsed.data.current_tools?.filter(Boolean) ?? [],
      },
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
