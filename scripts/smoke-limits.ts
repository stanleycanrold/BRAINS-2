/** What the entry composer will and will not accept. */
import {
  describeIdeaProblem,
  MIN_IDEA,
  MAX_IDEA,
} from "../src/lib/domain/limits";

let failures = 0;
function expect(label: string, input: string, shouldAccept: boolean) {
  const problem = describeIdeaProblem(input);
  const accepted = problem === null;
  const ok = accepted === shouldAccept;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${accepted ? "accepts" : "rejects"}  ${label}`,
  );
}

console.log("\nIdea input limits\n");
expect("nothing typed", "", false);
expect("too short", "an app for dogs", false);
expect("60 chars, all one word", "a".repeat(60), false);
expect("60 chars of junk words", "aaa ".repeat(15), false);
expect(
  "a real description",
  "We are building a tool for freelance designers who lose hours chasing unpaid invoices every month.",
  true,
);
expect("exactly at the minimum", "b".repeat(MIN_IDEA - 20) + " one two three four five six seven eight", true);
expect("over the maximum", "word ".repeat(MAX_IDEA), false);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
