import { db, schema } from "../src/lib/db/index.ts";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const rows = await db.select().from(schema.validationResponses).limit(30);
  const versionIds = [...new Set(rows.map(r => r.ideaStateVersionId))];
  const versions = await db.select().from(schema.ideaStateVersions).where(inArray(schema.ideaStateVersions.id, versionIds));
  const versionToIdea = new Map(versions.map(v => [v.id, v.ideaId]));
  const ideas = await db.select().from(schema.ideas);
  const ideaMap = new Map(ideas.map(i => [i.id, i.title]));
  
  // Group by idea
  const byIdea = new Map<string, number>();
  for (const r of rows) {
    const ideaId = versionToIdea.get(r.ideaStateVersionId) || "unknown";
    byIdea.set(ideaId, (byIdea.get(ideaId) || 0) + 1);
  }
  console.log("Responses per idea:");
  for (const [ideaId, count] of byIdea) {
    console.log(`${ideaId.slice(0,8)} ${ideaMap.get(ideaId) || "unknown"}: ${count}`);
  }
  
  // Find the K-12 idea (should be SafeSpark)
  for (const [ideaId, count] of byIdea) {
    const title = ideaMap.get(ideaId) || "";
    if (title.toLowerCase().includes("safespark") || count >= 10) {
      console.log(`\n--- Detailed for ${ideaId.slice(0,8)} ${title} ---`);
      const vIds = versions.filter(v => v.ideaId === ideaId).map(v => v.id);
      const ideaRows = rows.filter(r => vIds.includes(r.ideaStateVersionId));
      for (const r of ideaRows.slice(0,3)) {
        console.log(`\nRow ${r.id.slice(0,8)} career="${r.respondentCareer}"`);
        console.log(`Profile: ${JSON.stringify(r.respondentProfile)}`);
        console.log(`AnswersJson: ${JSON.stringify(r.answersJson).slice(0,800)}`);
        console.log(`Notes: ${(r.notes || "").slice(0,600).replace(/\n/g, " | ")}`);
      }
      // Check state for this idea
      const v = versions.find(v => v.ideaId === ideaId);
      if (v) {
        const state: any = v.stateJson;
        console.log(`\nState ICP: ${state.structured?.icp}`);
        console.log(`Questions: ${state.validation?.questionnaire?.questions?.map((q:any) => q.text).join(" | ").slice(0,500)}`);
      }
    }
  }
}

main().then(()=>process.exit(0));
