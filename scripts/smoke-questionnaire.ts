/**
 * Verifies the questionnaire loop and, importantly, that a public share link
 * exposes only the questions - not the idea, the research, or the score.
 *
 *   npm run smoke:questions
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { createIdea, updateCurrentState } from "../src/lib/data/ideas";
import {
  getPublicQuestionnaire,
  submitPublicResponse,
} from "../src/lib/data/questionnaire";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  const [user] = await db
    .insert(schema.users)
    .values({
      clerkId: "q_smoke_" + Date.now(),
      email: "q@smoke.local",
      name: "Q Smoke",
    })
    .returning();

  try {
    const idea = await createIdea({
      userId: user.id,
      stageAtEntry: "idea_only",
      rawSubmission: {
        description:
          "A tool that chases unpaid invoices for freelance designers automatically.",
        target_audience: "Freelance designers",
        product_link: null,
        attachments: [],
      },
    });

    const token = randomBytes(16).toString("hex");

    console.log("\n1. Publish a questionnaire");
    await db
      .update(schema.ideaStateVersions)
      .set({ shareToken: token })
      .where(eq(schema.ideaStateVersions.id, idea.versionId));

    await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      title: "Invoice chaser",
      structured: {
        ...s.structured,
        problem_statement: "SECRET_PROBLEM_STATEMENT",
        icp: "SECRET_ICP",
      },
      validation: {
        ...s.validation,
        questionnaire: {
          questions: [
            {
              id: "q1",
              text: "How do you currently chase a late invoice?",
              kind: "open" as const,
              options: [],
              intent: "current behaviour",
              required: false,
            },
            {
              id: "q2",
              text: "Do you lose meaningful time to chasing payments?",
              kind: "confirmation" as const,
              options: [],
              intent: "the scored question",
              required: true,
            },
          ],
          share_token: token,
      panel_share_token: null,
          accepting_responses: true,
          intro: "A few quick questions.",
          generated_at: new Date().toISOString(),
        },
      },
    }));

    console.log("\n2. Read it as an anonymous visitor");
    const publicView = await getPublicQuestionnaire(token);
    check("link resolves", publicView !== null);
    check("questions exposed", publicView?.questions.length === 2);
    check("idea title shown", publicView?.ideaTitle === "Invoice chaser");

    // The leak test that matters: nothing beyond questions may cross the wire.
    const serialised = JSON.stringify(publicView);
    check(
      "problem statement NOT leaked",
      !serialised.includes("SECRET_PROBLEM_STATEMENT"),
    );
    check("ICP NOT leaked", !serialised.includes("SECRET_ICP"));
    // Assert the EXACT shape rather than grepping for suspicious words: a
    // whitelist catches a field added carelessly in future, a blacklist only
    // catches the ones someone thought of today.
    const allowed = ["ideaTitle", "intro", "questions", "acceptingResponses"];
    const actual = Object.keys(publicView ?? {}).sort();
    check(
      "payload has exactly the 4 public fields",
      JSON.stringify(actual) === JSON.stringify([...allowed].sort()),
      actual.join(", "),
    );
    check(
      "no research, gate or score data anywhere in the payload",
      !/research_report|decision_gate|confirmation_rate|problem_statement/i.test(
        serialised,
      ),
    );

    console.log("\n3. Bad token is refused");
    check("unknown token rejected", (await getPublicQuestionnaire("deadbeef".repeat(4))) === null);
    check("short token rejected", (await getPublicQuestionnaire("abc")) === null);

    console.log("\n4. Submit an answer");
    const submitted = await submitPublicResponse({
      token,
      confirmed: "yes",
      source: "Anon designer",
      answers: [
        { questionId: "q1", answer: "I send three awkward emails and give up." },
      ],
    });
    check("submission accepted", submitted.ok);

    const rows = await db
      .select()
      .from(schema.validationResponses)
      .where(eq(schema.validationResponses.ideaStateVersionId, idea.versionId));
    check("landed in the unified pool", rows.length === 1);
    check("tagged as survey channel", rows[0]?.channel === "survey");
    check(
      "answer text preserved for synthesis",
      Boolean(rows[0]?.notes.includes("awkward emails")),
    );

    console.log("\n5. Closing the questionnaire stops collection");
    await updateCurrentState(idea.versionId, (s) => ({
      ...s,
      validation: {
        ...s.validation,
        questionnaire: { ...s.validation.questionnaire, accepting_responses: false },
      },
    }));
    const afterClose = await submitPublicResponse({
      token,
      confirmed: "yes",
      source: "Too late",
      answers: [{ questionId: "q1", answer: "…" }],
    });
    check("closed questionnaire refuses", !afterClose.ok, afterClose.error);
  } finally {
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    console.log("\ncleanup OK");
  }

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILED`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
