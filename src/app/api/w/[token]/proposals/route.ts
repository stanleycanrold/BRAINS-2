import { NextResponse } from "next/server";
import { z } from "zod";
import { getFounderWorkspace } from "@/lib/data/journey";
import { updateCurrentState } from "@/lib/data/ideas";

export const runtime = "nodejs";

const bodySchema = z.object({
  area: z.enum(["research", "decision"]),
  proposal_id: z.string(),
  status: z.enum(["accepted", "rejected", "edited"]),
  edited_text: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const workspace = await getFounderWorkspace(token);
  if (!workspace) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  if (workspace.permission !== "edit") return NextResponse.json({ error: "This workspace is read-only." }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid proposal decision." }, { status: 400 });
  const { area, proposal_id, status, edited_text } = parsed.data;

  const state = await updateCurrentState(workspace.versionId, (current) => {
    const proposals = area === "research"
      ? current.research_report?.proposed_changes
      : current.decision_gate?.improvement_proposal;
    const proposal = proposals?.find((item) => item.id === proposal_id);
    if (!proposal) return current;

    const isAccept = status === "accepted" || status === "edited";
    const structured = { ...current.structured };
    if (isAccept && proposal.patches !== "none" && proposal.patch_value) {
      structured[proposal.patches] = proposal.patch_value;
    }

    const nextProposal = {
      ...proposal,
      status,
      edited_text: status === "edited" ? edited_text ?? null : null,
    };

    return {
      ...current,
      structured,
      ...(area === "research" && current.research_report
        ? {
            research_report: {
              ...current.research_report,
              proposed_changes: current.research_report.proposed_changes.map((item) =>
                item.id === proposal_id ? nextProposal : item,
              ),
            },
          }
        : {}),
      ...(area === "decision" && current.decision_gate
        ? {
            decision_gate: {
              ...current.decision_gate,
              improvement_proposal: current.decision_gate.improvement_proposal.map((item) =>
                item.id === proposal_id ? nextProposal : item,
              ),
            },
          }
        : {}),
    };
  });

  return NextResponse.json({ state });
}
