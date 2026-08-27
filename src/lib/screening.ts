import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { runAgent } from "@/lib/agents/runtime";
import { responseQualityAgent } from "@/lib/agents/catalog";
import { ideaStateSchema } from "@/lib/domain/types";
import { syncResponsesToState } from "@/lib/data/responses";

/**
 * Screens a submitted response for quality.
 *
 * Runs AFTER the response is stored, never before. A respondent is doing the
 * founder a favour and must not sit waiting on a model call, and a screening
 * outage must never cost us an answer somebody took the time to write. So the
 * response lands as `pending` and this upgrades it in place.
 *
 * A failure here leaves the response pending, which is the safe direction: it
 * shows up in the review queue for a human instead of silently counting or
 * silently vanishing.
 */
export async function screenResponse(params: {
  responseId: string;
  versionId: string;
}): Promise<void> {
  try {
    const [response] = await db
      .select()
      .from(schema.validationResponses)
      .where(eq(schema.validationResponses.id, params.responseId))
      .limit(1);

    if (!response) return;

    const [version] = await db
      .select()
      .from(schema.ideaStateVersions)
      .where(eq(schema.ideaStateVersions.id, params.versionId))
      .limit(1);

    if (!version) return;

    const state = ideaStateSchema.parse(version.stateJson);

    // Compared against what is already in the pool, so a response that simply
    // repeats an earlier one gets caught.
    const existing = state.validation.responses
      .filter((r) => r.id !== params.responseId && r.notes)
      .map((r) => r.notes);

    const profile = response.respondentProfile ?? {};
    const profileLines = [
      response.respondentCareer
        ? `Role: ${response.respondentCareer}`
        : "",
      response.respondentLocation
        ? `Location: ${response.respondentLocation}`
        : "",
      profile.company_size ? `Company size: ${profile.company_size}` : "",
      profile.industry ? `Industry: ${profile.industry}` : "",
      profile.decision_maker != null
        ? `Purchase decisions: ${profile.decision_maker ? "decides or influences" : "does not decide"}`
        : "",
      profile.current_tools?.length
        ? `Tools today: ${profile.current_tools.join(", ")}`
        : "",
    ].filter(Boolean);

    const verdict = await runAgent(
      responseQualityAgent,
      {
        problemStatement: state.structured.problem_statement,
        icp: state.structured.icp,
        questionText: state.validation.questionnaire.questions
          .map((q) => q.text)
          .join(" / "),
        answer: response.notes,
        confirmed: response.confirmed,
        existingAnswers: existing,
        respondentProfile: profileLines.join("\n"),
      },
      { ideaStateVersionId: params.versionId },
    );

    // `review` stays pending: the agent is explicitly not the final say, and
    // an uncertain verdict belongs in front of a person.
    const status =
      verdict.verdict === "accept"
        ? "approved"
        : verdict.verdict === "reject"
          ? "rejected"
          : "pending";

    await db
      .update(schema.validationResponses)
      .set({
        reviewStatus: status,
        qualityFlags: verdict.flags,
        qualityReasoning: verdict.reasoning,
        qualityConfidence: verdict.confidence,
        icpFit: verdict.icp_fit,
        icpFitReasoning: verdict.icp_fit_reasoning,
      })
      .where(eq(schema.validationResponses.id, params.responseId));

    // The verdict changes what counts, so idea-state has to be rebuilt from
    // the table rather than left holding the pre-screening copy.
    await syncResponsesToState(params.versionId);
  } catch (err) {
    // Left pending on purpose - see the note above.
    console.error(`[screening] ${params.responseId} failed`, err);
  }
}
