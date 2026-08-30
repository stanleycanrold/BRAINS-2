import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createIdea, getIdea } from "@/lib/data/ideas";
import { describeIdeaProblem } from "@/lib/domain/limits";
import { runAgent } from "@/lib/agents/runtime";
import { extractionAgent } from "@/lib/agents/catalog/extraction";
import { testDesignerAgent } from "@/lib/agents/catalog/test-designer";
import { productUnderstandingAgent } from "@/lib/agents/catalog/product-understanding";
import { projectWorkspace } from "@/lib/studio/projection";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  ideaTitle: z.string().min(1).max(200),
  targetIcp: z.string().max(500).default(""),
  coreProblem: z.string().max(4000).default(""),
  targetPrice: z.number().nonnegative().nullable().optional(),
  testing_context: z.any().optional(),
  product_model: z.any().optional(),
  productLink: z.string().nullable().optional(),
  roundGoal: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Missing details" }, { status: 400 });
    const { ideaTitle, targetIcp, coreProblem, targetPrice, testing_context, product_model, productLink, roundGoal } = parsed.data;

    const description = [ideaTitle, coreProblem ? `Problem: ${coreProblem}` : "", targetIcp ? `Target customer: ${targetIcp}` : "", targetPrice ? `Intended pricing: around $${targetPrice} per month.` : ""].filter(Boolean).join("\n");
    const problem = describeIdeaProblem(description);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    // Try to enrich product_model if link given and not already provided
    let pm = product_model;
    if (!pm && productLink) {
      try {
        const res = await fetch(productLink.startsWith("http") ? productLink : `https://${productLink}`, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const html = await res.text();
          const text = html.replace(/<[^>]+>/g, " ").slice(0,8000);
          const out:any = await runAgent(productUnderstandingAgent, { url: productLink, pageText: text }, {});
          pm = out;
        }
      } catch {}
    }

    const idea = await createIdea({
      userId: user.id,
      stageAtEntry: (testing_context?.round_goal?.primary === "G1" ? "idea_only" : testing_context?.access?.mode === "none" ? "idea_only" : "mvp_built") as any,
      rawSubmission: { description, target_audience: targetIcp || "Not specified yet", product_link: productLink || null, location_focus: testing_context?.access?.physical?.location || "", attachments: [] },
    });

    // Patch the created idea's structured with testing_context/product_model/test_spec via direct DB update (simplified: use updateIdeaState)
    const { updateIdeaState } = await import("@/lib/data/ideas");
    let current = idea;
    if (testing_context) {
      const { testSpec, tasks } = await (async () => {
        try {
          const spec:any = await runAgent(testDesignerAgent, { testing_context, product_model: pm || { what_it_does: ideaTitle, core_flows: [], key_screens: [] }, problem_statement: coreProblem || ideaTitle, icp: targetIcp, goal: roundGoal || testing_context.round_goal?.primary || "G1" }, {});
          // Build tasks from spec
          const t: any[] = [];
          const push = (fmt:string, goal:string) => t.push({ id: `t_${Date.now()}_${fmt}`, idea_id: idea.id, format: fmt, goal, spec_version: 1, status: "founder_review", assigned_to: null, qa: { automated: {}, dry_run: { passed:false, tester:null }, founder_preview: { approved:false, at:null } }, launch_gate: {}, responses: { count:0, target:19 } });
          if (spec.variant_choice) push("variant_choice", spec.variant_choice.goal || "G4");
          if (spec.guided_task) push("guided_task", spec.guided_task.goal || "G3");
          if (spec.open_review) push("open_review", spec.open_review.goal || "G2");
          if (spec.interview) push("interview", spec.interview.goal || "G1");
          if (t.length===0) push("interview","G1");
          return { testSpec: spec, tasks: t };
        } catch (e) { console.error("[test-designer] failed", e); return { testSpec: null, tasks: [] }; }
      })();

      const updated = await updateIdeaState(idea.id, (s:any)=> ({
        ...s,
        testing_context: testing_context || s.testing_context,
        product_model: pm || s.product_model,
        test_spec: testSpec || s.test_spec,
        tasks: tasks.length ? tasks : s.tasks,
        onboarding_output: { draft_test_spec: testSpec, tier_choice: null, share_link: { url: null, status: "inactive", activated_at: null } },
      }));
      if (updated) current = { id: idea.id, title: ideaTitle, state: updated } as any;
      else {
        const refreshed = await getIdea(idea.id, user.id);
        if (refreshed) current = refreshed;
      }
    }

    const workspace = await projectWorkspace(current as any, { ownerName: user.name });
    workspace.meta.name = ideaTitle;
    return NextResponse.json(workspace, { status: 201 });
  } catch (err) {
    console.error("[POST /api/validate-idea]", err);
    return NextResponse.json({ error: "We couldn't start that validation. Try again." }, { status: 500 });
  }
}
