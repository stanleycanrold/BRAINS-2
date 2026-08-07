import {
  computeConfirmationRate,
  stageForStatus,
  type IdeaState,
  type IdeaStatus,
  type PipelineStage,
} from "@/lib/domain/types";
import { countSources } from "@/lib/domain/research-sources";
import { approvedOnly, awaitingReview } from "@/lib/domain/response-visibility";
import { validationStage } from "@/lib/validation-stage";

/**
 * Where a workspace stands, in one computation.
 *
 * The dashboard card and the workspace overview were both answering "how far
 * along is this?" from the raw state, in their own way, and neither answered
 * the question a founder actually opens the app with: has anything come back
 * since I last looked? A status badge reading "Validating" says nothing about
 * whether eleven people have replied or nobody has.
 *
 * One function so the two surfaces cannot tell different stories about the
 * same idea, and so a third surface gets it for free.
 */

export type WorkspaceStat = { label: string; value: string };

export type WorkspaceSummary = {
  stage: PipelineStage;
  /** One sentence: what has happened, not what the status enum is called. */
  headline: string;
  /** The numbers worth seeing without opening anything. */
  stats: WorkspaceStat[];
  /**
   * Something waiting on the founder or on us, or null. Deliberately at most
   * one - a list of three things needing attention is a list nobody reads.
   */
  attention: { text: string; tone: "brand" | "caution" } | null;
};

export function summariseWorkspace(
  status: IdeaStatus,
  state: IdeaState,
): WorkspaceSummary {
  // Approved only, throughout. Every number a founder is shown is over the
  // responses a founder can see. See lib/domain/response-visibility.
  const responses = approvedOnly(state.validation.responses);
  const pending = awaitingReview(state.validation.responses).length;
  const confirmed = responses.filter((r) => r.confirmed === "yes").length;
  const rate = computeConfirmationRate(state.validation.responses);

  const research = state.research_report;
  const gate = state.decision_gate;
  const questions = state.validation.questionnaire.questions.length;
  const round = validationStage(state);

  const stats: WorkspaceStat[] = [];
  if (research) {
    // Distinct URLs, from the one definition. This used to add up evidence
    // items and competitor entries, which counted four claims drawn from one
    // page as four sources - and disagreed with the shared report, which was
    // counting evidence alone and reaching zero on the same run.
    stats.push({ label: "Sources read", value: String(countSources(research)) });
  }
  if (questions > 0) {
    stats.push({ label: "Questions asked", value: String(questions) });
  }
  if (responses.length > 0) {
    stats.push({ label: "Responses in", value: String(responses.length) });
    stats.push({
      label: "Confirmed",
      value: `${Math.round(rate * 100)}%`,
    });
  }
  if (gate?.signal) {
    stats.push({ label: "Score", value: `${gate.score} / 100` });
  }

  return {
    stage: stageForStatus(status),
    headline: headlineFor(status, {
      responseCount: responses.length,
      confirmed,
      counted: responses.length,
      hasResearch: research != null,
      hasQuestions: questions > 0,
      round,
      score: gate?.signal ? gate.score : null,
    }),
    stats,
    /**
     * More responses are in the pipeline than the founder can see, or a
     * result is waiting to be read.
     *
     * The pending line says a number is coming, not what is in it. Responses
     * under review are not shown, do not count and are not described - but
     * staying silent about them would be its own kind of dishonest, because a
     * founder who knows they sent the link to twelve people and sees nine is
     * owed an explanation that is not "some of your answers vanished".
     */
    attention:
      pending > 0
        ? {
            text: `${pending} more ${pending === 1 ? "response is" : "responses are"} with our reviewers. ${pending === 1 ? "It joins" : "They join"} your results once checked.`,
            tone: "caution",
          }
        : status === "gate_review"
          ? { text: "Your score is ready to read", tone: "brand" }
          : null,
  };
}

function headlineFor(
  status: IdeaStatus,
  facts: {
    responseCount: number;
    confirmed: number;
    counted: number;
    hasResearch: boolean;
    hasQuestions: boolean;
    round: ReturnType<typeof validationStage>;
    score: number | null;
  },
): string {
  const { responseCount, confirmed, counted, score } = facts;

  switch (status) {
    case "draft":
      return facts.hasResearch
        ? "Research is in. Nothing has been asked of anyone yet."
        : "Written down, not yet researched.";
    case "researching":
      return "Reading what the market already says about this.";
    case "validating_normal":
    case "validating_fast":
      if (responseCount === 0) {
        return facts.hasQuestions
          ? facts.round === "underway"
            ? "Your questions are out with the people we sourced. Nothing back yet."
            : "Your questions are ready to send. Nothing back yet."
          : "Working out what to ask, and who to ask.";
      }
      return `${responseCount} ${responseCount === 1 ? "person has" : "people have"} answered${counted > 0 ? `, ${confirmed} of them confirming the problem` : ""}.`;
    case "gate_review":
      return score != null
        ? `Scored ${score} out of 100 on ${responseCount} ${responseCount === 1 ? "response" : "responses"}.`
        : "Everything is in. The verdict is being worked out.";
    case "needs_rework":
      return "The last round said rethink. A new round starts from what it found.";
    case "passed":
      return score != null
        ? `Validated at ${score} out of 100.`
        : "Validated.";
    case "killed":
      return "Archived. Everything learned is still here.";
  }
}
