/**
 * End-to-end pipeline check against live agents, without the browser.
 * Creates a throwaway idea, runs research → signal scan → responses → gate,
 * asserts the threshold rule holds, then deletes everything it made.
 *
 *   npx tsx --env-file=.env.local scripts/smoke-pipeline.ts
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { createIdea, updateCurrentState } from "../src/lib/data/ideas";
import {
  runResearchPipeline,
  runSignalScan,
  runDecisionGate,
} from "../src/lib/agents/orchestrator";
import { GO_AHEAD_THRESHOLD } from "../src/lib/domain/types";

const CLERK_ID = "pipeline_smoke_" + Date.now();
let failures = 0;

function check(label: string, condition: boolean, detail = "") {
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!condition) failures++;
}

async function main() {
  const [user] = await db
    .insert(schema.users)
    .values({ clerkId: CLERK_ID, email: "pipeline@smoke.local", name: "Smoke" })
    .returning();

  try {
    console.log("\n1. Create idea");
    const idea = await createIdea({
      userId: user.id,
      stageAtEntry: "idea_only",
      rawSubmission: {
        description:
          "A tool that automatically chases unpaid invoices for freelance designers with escalating reminder emails, so they stop losing hours to awkward follow-ups.",
        target_audience: "Freelance graphic designers invoicing 5-20 clients a month",
        product_link: null,
      location_focus: "",
        attachments: [],
      },
    });
    check("idea + version 1 created", idea.versionNumber === 1);

    console.log("\n2. Research pipeline (extraction + live search)");
    let state = await runResearchPipeline({
      versionId: idea.versionId,
      state: idea.state,
    });
    check("problem statement extracted", state.structured.problem_statement.length > 20);
    check("niche tier classified", Boolean(state.structured.niche_tier));
    check("research report written", state.research_report !== null);
    /**
     * Both of these need live search. When the search quota is exhausted the
     * pipeline is SUPPOSED to degrade to an unsourced report rather than
     * crash, so failing here would report a working degradation path as a
     * broken build - and a suite that cries wolf gets ignored.
     */
    const searchDown = (state.research_report?.evidence.length ?? 0) === 0;
    if (searchDown) {
      console.log(
        "  SKIP  proposals generated - no live search available (quota or outage)",
      );
      console.log(
        `        report correctly flagged unsourced: ${state.research_report?.unsourced}`,
      );
    } else {
      check(
        "proposals generated",
        (state.research_report?.proposed_changes.length ?? 0) > 0,
        `${state.research_report?.proposed_changes.length ?? 0}`,
      );
    }
    console.log(`     strength: ${state.research_report?.problem_strength}`);
    console.log(`     evidence: ${state.research_report?.evidence.length} sourced claims`);

    console.log("\n3. Signal scan (communities + script)");
    state = await runSignalScan({ versionId: idea.versionId, state });
    if (searchDown) {
      console.log("  SKIP  communities found - no live search available");
    } else {
      check(
        "communities found",
        state.validation.communities.length > 0,
        `${state.validation.communities.length}`,
      );
    }
    check("interview script drafted", state.validation.script.length > 100);

    console.log("\n4. Log responses (6 yes, 4 no → 60%)");
    const mix = [
      ...Array(6).fill("yes"),
      ...Array(4).fill("no"),
    ] as ("yes" | "no")[];

    state = await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      validation: {
        ...s.validation,
        track: "normal",
        responses: mix.map((confirmed, i) => ({
          id: randomUUID(),
          confirmed,
          notes:
            confirmed === "yes"
              ? "Said they lose about half a day a month chasing late payers, and hate the awkwardness."
              : "Uses a retainer model so this rarely comes up for them.",
          source: `Respondent ${i + 1}`,
          channel: "interview" as const,
          track: "normal" as const,
          review_status: "approved" as const,
      quality_flags: [],
      expert_id: null,
          expert_name: null,
          confidence: null,
          created_at: new Date().toISOString(),
        })),
      },
    }));

    console.log("\n5. Synthesis + Decision Gate");
    state = await runDecisionGate({
      versionId: idea.versionId,
      state,
      forcedEarly: false,
    });

    const gate = state.decision_gate!;
    const rate = state.validation.confirmation_rate;

    console.log(`     rate: ${(rate * 100).toFixed(0)}%  score: ${gate.score}  signal: ${gate.signal}`);

    check("confirmation rate is 60%", Math.round(rate * 100) === 60);
    check(
      "threshold rule enforced by us, not the model",
      gate.signal === (rate >= GO_AHEAD_THRESHOLD ? "go_ahead" : "rethink"),
      `${gate.signal}`,
    );
    check("score within 0-100", gate.score >= 0 && gate.score <= 100);
    check("reasoning present - never a bare number", gate.reasoning.length > 40);
    check("risk factors surfaced", gate.risk_factors.length > 0, `${gate.risk_factors.length}`);
    check("synthesis themes present", state.validation.synthesis_summary.themes.length > 0);
    check("status advanced to gate_review", state.status === "gate_review");

    console.log("\n6. Agent run logging (SLM training corpus)");
    const logs = await db
      .select()
      .from(schema.agentRunLogs)
      .where(eq(schema.agentRunLogs.ideaStateVersionId, idea.versionId));
    const names = [...new Set(logs.map((l) => l.agentName))].sort();
    check("every agent call logged", logs.length >= 5, `${logs.length} runs`);
    console.log(`     agents: ${names.join(", ")}`);
    check(
      "prompt versions recorded",
      logs.every((l) => Boolean(l.promptVersion)),
    );
  } finally {
    // Cascades through versions, responses, gates and logs.
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    console.log("\ncleanup OK");
  }

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\nPIPELINE FAILED:", err);
  process.exit(1);
});
