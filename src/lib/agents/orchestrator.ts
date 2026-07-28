import "server-only";
import { randomUUID } from "node:crypto";
import { getSearch } from "@/lib/llm";
import { runAgent } from "./runtime";
import {
  extractionAgent,
  productContextAgent,
  researchAgent,
  signalScanAgent,
  synthesisAgent,
  decisionGateAgent,
  postDraftingAgent,
  commentDraftingAgent,
  questionnaireAgent,
} from "./definitions";
import { updateCurrentState } from "@/lib/data/ideas";
import {
  computeConfirmationRate,
  GO_AHEAD_THRESHOLD,
  MIN_RESPONSES,
  type IdeaState,
} from "@/lib/domain/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Orchestrator (PRD §6, orchestration note).
 *
 * The frontend talks to ONE pipeline API; this module decides which specialist
 * agent(s) to invoke based on the idea's status. The frontend never calls an
 * agent directly, which is what keeps the door open to swapping any agent for
 * a trained SLM later without touching the API contract or the UI.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Fetches a product page for the Product Context Agent (PRD §6.0). */
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const response = await fetch(normalized, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BRAINS-AI/1.0; +https://nexabrains.io)",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;

    const html = await response.text();
    // Crude but sufficient: strip scripts/styles/tags and collapse whitespace.
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch {
    return null;
  }
}

/**
 * Step 1 → 2: product context (if a link was given), extraction, then research.
 * Runs async after the record already exists, so a failure here never costs
 * the founder their submission.
 */
export async function runResearchPipeline(params: {
  versionId: string;
  state: IdeaState;
}): Promise<IdeaState> {
  const { versionId } = params;
  let state = params.state;
  const ctx = { ideaStateVersionId: versionId };

  // ── 6.0 Product Context Agent ────────────────────────────────────────────
  const link = state.raw_submission.product_link;
  if (link) {
    const pageText = await fetchPageText(link);
    if (pageText && pageText.length > 120) {
      try {
        const context = await runAgent(
          productContextAgent,
          { url: link, pageText },
          ctx,
        );
        state = await updateCurrentState(versionId, (s) => ({
          ...s,
          structured: {
            ...s.structured,
            existing_product_context: {
              ...context,
              fetch_succeeded: true,
              user_confirmed: false,
            },
          },
        }));
      } catch (err) {
        console.error("[orchestrator] product context failed", err);
      }
    }
    // A failed fetch is not an error state — the UI falls back to manual
    // entry, framed as normal (PRD §4.1, design system §4.2).
  }

  // ── 6.1 Extraction Agent ─────────────────────────────────────────────────
  const productContextSummary = state.structured.existing_product_context
    .fetch_succeeded
    ? state.structured.existing_product_context.summary
    : undefined;

  const extraction = await runAgent(
    extractionAgent,
    {
      description: state.raw_submission.description,
      targetAudience: state.raw_submission.target_audience,
      stage: state.stage_at_entry,
      productContext: productContextSummary,
      attachments: state.raw_submission.attachments
        .map((a) => a.excerpt)
        .join("\n")
        .slice(0, 2000),
    },
    ctx,
  );

  state = await updateCurrentState(versionId, (s) => ({
    ...s,
    status: "researching",
    title: extraction.title,
    structured: {
      ...s.structured,
      problem_statement: extraction.problem_statement,
      icp: extraction.icp,
      value_prop: extraction.value_prop,
      niche: extraction.niche,
      niche_tier: extraction.niche_tier,
    },
  }));

  // ── 6.2 Research & Strengthening Agent ───────────────────────────────────
  const search = getSearch();
  const queries = [
    `${extraction.problem_statement} — people describing this problem`,
    `${extraction.niche} tools competitors ${extraction.value_prop}`,
  ];

  const searchResults = (
    await Promise.all(queries.map((q) => search.search(q)))
  ).flat();

  const deduped = dedupeByUrl(searchResults);

  const research = await runAgent(
    researchAgent,
    {
      problemStatement: extraction.problem_statement,
      icp: extraction.icp,
      valueProp: extraction.value_prop,
      existingProductContext: productContextSummary,
      searchResults: deduped,
    },
    ctx,
  );

  state = await updateCurrentState(versionId, (s) => ({
    ...s,
    research_report: {
      problem_strength: research.problem_strength,
      problem_strength_reasoning: research.problem_strength_reasoning,
      competitors: research.competitors,
      evidence: research.evidence,
      proposed_changes: research.proposed_changes.map((change) => ({
        id: randomUUID(),
        text: change.text,
        reasoning: change.reasoning,
        patches: change.patches,
        patch_value: change.patch_value,
        status: "pending" as const,
        edited_text: null,
      })),
      // Honesty rule: when live search returned nothing, say so rather than
      // presenting model recall as researched fact (PRD §4.2).
      unsourced: deduped.length === 0,
      generated_at: new Date().toISOString(),
    },
  }));

  return state;
}

