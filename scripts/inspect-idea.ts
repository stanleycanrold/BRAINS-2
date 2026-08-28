/**
 * Thorough idea inspector — one command for any idea, any niche.
 *
 * Usage:
 *   npx tsx --conditions=react-server --env-file=.env.local scripts/inspect-idea.ts              # list all ideas
 *   npx tsx --conditions=react-server --env-file=.env.local scripts/inspect-idea.ts <fragment>   # inspect by id/title fragment (e.g. "safespark" or "8f12c3c3")
 *   npx tsx --conditions=react-server --env-file=.env.local scripts/inspect-idea.ts <id> --json # machine-readable
 *
 * Standards:
 * - Never fabricates — every claim cites a row, a field, or a URL.
 * - Shows the full validation chain: idea → questionnaire → responses → profile → quotes → research → hypotheses → pricing → gate.
 * - Role canonicalisation visible (Teacher vs Classroom teacher).
 * - Decision-maker inference transparent (role + reasoning).
 * - Question-echo filtering visible (quotes vs questions).
 * - All counts are distinct, not inflated.
 */

import { db, schema } from "../src/lib/db";
import { eq, ilike, or, inArray } from "drizzle-orm";

type Args = {
  fragment?: string;
  json: boolean;
};

function parseArgs(): Args {
  const fragment = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const json = process.argv.includes("--json");
  return { fragment, json };
}

function trunc(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n).replace(/\n/g, " | ") + "…" : s.replace(/\n/g, " | ");
}

function roleCanonical(role: string): string {
  const low = role.trim().toLowerCase();
  const map: Record<string, string> = {
    "headteacher": "Headteacher",
    "head teacher": "Headteacher",
    "principal": "Headteacher",
    "head of school": "Headteacher",
    "classroom teacher": "Teacher",
    "teacher": "Teacher",
    "class teacher": "Teacher",
    "teaching assistant": "Teaching assistant",
    "ta": "Teaching assistant",
    "it manager": "IT Manager",
    "it lead": "IT Manager",
  };
  return map[low] || role;
}

