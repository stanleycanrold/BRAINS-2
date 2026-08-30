import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea, updateCurrentState } from "@/lib/data/ideas";
import { runAgent } from "@/lib/agents/runtime";
import { researchAgent } from "@/lib/agents/catalog/research";
import { getSearch } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const bodySchema = z.object({ ideaId: z.string().uuid(), editableInput: z.string().max(4000).optional() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { ideaId, editableInput } = bodySchema.parse(await req.json());
    const idea = await getIdea(ideaId, user.id);
    if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

    const state = idea.state;
    const problem = editableInput || state.structured.problem_statement || state.raw_submission.description;
    const icp = state.structured.icp || state.raw_submission.target_audience;

    const search = getSearch();
    const where = state.raw_submission.location_focus ? ` ${state.raw_submission.location_focus}` : "";
    const queries = [
      `${problem}${where}`,
      `${problem} frustration OR complaints`,
      `"${icp}" ${problem}${where}`,
      `${state.structured.niche} ${problem} reviews`,
    ];
    const results: any[] = [];
    for (const q of queries) {
      results.push(...await search.search(q));
      await new Promise(r=>setTimeout(r, 800));
    }
    const deduped = Array.from(new Map(results.map(r=>[r.url, r])).values());
    const diversified = deduped.slice(0, 100);

    if (deduped.length === 0) {
      return NextResponse.json({ unsourced: true, message: "No public discussion found" }, { status: 200 });
    }

    const research: any = await runAgent(researchAgent, {
      problemStatement: problem,
      icp,
      valueProp: state.structured.value_prop,
      searchResults: diversified,
    }, { ideaStateVersionId: idea.versionId });

    // Append to market_scans
    const ideaForUpdate = await getIdea(ideaId, user.id);
    if (ideaForUpdate) {
      await updateCurrentState(ideaForUpdate.versionId, (s:any)=> ({
        ...s,
        market_scans: [...(s.market_scans||[]), { ...research, isSimulation: false, run_at: new Date().toISOString(), input: editableInput || problem }],
      }));
    }

    return NextResponse.json(research);
  } catch (e) {
    console.error("[POST /api/research/run]", e);
    return NextResponse.json({ error: "Research failed" }, { status: 500 });
  }
}