/** Step 3 (Normal Track start): communities + interview script. */
export async function runSignalScan(params: {
  versionId: string;
  state: IdeaState;
}): Promise<IdeaState> {
  const { versionId, state } = params;
  const ctx = { ideaStateVersionId: versionId };
  const search = getSearch();

  const results = dedupeByUrl(
    (
      await Promise.all([
        search.search(
          `online communities where ${state.structured.icp} discuss ${state.structured.problem_statement}`,
        ),
        search.search(
          `reddit forum thread ${state.structured.problem_statement}`,
        ),
      ])
    ).flat(),
  );

  const scan = await runAgent(
    signalScanAgent,
    {
      problemStatement: state.structured.problem_statement,
      icp: state.structured.icp,
      searchResults: results,
    },
    ctx,
  );

  const withCommunities = await updateCurrentState(versionId, (s) => ({
    ...s,
    validation: {
      ...s.validation,
      communities: scan.communities.map((c) => ({ id: randomUUID(), ...c })),
      script: scan.script,
    },
  }));

  // Questions come from the same research, so generate them here rather than
  // making the founder ask for them separately.
  if (withCommunities.validation.questionnaire.questions.length === 0) {
    try {
      return await runQuestionnaire({ versionId, state: withCommunities });
    } catch (err) {
      console.error("[orchestrator] questionnaire generation failed", err);
    }
  }

  return withCommunities;
}

/**
 * Step 4: synthesis then decision gate.
 *
 * Kept as two distinct agent calls rather than one (PRD §6 note): synthesis is
 * a reusable "what did people say" read of the data; the gate is a judgment
 * layered on top. Keeping them separate means the scoring rule can be tuned or
 * replaced independently of how responses get summarised.
 */
export async function runDecisionGate(params: {
  versionId: string;
  state: IdeaState;
  forcedEarly: boolean;
}): Promise<IdeaState> {
  const { versionId, state, forcedEarly } = params;
  const ctx = { ideaStateVersionId: versionId };
  const responses = state.validation.responses;

  if (responses.length === 0) {
    throw new Error("Log at least one response before running analysis.");
  }

  // ── 6.4 Validation Synthesis Agent ───────────────────────────────────────
  const synthesis = await runAgent(
    synthesisAgent,
    {
      problemStatement: state.structured.problem_statement,
      responses: responses.map((r) => ({
        confirmed: r.confirmed,
        notes: r.notes,
        source: r.source,
        channel: r.channel,
      })),
    },
    ctx,
  );

  const confirmationRate = computeConfirmationRate(responses);

  const channelMix = responses.reduce<Record<string, number>>((acc, r) => {
    acc[r.channel] = (acc[r.channel] ?? 0) + 1;
    return acc;
  }, {});

  const sourceCount = new Set(
    responses.map((r) => r.source.trim().toLowerCase()).filter(Boolean),
  ).size;

  // ── 6.7 Decision Gate Agent ──────────────────────────────────────────────
  const gate = await runAgent(
    decisionGateAgent,
    {
      problemStatement: state.structured.problem_statement,
      icp: state.structured.icp,
      confirmationRate,
      totalResponses: responses.length,
      channelMix,
      sourceCount,
      expertResponses: responses.filter((r) => r.expert_id).length,
      synthesis: {
        themes: synthesis.themes,
        objections: synthesis.objections,
        narrative: synthesis.narrative,
      },
      researchStrength: state.research_report?.problem_strength ?? null,
    },
    ctx,
  );

  // The threshold rule is the product's, not the model's. Enforce it here so a
  // model slip can never flip a founder's verdict (PRD §4.4).
  const signal =
    confirmationRate >= GO_AHEAD_THRESHOLD ? "go_ahead" : "rethink";

  const score = Math.max(0, Math.min(100, Math.round(gate.score)));

  const riskFactors = [...gate.risk_factors];
  if (responses.length < MIN_RESPONSES) {
    // Prominent callout, never fine print (design system §4.9).
    riskFactors.unshift({
      label: "Small sample size",
      detail: `${responses.length} responses is below the ${MIN_RESPONSES} we'd want before treating this as reliable${
        forcedEarly ? ", and analysis was run early at your request" : ""
      }.`,
      severity: "high",
    });
  }

  return updateCurrentState(versionId, (s) => ({
    ...s,
    status: "gate_review",
    validation: {
      ...s.validation,
      confirmation_rate: confirmationRate,
      forced_early_analysis: forcedEarly,
      synthesis_summary: {
        themes: synthesis.themes,
        notable_points: synthesis.notable_points,
        objections: synthesis.objections,
        narrative: synthesis.narrative,
      },
    },
    decision_gate: {
      score,
      signal,
      reasoning: gate.reasoning,
      risk_factors: riskFactors,
      diagnostic:
        signal === "rethink"
          ? gate.diagnostic
          : { verdict: "not_applicable", explanation: "" },
      improvement_proposal: gate.improvement_proposal.map((p) => ({
        id: randomUUID(),
        text: p.text,
        reasoning: p.reasoning,
        patches: p.patches,
        patch_value: p.patch_value,
        status: "pending" as const,
        edited_text: null,
      })),
      user_decision: null,
      kill_reason: null,
      decided_at: null,
      generated_at: new Date().toISOString(),
    },
  }));
}

