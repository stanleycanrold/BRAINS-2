/**
 * End-to-end check of the research agent against live search, including the
 * PRD's hard rule that every claim carries a real source URL.
 *   npx tsx --env-file=.env.local scripts/smoke-agents.ts
 */
import { getLLM, getSearch } from "../src/lib/llm";
import { toJsonSchema } from "../src/lib/agents/schema";
import { researchAgent } from "../src/lib/agents/definitions";

async function main() {
  const llm = getLLM();
  const search = getSearch();

  const problem =
    "Freelance graphic designers lose hours each month manually chasing clients for late invoice payments.";
  const icp = "Freelance graphic designers invoicing 5-20 clients a month";

  console.log("Searching…");
  const results = [
    ...(await search.search(
      "freelancers late invoice payments chasing clients discussion",
    )),
    ...(await search.search("freelance invoice reminder automation tools")),
  ];
  const urls = new Set(results.map((r) => r.url));
  console.log(`${results.length} results, ${urls.size} unique URLs\n`);

  console.log("Running research agent…");
  const input = {
    problemStatement: problem,
    icp,
    valueProp: "Automated escalating reminders that get invoices paid faster",
    searchResults: results,
  };

  const out = await llm.structured({
    name: researchAgent.name,
    system: researchAgent.system,
    messages: researchAgent.buildMessages(input),
    schema: researchAgent.outputSchema,
    jsonSchema: toJsonSchema(researchAgent.outputSchema),
    maxTokens: researchAgent.maxTokens,
  });

  const r = out.data;
  console.log(`\nproblem_strength: ${r.problem_strength}`);
  console.log(`  ${r.problem_strength_reasoning}\n`);
  console.log(`competitors (${r.competitors.length}):`);
  r.competitors.forEach((c) => console.log(`  • ${c.name} — ${c.summary.slice(0, 90)}`));
  console.log(`\nevidence (${r.evidence.length}):`);
  r.evidence.forEach((e) => console.log(`  • ${e.claim.slice(0, 80)}\n    ${e.source_url}`));
  console.log(`\nproposed_changes (${r.proposed_changes.length}):`);
  r.proposed_changes.forEach((p) =>
    console.log(`  • [${p.patches}] ${p.text.slice(0, 90)}`),
  );

  // The acceptance criterion that matters: no invented URLs.
  const cited = r.evidence.map((e) => e.source_url).filter(Boolean);
  const hallucinated = cited.filter((u) => !urls.has(u));
  console.log(
    `\nCitation check: ${cited.length} cited, ${hallucinated.length} not traceable to a search result`,
  );
  if (hallucinated.length) {
    console.log("  UNTRACEABLE:");
    hallucinated.forEach((u) => console.log(`    ${u}`));
  }
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
