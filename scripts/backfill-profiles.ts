/**
 * One-time backfill: runs the respondent-profile agent over EVERY existing
 * response so roles, company sizes, industries, tools and purchase power
 * appear in the dashboard without waiting for new submissions.
 *
 * Self-contained on purpose — imports only db + runtime + catalog, avoiding
 * the data/ideas chain that pulls next/navigation (breaks under tsx).
 *
 *   npx tsx --conditions=react-server --env-file=.env.local scripts/backfill-profiles.ts
 */
import { db, schema } from "../src/lib/db";
import { runAgent } from "../src/lib/agents/runtime";
import { respondentProfileAgent } from "../src/lib/agents/catalog";
import { ideaStateSchema } from "../src/lib/domain/types";
import { eq } from "drizzle-orm";

async function main() {
  console.log("\nBackfilling respondent profiles from transcripts...\n");

  const responses = await db
    .select({
      id: schema.validationResponses.id,
      versionId: schema.validationResponses.ideaStateVersionId,
      career: schema.validationResponses.respondentCareer,
    })
    .from(schema.validationResponses);

  console.log(`Found ${responses.length} responses.\n`);

  let updated = 0;
  let failed = 0;

  for (const r of responses) {
    const generic =
      !r.career ||
      /^(interview participant|survey respondent|community member|participant)$/i.test(
        r.career.trim(),
      );
    console.log(
      `  -> ${r.id.slice(0, 8)} ${generic ? "(no specific career) extracting…" : `(career="${r.career}") enriching…`}`,
    );

    try {
      const [row] = await db
        .select()
        .from(schema.validationResponses)
        .where(eq(schema.validationResponses.id, r.id))
        .limit(1);
      if (!row) continue;

      const [version] = await db
        .select()
        .from(schema.ideaStateVersions)
        .where(eq(schema.ideaStateVersions.id, r.versionId))
        .limit(1);
      if (!version) continue;

      const state = ideaStateSchema.parse(version.stateJson);
      const answers = (row.answersJson ?? []).map((a) => ({
        question_id: a.question_id,
        question: a.question,
        answer: a.answer,
      }));
      const explicit = row.respondentProfile ?? {};

      const result = await runAgent(
        respondentProfileAgent,
        {
          problemStatement: state.structured.problem_statement,
          icp: state.structured.icp,
          questions: state.validation.questionnaire.questions.map((q) => ({
            id: q.id,
            text: q.text,
            intent: q.intent,
          })),
          answers,
          notes: row.notes,
          explicitProfile: {
            company_size: explicit.company_size,
            industry: explicit.industry,
            decision_maker: explicit.decision_maker,
            current_tools: explicit.current_tools,
          },
          respondentCareerRaw: row.respondentCareer,
        },
        { ideaStateVersionId: r.versionId },
      );

      const canonicalRole = (() => {
        const raw = result.role?.trim() || "";
        if (!raw) return "";
        const low = raw.toLowerCase();
        const map: Record<string, string> = {
          "headteacher": "Headteacher",
          "head teacher": "Headteacher",
          "principal": "Headteacher",
          "head of school": "Headteacher",
          "deputy head": "Headteacher",
          "assistant head": "Headteacher",
          "classroom teacher": "Teacher",
          "teacher": "Teacher",
          "class teacher": "Teacher",
          "teaching assistant": "Teaching assistant",
          "ta": "Teaching assistant",
          "learning support assistant": "Teaching assistant",
          "it manager": "IT Manager",
          "it lead": "IT Manager",
          "network manager": "IT Manager",
          "product manager": "Product Manager",
          "product lead": "Product Manager",
          "founder": "Founder",
          "co-founder": "Founder",
          "owner": "Founder",
          "director": "Director",
          "manager": "Manager",
          "commuter cyclist": "Commuter cyclist",
          "cyclist": "Commuter cyclist",
          "food delivery rider": "Food delivery rider",
          "delivery rider": "Food delivery rider",
          "delivery driver": "Food delivery rider",
        };
        return map[low] || raw;
      })();
      const patch: Record<string, unknown> = {};
      if (canonicalRole) patch["respondentCareer"] = canonicalRole;
      if ((result as any).display_name?.trim()) patch["respondentName"] = (result as any).display_name.trim();

      const profilePatch: Record<string, unknown> = {};
      if (result.company_size?.trim()) profilePatch["company_size"] = result.company_size.trim();
      if (result.industry?.trim()) profilePatch["industry"] = result.industry.trim();
      if (result.current_tools?.length) profilePatch["current_tools"] = result.current_tools;
      profilePatch["decision_maker"] = result.decision_maker;

      await db
        .update(schema.validationResponses)
        .set({
          ...patch,
          respondentProfile: { ...explicit, ...profilePatch },
          icpFitReasoning: result.icp_relevant_detail || row.icpFitReasoning,
        } as any)
        .where(eq(schema.validationResponses.id, r.id));

      console.log(
        `     name="${(result as any).display_name || "—"}" role="${canonicalRole || "—"}" size="${result.company_size || "—"}" industry="${result.industry || "—"}" decisionMaker=${result.decision_maker} tools=[${(result.current_tools ?? []).join(", ")}]`,
      );
      updated++;
    } catch (err) {
      console.error(`  FAILED ${r.id}:`, err);
      failed++;
    }
  }

  console.log(`\nDone. ${updated} enriched, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