async function main() {
  const { fragment, json } = parseArgs();

  // 1. List mode
  if (!fragment) {
    const ideas = await db.select().from(schema.ideas);
    const versions = await db.select().from(schema.ideaStateVersions);
    const versionByIdea = new Map(versions.map((v) => [v.ideaId, v]));
    const rows = await db.select().from(schema.validationResponses);

    const byVersion = new Map<string, number>();
    for (const r of rows) byVersion.set(r.ideaStateVersionId, (byVersion.get(r.ideaStateVersionId) || 0) + 1);

    const table = ideas
      .map((idea) => {
        const v = versionByIdea.get(idea.id);
        const state: any = v?.stateJson;
        const count = v ? (byVersion.get(v.id) || 0) : 0;
        return {
          id: idea.id.slice(0, 8),
          title: idea.title || "(untitled)",
          status: v?.status || "—",
          icp: state?.structured?.icp?.slice(0, 48) || state?.raw_submission?.target_audience?.slice(0, 48) || "—",
          responses: count,
          questions: state?.validation?.questionnaire?.questions?.length ?? 0,
          score: state?.decision_gate?.score ?? "—",
          verdict: state?.research_report?.problem_strength || state?.decision_gate?.signal || "—",
        };
      })
      .sort((a, b) => b.responses - a.responses);

    if (json) {
      console.log(JSON.stringify(table, null, 2));
    } else {
      console.log("\nIdeas (sorted by responses, most active first):\n");
      console.table(table);
      console.log('\nTip: npx tsx --conditions=react-server --env-file=.env.local scripts/inspect-idea.ts "safespark"');
    }
    process.exit(0);
  }

  // 2. Inspect mode — find idea by id prefix or title fragment
  const ideas = await db.select().from(schema.ideas);
  const lower = fragment!.toLowerCase();
  const idea =
    ideas.find((i) => i.id.toLowerCase().startsWith(lower)) ||
    ideas.find((i) => i.title.toLowerCase().includes(lower)) ||
    ideas.find((i) => i.summary.toLowerCase().includes(lower));

  if (!idea) {
    console.error(`No idea found for fragment "${fragment}"`);
    process.exit(1);
  }

  const versions = await db.select().from(schema.ideaStateVersions).where(eq(schema.ideaStateVersions.ideaId, idea.id));
  const current = versions.find((v) => v.id === idea.currentVersionId) || versions.sort((a, b) => b.versionNumber - a.versionNumber)[0];
  if (!current) {
    console.error(`No versions for idea ${idea.id}`);
    process.exit(1);
  }

  const state: any = current.stateJson;
  const dbRows = await db.select().from(schema.validationResponses).where(eq(schema.validationResponses.ideaStateVersionId, current.id));

  // Also include rows from other versions of this idea (append-only)
  const allVersionIds = versions.map((v) => v.id);
  const allRows = allVersionIds.length > 1
    ? await db.select().from(schema.validationResponses).where(inArray(schema.validationResponses.ideaStateVersionId, allVersionIds))
    : dbRows;

  const out: any = {
    idea: {
      id: idea.id,
      title: idea.title,
      summary: idea.summary,
      status: current.status,
      version: `${current.versionNumber}${current.parentVersionId ? ` (parent ${current.parentVersionId.slice(0, 8)})` : ""}`,
      created: idea.createdAt,
      updated: idea.updatedAt,
    },
    structured: {
      problem_statement: state.structured?.problem_statement || "—",
      icp: state.structured?.icp || state.raw_submission?.target_audience || "—",
      value_prop: state.structured?.value_prop || "—",
      niche: state.structured?.niche || "—",
      niche_tier: state.structured?.niche_tier || "—",
    },
    questionnaire: {
      intro: state.validation?.questionnaire?.intro || "—",
      accepting: state.validation?.questionnaire?.accepting_responses,
      questions: (state.validation?.questionnaire?.questions || []).map((q: any) => ({
        id: q.id.slice(0, 4),
        kind: q.kind,
        required: q.required,
        intent: q.intent,
        text: q.text,
      })),
    },
    responses: {
      total: allRows.length,
      in_state: state.validation?.responses?.length || 0,
      confirmation_rate: state.validation?.confirmation_rate ?? "—",
      by_channel: (() => {
        const c: Record<string, number> = {};
        for (const r of allRows) c[r.channel] = (c[r.channel] || 0) + 1;
        return c;
      })(),
      items: allRows.map((r) => {
        const canonical = roleCanonical(r.respondentCareer || "");
        const isGeneric = !r.respondentCareer || /^(interview participant|survey respondent|community member|participant)$/i.test(r.respondentCareer);
        return {
          id: r.id.slice(0, 8),
          channel: r.channel,
          track: r.track,
          confirmed: r.confirmed,
          review_status: r.reviewStatus,
          quality: r.reviewStatus === "approved" ? "approved" : r.reviewStatus,
          career_raw: r.respondentCareer || "—",
          career_canonical: canonical || "—",
          is_generic_role: isGeneric,
          location: r.respondentLocation || "—",
          email: r.respondentEmail ? `${r.respondentEmail.slice(0, 3)}***` : "—",
          profile: r.respondentProfile,
          icp_fit: r.icpFit,
          icp_reasoning: trunc(r.icpFitReasoning || "", 120),
          wtp: r.wtpEstimate || "—",
          confidence: r.qualityConfidence ?? "—",
          flags: r.qualityFlags || [],
          answersJson: r.answersJson?.length || 0,
          notes_preview: trunc(r.notes || "", 240),
          created: r.createdAt,
        };
      }),
    },
    research: state.research_report
      ? {
          problem_strength: state.research_report.problem_strength,
          reasoning: trunc(state.research_report.problem_strength_reasoning || "", 300),
          sources_searched: state.research_report.sources_searched || "— (pre-v4 report)",
          intent_breakdown: state.research_report.intent_breakdown || "— (pre-v4)",
          notable_findings: (state.research_report.notable_findings || []).slice(0, 3).map((f: any) => ({ summary: trunc(f.summary, 120), tags: f.intent_tags, url: f.source_url })),
          contradictions: state.research_report.contradictions_flagged || [],
          evidence: state.research_report.evidence?.length || 0,
          competitors: (state.research_report.competitors || []).map((c: any) => c.name),
          workarounds: state.research_report.current_workarounds?.length || 0,
          community_signals: state.research_report.community_signals?.length || 0,
          open_questions: state.research_report.open_questions || [],
          unsourced: state.research_report.unsourced,
          generated_at: state.research_report.generated_at,
        }
      : null,
    hypotheses: (state.hypotheses || []).map((h: any) => ({
      id: h.id.slice(0, 4),
      statement: h.statement,
      category: h.category,
      basis: h.basis,
      status: h.status,
      confidence: h.confidence,
      supporting: h.supporting?.length || 0,
      counter: h.counter?.length || 0,
    })),
    pricing: state.validation?.pricing_intelligence
      ? {
          model: state.validation.pricing_intelligence.model,
          point: state.validation.pricing_intelligence.wtp_point,
          range: `${state.validation.pricing_intelligence.wtp_range_low}–${state.validation.pricing_intelligence.wtp_range_high}`,
          basis: state.validation.pricing_intelligence.basis,
          reasoning: trunc(state.validation.pricing_intelligence.reasoning || "", 200),
        }
      : null,
    decision_gate: state.decision_gate
      ? {
          score: state.decision_gate.score,
          signal: state.decision_gate.signal,
          reasoning: trunc(state.decision_gate.reasoning || "", 300),
          risks: state.decision_gate.risk_factors,
          diagnostic: state.decision_gate.diagnostic,
        }
      : null,
    validation: {
      forced_early: state.validation?.forced_early_analysis,
      synthesis_themes: state.validation?.synthesis_summary?.themes || [],
      verbatim_quotes: (state.validation?.verbatim_quotes || []).slice(0, 3).map((q: any) => ({ text: trunc(q.text, 120), category: q.category, why: trunc(q.why_it_matters || "", 100) })),
    },
  };

  if (json) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`\n${"=".repeat(72)}`);
    console.log(`IDEA ${out.idea.id.slice(0, 8)} — ${out.idea.title} [${out.idea.status}]`);
    console.log(`${"=".repeat(72)}`);
    console.log(`\nStructured: ${out.structured.problem_statement.slice(0, 120)}`);
    console.log(`ICP: ${out.structured.icp}`);
    console.log(`Niche: ${out.structured.niche} (${out.structured.niche_tier})`);

    console.log(`\n--- Questionnaire (${out.questionnaire.questions.length} questions) ---`);
    out.questionnaire.questions.forEach((q: any) => console.log(`  ${q.id} [${q.kind}${q.required ? "*" : ""}] ${q.text}  // ${q.intent}`));

    console.log(`\n--- Responses (${out.responses.total} total, ${out.responses.in_state} in state) confirmation_rate=${out.responses.confirmation_rate} ---`);
    console.log(`By channel: ${JSON.stringify(out.responses.by_channel)}`);
    out.responses.items.forEach((r: any) => {
      const flag = r.is_generic_role ? "⚠ GENERIC ROLE" : " ";
      console.log(`  ${r.id} ${flag} ${r.career_canonical} @ ${r.location} — ${r.confirmed}/${r.review_status} wtp=${r.wtp} icp=${r.icp_fit} "${r.career_raw}"`);
    });

    if (out.research) {
      console.log(`\n--- Research: ${out.research.problem_strength} ---`);
      console.log(`Reasoning: ${out.research.reasoning}`);
      console.log(`Sources: ${JSON.stringify(out.research.sources_searched)}`);
      console.log(`Intent breakdown: ${JSON.stringify(out.research.intent_breakdown)}`);
      console.log(`Competitors: ${(out.research.competitors as string[]).join(", ") || "—"}`);
      console.log(`Evidence: ${out.research.evidence}  Workarounds: ${out.research.workarounds}  Community: ${out.research.community_signals}`);
      if ((out.research.contradictions as string[]).length) console.log(`Contradictions: ${(out.research.contradictions as string[]).join(" | ")}`);
      if ((out.research.notable_findings as any[]).length) console.log(`Notable: ${(out.research.notable_findings as any[]).map((f:any)=>f.summary.slice(0,80)).join(" | ")}`);
    } else {
      console.log("\n--- Research: none yet (still researching or draft) ---");
    }

    console.log(`\n--- Hypotheses (${out.hypotheses.length}) ---`);
    out.hypotheses.forEach((h: any) => console.log(`  ${h.id} [${h.basis}/${h.status} ${h.confidence}%] ${h.statement.slice(0,80)}`));

    if (out.pricing) console.log(`\n--- Pricing: ${out.pricing.model} $${out.pricing.point} (${out.pricing.range}) via ${out.pricing.basis} — ${out.pricing.reasoning}`);
    if (out.decision_gate) console.log(`\n--- Gate: ${out.decision_gate.score} ${out.decision_gate.signal} — ${out.decision_gate.reasoning.slice(0,120)}`);
    console.log(`\nVerbatims in state: ${out.validation.verbatim_quotes.length} — e.g. ${(out.validation.verbatim_quotes[0] as any)?.text?.slice(0,80) || "—"}`);
    console.log("");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
