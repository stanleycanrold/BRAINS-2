import { db, schema } from "../src/lib/db/index.ts";

async function main() {
  const rows = await db.select().from(schema.validationResponses);
  console.log(`Total rows: ${rows.length}`);
  let headCount = 0;
  for (const r of rows) {
    const hay = `${r.respondentCareer || ""} ${r.notes || ""} ${JSON.stringify(r.respondentProfile || {})} ${JSON.stringify(r.answersJson || [])}`.toLowerCase();
    if (hay.includes("headteacher") || hay.includes("head teacher") || hay.includes("principal")) {
      console.log(`FOUND HEADTEACHER: id=${r.id.slice(0,8)} career="${r.respondentCareer}" profile=${JSON.stringify(r.respondentProfile)} notesSnippet="${(r.notes || "").slice(0,300).replace(/\n/g, " | ")}"`);
      headCount++;
    }
  }
  console.log(`Total headteacher mentions: ${headCount}`);
  
  // Show a few K-12 examples that were classified as Teacher
  console.log("\n--- K-12 examples (first 3) ---");
  let shown = 0;
  for (const r of rows) {
    const hay = `${r.notes || ""} ${JSON.stringify(r.answersJson || [])}`.toLowerCase();
    if (hay.includes("school") && shown < 3) {
      console.log(`id=${r.id.slice(0,8)} career="${r.respondentCareer}" profile=${JSON.stringify(r.respondentProfile)}`);
      console.log(`  notes: ${(r.notes || "").slice(0,400).replace(/\n/g, " | ")}`);
      console.log(`  answersJson: ${JSON.stringify(r.answersJson || []).slice(0,500)}`);
      console.log("---");
      shown++;
    }
  }
  
  // Check ideaState for SafeSpark ICP
  const versions = await db.select().from(schema.ideaStateVersions).limit(10);
  for (const v of versions) {
    const state: any = v.stateJson;
    if (state?.structured?.icp?.toLowerCase().includes("k-12") || state?.title?.toLowerCase().includes("safespark")) {
      console.log(`\nSafeSpark version ${v.id.slice(0,8)} ICP: ${state.structured?.icp}`);
      console.log(`Problem: ${state.structured?.problem_statement?.slice(0,100)}`);
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
