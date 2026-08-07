/**
 * One definition of "a source", checked.
 *
 * The dashboard once said an idea had 4 sources while its shared report said
 * 0, for the same research run: one was adding evidence items to competitor
 * entries, the other was counting evidence alone, and the run had four
 * competitors citing two URLs between them. Both numbers were findings
 * miscalled sources.
 *
 * These cases exist so that never comes back quietly. The last two are the
 * regression itself.
 */
import {
  countSources,
  countSourcesAcross,
  sourceUrls,
} from "../src/lib/domain/research-sources";
import { researchReportSchema } from "../src/lib/domain/types";

type Partial = Parameters<typeof researchReportSchema.parse>[0];

function report(fields: Record<string, unknown>) {
  return researchReportSchema.parse(fields as Partial);
}

let failures = 0;
function expect(label: string, actual: number, wanted: number) {
  const ok = actual === wanted;
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} — got ${actual}, want ${wanted}`);
}

console.log("\nWhat counts as a source\n");

expect("no research at all", countSources(null), 0);
expect("a report that cited nothing", countSources(report({})), 0);

expect(
  "a claim with no URL behind it is not a source",
  countSources(report({ evidence: [{ claim: "People hate this", source_url: "" }] })),
  0,
);

expect(
  "four findings drawn from one page is one source",
  countSources(
    report({
      competitors: [
        { name: "A", summary: "", source_url: "https://g2.com/x" },
        { name: "B", summary: "", source_url: "https://g2.com/x" },
        { name: "C", summary: "", source_url: "https://g2.com/x" },
        { name: "D", summary: "", source_url: "https://g2.com/x" },
      ],
    }),
  ),
  1,
);

expect(
  "the same page written two ways is one source",
  countSources(
    report({
      evidence: [{ claim: "a", source_url: "https://WWW.G2.com/x/" }],
      competitors: [{ name: "B", summary: "", source_url: "https://g2.com/x" }],
    }),
  ),
  1,
);

expect(
  "something that is not a URL is not a source",
  countSources(report({ evidence: [{ claim: "a", source_url: "internal notes" }] })),
  0,
);

expect(
  "sources are counted across all four collections, not just evidence",
  countSources(
    report({
      evidence: [{ claim: "a", source_url: "https://one.com/a" }],
      contrary_evidence: [{ claim: "b", source_url: "https://two.com/b" }],
      competitors: [{ name: "C", summary: "", source_url: "https://three.com/c" }],
      current_workarounds: [
        { description: "d", why_it_persists: "", source_url: "https://four.com/d" },
      ],
    }),
  ),
  4,
);

expect(
  "a rework that re-reads the same page does not double the count",
  countSourcesAcross([
    report({ evidence: [{ claim: "a", source_url: "https://one.com/a" }] }),
    report({ evidence: [{ claim: "a again", source_url: "https://one.com/a" }] }),
  ]),
  1,
);

/**
 * The regression, exactly as it happened: no evidence, four competitors, two
 * distinct pages. The dashboard said 4, the shared report said 0.
 */
const safespark = report({
  competitors: [
    { name: "A", summary: "", source_url: "https://www.g2.com/products/school-edtech/competitors/alternatives" },
    { name: "B", summary: "", source_url: "https://www.g2.com/products/school-edtech/competitors/alternatives" },
    { name: "C", summary: "", source_url: "https://www.g2.com/products/school-edtech/competitors/alternatives" },
    { name: "D", summary: "", source_url: "https://www.clever.com/blog/2024/07/top-wonde-competitors-and-alternatives-in-2024" },
  ],
});

expect("the SafeSpark run reads as 2 sources", countSources(safespark), 2);
expect(
  "and the whole-journey count agrees with the single-round count",
  countSourcesAcross([safespark]),
  countSources(safespark),
);
expect(
  "and the listed URLs match the count",
  sourceUrls(safespark).length,
  countSources(safespark),
);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
