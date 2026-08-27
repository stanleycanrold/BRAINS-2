import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { runAgent } from "@/lib/agents/runtime";
import {
  quoteExtractionAgent,
  pricingIntelligenceAgent,
  respondentProfileAgent,
} from "@/lib/agents/catalog";
import { ideaStateSchema } from "@/lib/domain/types";
import { updateCurrentState } from "@/lib/data/ideas";
import { budgetSnippets, hasMoneyAnchor, moneySnippets } from "@/lib/pricing-anchors";

/**
 * Per-response enrichment: the work that makes one new answer immediately
 * useful in the studio, run AFTER the response is safely stored.
 *
 * Same safety contract as screening - a respondent never waits on a model
 * call, and a model outage never costs an answer. Each step catches its own
 * failures; the worst case is a quote that appears later rather than never.
 */

/**
 * Pulls the verbatim quotes worth showing out of one response and adds them
 * to the round's quote pool. Re-running for a response replaces that
 * response's quotes rather than duplicating them.
 */
export async function extractResponseQuotes(params: {
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
    const answers = (response.answersJson ?? []).map((a) => ({
      question_id: a.question_id,
      question: a.question,
      answer: a.answer,
    }));

    const result = await runAgent(
      quoteExtractionAgent,
      {
        problemStatement: state.structured.problem_statement,
        icp: state.structured.icp,
        questions: state.validation.questionnaire.questions.map((q) => ({
          id: q.id,
          text: q.text,
          intent: q.intent,
        })),
        confirmed: response.confirmed,
        answers,
        notes: response.notes,
      },
      { ideaStateVersionId: params.versionId },
    );

    if (result.quotes.length === 0) return;

    // Post-extraction quality gate. The prompt (v2) already demands highly
    // correlated pain only, but models drift — this is the deterministic
    // backstop so a question echo or a bare confirmation never reaches the
    // founder's evidence feed.
    const tokens = (t: string) =>
      new Set(
        t
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 2),
      );
    const jaccard = (a: string, b: string) => {
      const setA = tokens(a);
      const setB = tokens(b);
      if (setA.size === 0 || setB.size === 0) return 0;
      const inter = [...setA].filter((w) => setB.has(w)).length;
      return inter / new Set([...setA, ...setB]).size;
    };

    // Bare confirmations carry no substance — the scored question already
    // captures agreement numerically.
    const bareConfirmation =
      /^(yes|yeah|yep|no|nope|unsure|maybe|definitely|absolutely|of course)[\s,.!]*$/i;

    // All question texts for this idea — the model must never quote these.
    const allQuestionTexts = state.validation.questionnaire.questions.map((q) => q.text);
    // Hard question pattern: respondent answers almost never read as a
    // question prompt. If the extracted "quote" looks like a question, it
    // is the question.
    const looksLikeQuestion = (s: string) =>
      /\?$/.test(s.trim()) ||
      /^(think about|how often|what|when|why|have you|do you|can you|describe|tell me|consider the last)/i.test(
        s.trim(),
      );

    const filtered = result.quotes.filter((q) => {
      const text = q.text.trim();
      // Substance floor: a quote needs words to be evidence.
      if (text.split(/\s+/).length < 8) return false;
      if (bareConfirmation.test(text)) return false;
      if (looksLikeQuestion(text)) return false;
      // Question echo against ANY question in this idea, not just the
      // attributed one — the model sometimes returns the prompt verbatim
      // with the wrong question_id or null.
      for (const qt of allQuestionTexts) {
        if (jaccard(text, qt) > 0.5) return false;
      }
      // Specific attributed question with tighter threshold
      const source = answers.find((a) => a.question_id === q.question_id);
      if (q.question_id && source && jaccard(text, source.question) > 0.6) {
        return false;
      }
      return true;
    });

    // Dedupe near-identical fragments within this response (model occasionally
    // returns two trims of the same sentence). Jaccard on tokens >0.85 is the
    // same insight twice — keep one.
    const deduped = filtered.filter((q, idx, arr) => {
      for (let j = 0; j < idx; j++) {
        if (jaccard(q.text, arr[j].text) > 0.85) return false;
      }
      return true;
    });

    if (deduped.length === 0) return;

    const now = new Date().toISOString();
    await updateCurrentState(params.versionId, (s) => ({
      ...s,
      validation: {
        ...s.validation,
        // Replace this response's quotes so a re-run never doubles them.
        verbatim_quotes: [
          ...s.validation.verbatim_quotes.filter(
            (q) => q.response_id !== params.responseId,
          ),
          ...deduped.map((q) => ({
            id: randomUUID(),
            text: q.text,
            response_id: params.responseId,
            question_id: q.question_id,
            category: q.category,
            why_it_matters: q.why_it_matters,
            created_at: now,
          })),
        ],
      },
    }));
  } catch (err) {
    console.error(`[quotes] ${params.responseId} failed`, err);
  }
}

/**
 * Fills the respondent's profile (role, size, industry, tools, purchase
 * power) from the interview transcript itself — even when the "About you"
 * form was left blank. A headteacher who says "I lead a primary school"
 * is a decision maker without being asked.
 */
