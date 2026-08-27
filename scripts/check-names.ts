import { db, schema } from "../src/lib/db/index.ts";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const ideas = await db.select().from(schema.ideas);
  const safe = ideas.find(i => i.title.includes("SafeSpark"));
  if (!safe) {
    console.log("No SafeSpark found");
    return;
  }
  console.log(`SafeSpark: ${safe.id} ${safe.title}`);
  const versions = await db.select().from(schema.ideaStateVersions).where(eq(schema.ideaStateVersions.ideaId, safe.id));
  for (const v of versions) {
    const rows = await db.select().from(schema.validationResponses).where(eq(schema.validationResponses.ideaStateVersionId, v.id));
    console.log(`\nVersion ${v.id.slice(0,8)} has ${rows.length} responses`);
    for (const r of rows.slice(0,3)) {
      console.log(`\n--- Respondent ${r.id.slice(0,8)} ---`);
      console.log(`respondentName: "${r.respondentName}"`);
      console.log(`respondentCareer: "${r.respondentCareer}"`);
      console.log(`respondentEmail: "${r.respondentEmail}"`);
      console.log(`notes (${r.notes.length} chars): ${r.notes.slice(0,500).replace(/\n/g, " | ")}`);
      console.log(`answersJson: ${JSON.stringify(r.answersJson).slice(0,800)}`);
      console.log(`profile: ${JSON.stringify(r.respondentProfile)}`);
    }
    // Check state's validation.responses for names
    const state: any = v.stateJson;
    console.log(`\nState responses: ${state.validation?.responses?.length}`);
    for (const sr of state.validation?.responses?.slice(0,2) || []) {
      console.log(`  state response ${sr.id.slice(0,8)} notes: ${sr.notes.slice(0,200).replace(/\n/g, " | ")}`);
    }
  }
}

main().then(()=>process.exit(0));
