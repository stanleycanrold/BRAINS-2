/**
 * The paid round and the founder's own outreach answer on different links,
 * and the link an answer arrives on is what attributes it. This exercises
 * both against the real database.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { emptyIdeaState } from "../src/lib/domain/types";
import {
  getPublicQuestionnaire,
  submitPublicResponse,
} from "../src/lib/data/questionnaire";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  const [user] = await db
    .insert(schema.users)
    .values({
      clerkId: "links_smoke_" + Date.now(),
      email: "links@smoke.local",
      name: "Links Smoke",
    })
    .returning();

  const [idea] = await db
    .insert(schema.ideas)
    .values({ userId: user.id, title: "Link test", summary: "x" })
    .returning();

  const state = emptyIdeaState({
    ideaId: idea.id,
    stageAtEntry: "idea_only",
    rawSubmission: {
      description: "x",
      target_audience: "y",
      product_link: null,
      location_focus: "",
      attachments: [],
    },
  });
  state.title = "Link test";
  state.validation.track = "fast";
  state.validation.questionnaire = {
    questions: [
      { id: "q1", text: "Is this a problem?", kind: "confirmation", options: [], intent: "", required: true },
      { id: "q2", text: "Tell me more", kind: "open", options: [], intent: "", required: false },
    ],
    share_token: null,
    panel_share_token: null,
    accepting_responses: true,
    intro: "",
    generated_at: new Date().toISOString(),
  };

  const ownToken = randomUUID().replace(/-/g, "");
  const panelToken = randomUUID().replace(/-/g, "");
  state.validation.questionnaire.share_token = ownToken;
  state.validation.questionnaire.panel_share_token = panelToken;

  const [version] = await db
    .insert(schema.ideaStateVersions)
    .values({
      ideaId: idea.id,
      versionNumber: 1,
      status: "validating_fast",
      versionNote: "smoke",
      stateJson: state,
      shareToken: ownToken,
      panelToken,
    })
    .returning();

  await db.update(schema.ideas).set({ currentVersionId: version.id }).where(eq(schema.ideas.id, idea.id));

  console.log("\n1. Both links open the same questionnaire");
  const viaOwn = await getPublicQuestionnaire(ownToken);
  const viaPanel = await getPublicQuestionnaire(panelToken);
  check("own link resolves", viaOwn !== null);
  check("paid link resolves", viaPanel !== null);
  check(
    "same questions on both",
    JSON.stringify(viaOwn?.questions) === JSON.stringify(viaPanel?.questions),
  );
  check("neither link is the other", ownToken !== panelToken);

  console.log("\n2. The link decides how a response is counted");
  await submitPublicResponse({
    token: ownToken,
    confirmed: "yes",
    respondentName: "Test respondent",
    respondentCareer: "Product designer",
    respondentLocation: "London",
    respondentEmail: "test@example.com",
    respondentPhone: "+441234567890",
    answers: [{ questionId: "q2", answer: "From my own outreach" }],
  });
  await submitPublicResponse({
    token: panelToken,
    confirmed: "yes",
    respondentName: "Panel respondent",
    respondentCareer: "Founder",
    respondentLocation: "Manchester",
    respondentEmail: "panel@example.com",
    respondentPhone: "+441234567891",
    answers: [{ questionId: "q2", answer: "From the paid round" }],
  });

  const rows = await db
    .select()
    .from(schema.validationResponses)
    .where(eq(schema.validationResponses.ideaStateVersionId, version.id));

  const normal = rows.filter((r) => r.track === "normal");
  const fast = rows.filter((r) => r.track === "fast");
  check("own link recorded as normal", normal.length === 1, `${normal.length}`);
  check("paid link recorded as fast", fast.length === 1, `${fast.length}`);
  check(
    "paid response is labelled for the founder",
    fast[0]?.source === "Fast Track interview",
    fast[0]?.source,
  );
  check(
    "own response is labelled separately",
    normal[0]?.source === "Questionnaire link",
    normal[0]?.source,
  );

  console.log("\n3. A wrong token still opens nothing");
  check("unknown token rejected", (await getPublicQuestionnaire(randomUUID().replace(/-/g, ""))) === null);

  console.log("\n4. The public payload stays minimal");
  check(
    "exactly the four public fields",
    JSON.stringify(Object.keys(viaPanel ?? {}).sort()) ===
      JSON.stringify(["acceptingResponses", "ideaTitle", "intro", "questions"]),
    Object.keys(viaPanel ?? {}).sort().join(","),
  );

  await db.delete(schema.ideas).where(eq(schema.ideas.id, idea.id));
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  console.log("\ncleanup OK");
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
