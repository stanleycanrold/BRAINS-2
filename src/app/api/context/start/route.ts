import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { runAgent } from "@/lib/agents/runtime";
import { contextAgent } from "@/lib/agents/catalog/context";
import { productUnderstandingAgent } from "@/lib/agents/catalog/product-understanding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  description: z.string().min(1).max(4000),
  targetAudience: z.string().max(500).default(""),
  stageHint: z.string().optional(),
  formHint: z.string().optional(),
  productLink: z.string().nullable().optional(),
  variantLinks: z.array(z.string()).default([]),
});

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const res = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const head = [html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "", html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? ""].filter(Boolean).join("\n");
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 8000);
    return [head, body].filter(Boolean).join("\n\n").slice(0, 8000);
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Missing description" }, { status: 400 });
    const { description, targetAudience, stageHint, formHint, productLink, variantLinks } = parsed.data;

    let productModelSummary: string | undefined;
    if (productLink) {
      const text = await fetchPageText(productLink);
      if (text) {
        try {
          const pm = await runAgent(productUnderstandingAgent, { url: productLink, pageText: text, variantUrls: variantLinks }, {});
          productModelSummary = `${pm.what_it_does} | flows: ${pm.core_flows.join(", ")} | confidence: ${pm.confidence}`;
        } catch {}
      }
    }

    let out: any = await runAgent(contextAgent, {
      description,
      targetAudience,
      stageHint,
      formHint,
      productLink: productLink || undefined,
      productModelSummary,
      conversationHistory: [],
    }, {});
    // Enforce G4 -> variant_choice even if agent misclassifies (safety net for A/B)
    if (out.round_goal?.primary === "G4" && !out.testing_context?.formats?.includes("variant_choice")) {
      out.testing_context = out.testing_context || {};
      out.testing_context.formats = ["variant_choice"];
      out.testing_context.access = out.testing_context.access || { mode: "prototype_url", urls: {}, physical: {} };
      if (!out.testing_context.access.urls?.variant_a_url && productLink) out.testing_context.access.urls.variant_a_url = productLink;
    }
    // Fix isComplete consistency: true iff no nextQuestions
    out.isComplete = !out.nextQuestions || out.nextQuestions.length === 0;

    return NextResponse.json(out);
  } catch (e) {
    console.error("[POST /api/context/start]", e);
    return NextResponse.json({ error: "Context start failed" }, { status: 500 });
  }
}
