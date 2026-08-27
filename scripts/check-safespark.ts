import { db, schema } from "../src/lib/db/index.ts";
import { eq } from "drizzle-orm";

async function main() {
  const ideas = await db.select().from(schema.ideas).limit(20);
  for (const idea of ideas) {
    console.log(`Idea ${idea.id.slice(0,8)} title="${idea.title}"`);
  }
  // Find SafeSpark by title
  const allIdeas = await db.select().from(schema.ideas);
  const safe = allIdeas.find(i => i.title.toLowerCase().includes("safespark"));
  if (!safe) {
    console.log("No SafeSpark found by title, checking by summary");
    const bySummary = allIdeas.find(i => i.summary.toLowerCase().includes("safespark") || i.summary.toLowerCase().includes("offline"));
    console.log(bySummary ? `Found by summary: ${bySummary.id} ${bySummary.title}` : "Not found");
  } else {
    console.log(`SafeSpark id=${safe.id}`);
    const versions = await db.select().from(schema.ideaStateVersions).where(eq(schema.ideaStateVersions.ideaId, safe.id));
    console.log(`Versions: ${versions.length}`);
    for (const v of versions) {
      const state: any = v.stateJson;
      console.log(`\nVersion ${v.id.slice(0,8)} status=${v.status} responses=${state.validation?.responses?.length} questions=${state.validation?.questionnaire?.questions?.length}`);
      console.log(`ICP: ${state.structured?.icp}`);
      // Check responses in state
      for (const r of state.validation?.responses || []) {
        console.log(`  Response ${r.id.slice(0,8)} channel=${r.channel} confirmed=${r.confirmed} career=${r.source} notesLen=${r.notes?.length}`);
        console.log(`    notes snippet: ${(r.notes || "").slice(0,200).replace(/\n/g, " | ")}`);
      }
      // Check DB rows for this version
      const dbRows = await db.select().from(schema.validationResponses).where(eq(schema.validationResponses.ideaStateVersionId, v.id));
      console.log(`  DB rows for this version: ${dbRows.length}`);
      for (const row of dbRows) {
        console.log(`    DB ${row.id.slice(0,8)} career="${row.respondentCareer}" profile=${JSON.stringify(row.respondentProfile)} answersJsonLen=${JSON.stringify(row.answersJson || []).length}`);
        console.log(`      notes: ${(row.notes || "").slice(0,250).replace(/\n/g, " | ")}`);
      }
    }
  }
}

main().then(()=>process.exit(0));