export async function extractRespondentProfile(params: {
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
    const answers = (response.answersJson ?? []).map((a) => ({
      question_id: a.question_id,
      question: a.question,
      answer: a.answer,
    }));

    const explicit = response.respondentProfile ?? {};
    const result = await runAgent(
      respondentProfileAgent,
      {
        problemStatement: state.structured.problem_statement,
        icp: state.structured.icp,
        questions: state.validation.questionnaire.questions.map((q) => ({
          id: q.id,
          text: q.text,
          intent: q.intent,
        })),
        answers,
        notes: response.notes,
        explicitProfile: {
          company_size: explicit.company_size,
          industry: explicit.industry,
          decision_maker: explicit.decision_maker,
          current_tools: explicit.current_tools,
        },
        respondentCareerRaw: response.respondentCareer,
      },
      { ideaStateVersionId: params.versionId },
    );

    // Canonicalise role so "Classroom teacher" and "Teacher" are the same profile.
    const canonicalRole = (() => {
      const raw = result.role?.trim() || "";
      if (!raw) return "";
      const low = raw.toLowerCase();
      const map: Record<string, string> = {
        "headteacher": "Headteacher",
        "head teacher": "Headteacher",
        "principal": "Headteacher",
        "head of school": "Headteacher",
        "deputy head": "Headteacher",
        "assistant head": "Headteacher",
        "classroom teacher": "Teacher",
        "teacher": "Teacher",
        "class teacher": "Teacher",
        "teaching assistant": "Teaching assistant",
        "ta": "Teaching assistant",
        "learning support assistant": "Teaching assistant",
        "it manager": "IT Manager",
        "it lead": "IT Manager",
        "network manager": "IT Manager",
        "product manager": "Product Manager",
        "product lead": "Product Manager",
        "founder": "Founder",
        "co-founder": "Founder",
        "owner": "Founder",
        "director": "Director",
        "manager": "Manager",
        "commuter cyclist": "Commuter cyclist",
        "cyclist": "Commuter cyclist",
        "food delivery rider": "Food delivery rider",
        "delivery rider": "Food delivery rider",
        "delivery driver": "Food delivery rider",
      };
      return map[low] || raw;
    })();

    // Only write when we actually learned something — empty means not inferrable, not "clear it".
    const patch: Record<string, unknown> = {};
    if (canonicalRole) {
      patch["respondentCareer"] = canonicalRole;
    }
    // If the respondent gave their name in an identification answer, use it as
    // the display name — otherwise the founder just sees Respondent 01. The
    // private respondentName column is the source of truth for identity, but
    // the answer is the founder-visible consent to show it.
    if ((result as any).display_name?.trim()) {
      patch["respondentName"] = (result as any).display_name.trim();
    }
    const profilePatch: Record<string, unknown> = {};
    if (result.company_size && result.company_size.trim()) profilePatch["company_size"] = result.company_size.trim();
    if (result.industry && result.industry.trim()) profilePatch["industry"] = result.industry.trim();
    if (result.current_tools && result.current_tools.length > 0) profilePatch["current_tools"] = result.current_tools;
    // decision_maker is the axis for "Purchase Power" and the ICP summary
    profilePatch["decision_maker"] = result.decision_maker;
    if (result.icp_relevant_detail) {
      // Store the one-line why in the reasoning field so the studio can show it on hover
      await db
        .update(schema.validationResponses)
        .set({
          icpFitReasoning: result.icp_relevant_detail,
          // Keep the career/role in sync with what we inferred
          ...(patch as any),
          respondentProfile: {
            ...explicit,
            ...profilePatch,
          } as any,
        })
        .where(eq(schema.validationResponses.id, params.responseId));
    } else {
      await db
        .update(schema.validationResponses)
        .set({
          ...(patch as any),
          respondentProfile: {
            ...explicit,
            ...profilePatch,
          } as any,
        })
        .where(eq(schema.validationResponses.id, params.responseId));
    }
  } catch (err) {
    console.error(`[profile] ${params.responseId} failed`, err);
  }
}

/**
 * Empirical willingness-to-pay for ONE respondent, set only when their own
 * words carry a money anchor (a stated budget or what they currently spend).
 * Without an anchor this does nothing: 0 on the row means "not asked", and
 * the studio shows it that way.
 */
export async function updateRespondentWtp(params: {
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

    // The guard: no money in this response means nothing to estimate from,
    // so no model call happens at all.
    if (!hasMoneyAnchor(response.notes)) return;

    const [version] = await db
      .select()
      .from(schema.ideaStateVersions)
      .where(eq(schema.ideaStateVersions.id, params.versionId))
      .limit(1);
    if (!version) return;

    const state = ideaStateSchema.parse(version.stateJson);

    const result = await runAgent(
      pricingIntelligenceAgent,
      {
        problemStatement: state.structured.problem_statement,
        icp: state.structured.icp,
        valueProp: state.structured.value_prop,
        niche: state.structured.niche,
        nicheTier: state.structured.niche_tier,
        competitorPrices: [],
        costSignals: moneySnippets(response.notes),
        statedBudgets: budgetSnippets(response.notes),
      },
      { ideaStateVersionId: params.versionId },
    );

    const point = Math.round(result.wtp_point);
    if (result.model !== "anchored" || point <= 0) return;

    await db
      .update(schema.validationResponses)
      .set({ wtpEstimate: point })
      .where(eq(schema.validationResponses.id, params.responseId));
  } catch (err) {
    console.error(`[wtp] ${params.responseId} failed`, err);
  }
}
