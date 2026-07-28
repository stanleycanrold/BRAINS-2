/**
 * Verifies the LLM + search layer against the configured provider.
 *   npx tsx --env-file=.env.local scripts/smoke-llm.ts
 */
import { z } from "zod";
import { getLLM, getSearch } from "../src/lib/llm";
import { toJsonSchema } from "../src/lib/agents/schema";

const Extraction = z.object({
  problem_statement: z.string(),
  icp: z.string(),
  value_prop: z.string(),
  niche_tier: z.enum([
    "general_consumer",
    "vertical_b2b",
    "highly_specialized",
  ]),
  confidence: z.number(),
});

async function main() {
  const llm = getLLM();
  console.log(`provider=${llm.name} model=${llm.model}\n`);

  console.log("— structured output —");
  const result = await llm.structured({
    name: "smoke_extraction",
    system:
      "You extract a structured problem statement from a founder's raw idea description. Be specific, never generic.",
    messages: [
      {
        role: "user",
        content:
          "Idea: a tool that automatically chases unpaid invoices for freelance designers, with escalating reminder emails. Audience: freelance graphic designers who invoice 5-20 clients a month.",
      },
    ],
    schema: Extraction,
    jsonSchema: toJsonSchema(Extraction),
    temperature: 0.2,
  });
  console.log(JSON.stringify(result.data, null, 2));

  console.log("\n— web search —");
  const search = getSearch();
  console.log(`search provider=${search.name} available=${search.available}`);
  const hits = await search.search(
    "Reddit discussions: freelancers frustrated chasing late invoice payments",
  );
  console.log(`${hits.length} results`);
  for (const hit of hits.slice(0, 5)) {
    console.log(`  • ${hit.title}\n    ${hit.url}`);
  }
}

main().catch((err) => {
  console.error("SMOKE FAILED:", err);
  process.exit(1);
});