/**
 * Builds the question set from the researched idea.
 *
 * Requires a completed research pass — the questions are derived from the
 * problem statement and what research actually surfaced, so generating them
 * earlier would produce a generic template, which is exactly what makes
 * customer interviews worthless.
 */
export async function runQuestionnaire(params: {
  versionId: string;
  state: IdeaState;
}): Promise<IdeaState> {
  const { versionId, state } = params;

  if (!state.research_report) {
    throw new Error(
      "Research needs to finish first — the questions are built from it.",
    );
  }

  const result = await runAgent(
    questionnaireAgent,
    {
      problemStatement: state.structured.problem_statement,
      icp: state.structured.icp,
      valueProp: state.structured.value_prop,
      problemStrength: state.research_report.problem_strength,
      evidenceThemes: state.research_report.evidence
        .map((e) => e.claim)
        .slice(0, 6),
    },
    { ideaStateVersionId: versionId },
  );

  return updateCurrentState(versionId, (s) => ({
    ...s,
    validation: {
      ...s.validation,
      questionnaire: {
        ...s.validation.questionnaire,
        intro: result.intro,
        questions: result.questions.map((q) => ({ id: randomUUID(), ...q })),
        generated_at: new Date().toISOString(),
      },
    },
  }));
}

/** §4.3.3 — Post drafts. Drafts only; BRAINS never posts, in any tier, ever. */
export async function runPostDrafting(params: {
  versionId: string;
  state: IdeaState;
}): Promise<IdeaState> {
  const { versionId, state } = params;
  const communities = state.validation.communities.slice(0, 4);
  if (communities.length === 0) {
    throw new Error(
      "We need to find your communities first — start a validation track.",
    );
  }

  const result = await runAgent(
    postDraftingAgent,
    {
      problemStatement: state.structured.problem_statement,
      icp: state.structured.icp,
      communities: communities.map((c) => ({
        name: c.name,
        platform: c.platform,
        url: c.url,
        why_relevant: c.why_relevant,
      })),
    },
    { ideaStateVersionId: versionId },
  );

  return updateCurrentState(versionId, (s) => ({
    ...s,
    social_engagement: {
      ...s.social_engagement,
      drafted_posts: [
        ...s.social_engagement.drafted_posts,
        ...result.drafts.map((d) => ({
          id: randomUUID(),
          community: d.community,
          community_url: d.community_url,
          title: d.title,
          draft_text: d.draft_text,
          rationale: d.rationale,
          status: "drafted" as const,
          edited_text: null,
          created_at: new Date().toISOString(),
        })),
      ],
    },
  }));
}

/** §4.3.3 — Comment drafts, tailored to specific existing threads. */
export async function runCommentDrafting(params: {
  versionId: string;
  state: IdeaState;
}): Promise<IdeaState> {
  const { versionId, state } = params;
  const threads = state.validation.communities
    .filter((c) => c.example_thread_url)
    .slice(0, 4);

  if (threads.length === 0) {
    throw new Error(
      "We haven't found specific threads to reply to yet — start a validation track.",
    );
  }

  const result = await runAgent(
    commentDraftingAgent,
    {
      problemStatement: state.structured.problem_statement,
      threads: threads.map((t) => ({
        community: t.name,
        url: t.example_thread_url,
        title: t.example_thread_title || t.name,
        snippet: t.why_relevant,
      })),
    },
    { ideaStateVersionId: versionId },
  );

  return updateCurrentState(versionId, (s) => ({
    ...s,
    social_engagement: {
      ...s.social_engagement,
      drafted_comments: [
        ...s.social_engagement.drafted_comments,
        ...result.drafts.map((d) => ({
          id: randomUUID(),
          community: d.community,
          community_url: "",
          thread_url: d.thread_url,
          thread_context: d.thread_context,
          title: "",
          draft_text: d.draft_text,
          rationale: d.rationale,
          status: "drafted" as const,
          edited_text: null,
          created_at: new Date().toISOString(),
        })),
      ],
    },
  }));
}

function dedupeByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
