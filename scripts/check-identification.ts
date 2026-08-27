import { db, schema } from "../src/lib/db/index.ts";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const ideas = await db.select().from(schema.ideas);
  const safe = ideas.find(i => i.id.startsWith("8f12c3c3"));
  if (!safe) {
    console.log("No SafeSpark 8f12");
    return;
  }
  console.log(`SafeSpark: ${safe.id} ${safe.title}`);
  const versions = await db.select().from(schema.ideaStateVersions).where(eq(schema.ideaStateVersions.ideaId, safe.id));
  for (const v of versions) {
    const state: any = v.stateJson;
    console.log(`\n--- Questions for version ${v.id.slice(0,8)} ---`);
    for (const q of state.validation?.questionnaire?.questions || []) {
      console.log(`Q ${q.id.slice(0,4)} [${q.kind}] intent="${q.intent}" text="${q.text}"`);
    }
    console.log(`\n--- Responses in state: ${state.validation?.responses?.length} ---`);
    for (const r of state.validation?.responses?.slice(0,2) || []) {
      console.log(`  Response ${r.id.slice(0,8)} channel=${r.channel} notesLen=${r.notes?.length} answersJsonLen=${JSON.stringify(r).length}`);
      console.log(`    notes: ${(r.notes||"").slice(0,500).replace(/\n/g, " | ")}`);
    }
    const rows = await db.select().from(schema.validationResponses).where(eq(schema.validationResponses.ideaStateVersionId, v.id));
    console.log(`\nDB rows: ${rows.length}`);
    for (const row of rows.slice(0,3)) {
      console.log(`\nRow ${row.id.slice(0,8)}`);
      console.log(`  respondentName: "${row.respondentName}"`);
      console.log(`  respondentCareer: "${row.respondentCareer}"`);
      console.log(`  respondentLocation: "${row.respondentLocation}"`);
      console.log(`  answersJson: ${JSON.stringify(row.answersJson).slice(0,1000)}`);
      console.log(`  notes: ${(row.notes||"").slice(0,800).replace(/\n/g, " | ")}`);
      console.log(`  profile: ${JSON.stringify(row.respondentProfile)}`);
    }
  }
}

main().then(()=>process.exit(0));
