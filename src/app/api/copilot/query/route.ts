import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { runAgent } from "@/lib/agents/runtime";
import { copilotAgent } from "@/lib/agents/catalog";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/copilot/query - adapter for the empirical AI Analyst tab.
 *
 * The tab ships the founder's question plus a slim slice of the workspace's
 * respondents and wants back {content, citations}. We hand both to the
 * copilot agent, which answers only from that context, and build citations
 * from the respondents actually supplied - never invented ones.
 */

const respondentSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  role: z.string().default(""),
  company: z.string().default(""),
  willingnessToPay: z.number().default(0),
  keyQuote: z.string().default(""),
  painSeverity: z.number().default(0),
  tools: z.array(z.string()).default([]),
  fullTranscript: z.array(z.any()).default([]),
});

const bodySchema = z.object({
  query: z.string().min(1),
  respondentsContext: z.array(respondentSchema).default([]),
});

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { query, respondentsContext } = parsed.data;

    const context =
      respondentsContext.length > 0
        ? respondentsContext
            .map(
              (r, i) =>
                `Respondent ${i + 1} (${r.name || "anonymous"}, ${r.role || "role unknown"}${
                  r.company ? `, ${r.company}` : ""
                }): pain ${r.painSeverity}/10, willingness to pay $${r.willingnessToPay}/mo.` +
                (r.keyQuote ? ` Said: "${r.keyQuote}"` : ""),
            )
            .join("\n")
        : "No respondents have been collected for this workspace yet.";

    const result = await runAgent(copilotAgent, { question: query, context });

    // Cite the respondents whose quotes exist, so the UI can link them back.
    const citations = respondentsContext
      .filter((r) => r.keyQuote.trim().length > 0)
      .slice(0, 3)
      .map((r) => ({
        sourceId: r.id,
        sourceName: `${r.name || "Respondent"} (${r.role || "Participant"})`,
        quote: r.keyQuote,
      }));

    return NextResponse.json({ content: result.answer, citations });
  } catch (err) {
    console.error("[POST /api/copilot/query]", err);
    return NextResponse.json(
      { error: "The copilot could not answer that right now." },
      { status: 500 },
    );
  }
}
