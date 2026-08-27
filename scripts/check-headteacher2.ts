import { db, schema } from "../src/lib/db/index.ts";
import { eq } from "drizzle-orm";

async function main() {
  const rows = await db.select().from(schema.validationResponses);
  const byIdea = new Map<string, typeof rows>();
  for (const r of rows) {
    const v = await db.select().from(schema.ideaStateVersions).where(eq(schema.ideaStateVersions.id, r.ideaStateVersionId)).then(vs => vs[0]);
    if (!v) continue;
    const idea = await db.select().from(schema.ideas).where(eq(schema.ideas.id, v.ideaId)).then(is => is[0]);
    const key = idea?.title || v.ideaId.slice(0,8);
    if (!byIdea.has(key)) byIdea.set(key, []);
    byIdea.get(key)!.push(r);
  }
  for (const [title, list] of byIdea) {
    if (title.includes("SafeSpark")) {
      console.log(`=== ${title} (${list.length} responses) ===`);
      for (const r of list) {
        const text = (r.notes || "").toLowerCase();
        const hasHead = text.includes("headteacher") || text.includes("head teacher") || text.includes("principal") || text.includes("deputy") || text.includes("assistant head");
        const hasLead = text.includes("i lead") || text.includes("i manage") || text.includes("responsible for") || text.includes("my school");
        console.log(`${r.id.slice(0,8)} career="${r.respondentCareer}" headHint=${hasHead} leadHint=${hasLead}`);
        console.log(`  notes: ${(r.notes||"").slice(0,350).replace(/\n/g, " | ")}`);
        console.log("---");
      }
    }
  }
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
