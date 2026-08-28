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
  monitorAgent,
  hypothesisAgent,
  hypothesisEvaluationAgent,
  pricingIntelligenceAgent,
} from "./catalog";
import { budgetSnippets, moneySnippets } from "@/lib/pricing-anchors";
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

type PageFetch =
  | { ok: true; text: string }
  | { ok: false; reason: string };

/** Pulls one attribute out of a meta tag, whichever order the attrs are in. */
function metaContent(html: string, key: string): string {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`,
    "i",
  );
  const tag = html.match(pattern)?.[0];
  return tag?.match(/content=["']([^"']*)["']/i)?.[1]?.trim() ?? "";
}

/**
 * Fetches a product page for the Product Context Agent (PRD §6.0).
 *
 * Returns a reason on failure rather than null. The previous version swallowed
 * every error and returned nothing, so a link that could not be read was
 * indistinguishable from no link at all - the founder was told nothing and we
 * logged nothing, which is exactly the shape of bug that gets reported as "it
 * just doesn't work".
 *
 * The head is read separately from the body, and that is the substantive fix.
 * Stripping tags from a modern JavaScript-rendered page yields an empty shell:
 * the old 120-character floor rejected most React and Next sites, which is
 * most product sites. Title, description and Open Graph tags are in the served
 * HTML whatever the framework, and for a landing page they are usually the
 * clearest statement of what the product is on the whole page.
 */
async function fetchPageText(url: string): Promise<PageFetch> {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  let response: Response;
  try {
    response = await fetch(normalized, {
      headers: {
        // A real browser UA. Some hosts serve a challenge page or a 403 to
        // anything self-identifying as a bot, and we are reading a page the
        // founder owns and pointed us at.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "TimeoutError"
        ? "The site took too long to respond."
        : "We couldn't reach that address.";
    console.warn(`[product-context] fetch failed for ${normalized}:`, err);
    return { ok: false, reason };
  }

  if (!response.ok) {
    console.warn(
      `[product-context] ${normalized} returned ${response.status}`,
    );
    return {
      ok: false,
      reason:
        response.status === 403 || response.status === 401
          ? "The site blocked our request."
          : `The site returned an error (${response.status}).`,
    };
  }

  const html = await response.text();

  const head = [
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "",
    metaContent(html, "description"),
    metaContent(html, "og:title"),
    metaContent(html, "og:description"),
  ]
    .filter(Boolean)
    .join("\n");

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  const text = [head, body].filter(Boolean).join("\n\n").slice(0, 8000);

  // Only reject when there is genuinely nothing. With the head included this
  // now trips for pages that really are empty rather than for pages that
  // simply render client-side.
  if (text.length < 60) {
    console.warn(`[product-context] ${normalized} yielded no readable text`);
    return {
      ok: false,
      reason:
        "We reached the page but found no readable text on it. It may render entirely in the browser.",
    };
  }

  return { ok: true, text };
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
    const page = await fetchPageText(link);

    if (!page.ok) {
      // Recorded, not swallowed. A failed fetch is still not an error state -
      // the run continues and the UI falls back to manual entry - but the
      // founder is told, because otherwise the product context is quietly
      // missing from everything downstream and nothing says why.
      state = await updateCurrentState(versionId, (s) => ({
        ...s,
        structured: {
          ...s.structured,
          existing_product_context: {
            ...s.structured.existing_product_context,
            fetch_succeeded: false,
            fetch_note: page.reason,
          },
        },
      }));
    } else {
      try {
        const context = await runAgent(
          productContextAgent,
          { url: link, pageText: page.text },
          ctx,
        );
        state = await updateCurrentState(versionId, (s) => ({
          ...s,
          structured: {
            ...s.structured,
            existing_product_context: {
              ...context,
              fetch_succeeded: true,
              fetch_note: "",
              user_confirmed: false,
            },
          },
        }));
      } catch (err) {
        console.error("[orchestrator] product context failed", err);
        state = await updateCurrentState(versionId, (s) => ({
          ...s,
          structured: {
            ...s.structured,
            existing_product_context: {
              ...s.structured.existing_product_context,
              fetch_succeeded: false,
              fetch_note: "We read the page but couldn't make sense of it.",
            },
          },
        }));
      }
    }
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

  // ── 6.2 Research & Strengthening Agent — PRD Deep-Dive §5 + §15 ───────────────
  // Thorough, not just "more queries": Tier 1 every source, Tier 2 ≥10 across
  // ≥3 category tables, Tier 3 discovery ≥5 sub-communities, 4-6 distinct
  // query framings. Intensity is in sources checked, not findings padded.
  const search = getSearch();
  const where = state.raw_submission.location_focus
    ? ` ${state.raw_submission.location_focus}`
    : "";

  // Step 1: Query planning — 4-6 distinct framings (clinical, frustrated-user, ICP vocab, competitor)
  const baseQueries = [
    `${extraction.problem_statement}${where}`, // clinical
    `I hate that ${extraction.problem_statement.toLowerCase()} OR "doesn't do" OR "wish it did" OR frustrated${where}`, // frustrated-user register
    `"${extraction.icp}" ${extraction.problem_statement}${where}`, // ICP vocabulary
    `${extraction.niche} ${extraction.value_prop} competitors alternatives${where}`, // category/competitor
  ];
  // Keep 4-6, but add one more if value prop is distinct from problem
  if (extraction.value_prop && !extraction.problem_statement.toLowerCase().includes(extraction.value_prop.toLowerCase().slice(0, 12))) {
    baseQueries.push(`${extraction.value_prop} for ${extraction.icp}${where}`);
  }

  // Step 2: Source-targeted search — Tier 1 always, Tier 2 ≥10 across ≥3 tables, Tier 3 discovery
  // Tier 1: 9 platforms — one query per platform minimum
  const tier1Queries = [
    `site:reddit.com ${baseQueries[0]}`,
    `site:reddit.com "${extraction.icp}" ${extraction.niche} complaints OR workaround`,
    `site:news.ycombinator.com ${extraction.problem_statement}`,
    `site:twitter.com OR site:x.com ${extraction.problem_statement} frustrated OR switching`,
    `site:g2.com ${extraction.niche} reviews complaints OR "what do you dislike"`,
    `site:capterra.com ${extraction.niche} reviews`,
    `site:producthunt.com ${extraction.niche} OR ${extraction.problem_statement}`,
    `site:apps.apple.com ${extraction.niche} reviews`, // App Store
    `site:play.google.com ${extraction.niche} reviews`, // Play Store
    `${extraction.problem_statement} ${extraction.niche} reviews complaints${where}`, // general web
  ];

  // Tier 2: ≥10 across ≥3 category tables (Review, Social, Q&A, Vertical, etc.)
  const tier2Queries = [
    `site:trustradius.com ${extraction.niche} reviews`,
    `site:alternativeto.net ${extraction.niche} alternatives`,
    `site:stackshare.io ${extraction.niche} stack`,
    `site:indiehackers.com ${extraction.problem_statement} OR ${extraction.niche}`,
    `site:quora.com ${extraction.problem_statement} frustrated`,
    `site:linkedin.com ${extraction.problem_statement} ${extraction.icp}`,
    `site:stackoverflow.com ${extraction.problem_statement} workaround`,
    `site:github.com ${extraction.niche} issues OR discussions`,
    `site:trustpilot.com ${extraction.niche} reviews complaints`,
    `site:amazon.com ${extraction.niche} reviews`, // e-commerce angle if relevant
    `site:saasworthy.com OR site:crozdesk.com ${extraction.niche} reviews`,
    `site:peerSpot.com OR site:gartner.com ${extraction.niche} reviews`, // enterprise
  ];

  // Tier 3: discovery — find 5 specific sub-communities for this niche, then search them
  const tier3DiscoveryQueries = [
    `best subreddit for ${extraction.niche} ${extraction.problem_statement}`,
    `${extraction.niche} site:reddit.com`, // surfaces active subreddits
    `Stack Exchange for ${extraction.niche} OR ${extraction.problem_statement}`,
    `best community forum for ${extraction.problem_statement}`,
    `${extraction.niche} slack OR discord community`,
  ];

  const allTierQueries = [...tier1Queries, ...tier2Queries, ...tier3DiscoveryQueries];

  // Execute in batches to respect rate limits, but ensure every tier is queried
  const searchResults: { title: string; url: string; snippet: string }[] = [];
  // Tier 1 first — must all run
  for (let i = 0; i < tier1Queries.length; i += 2) {
    const batch = tier1Queries.slice(i, i + 2);
    searchResults.push(...(await Promise.all(batch.map((q) => search.search(q)))).flat());
  }
  // Tier 2 — minimum 10, but run 12 to ensure cross-category coverage
  for (let i = 0; i < 12; i += 2) {
    const batch = tier2Queries.slice(i, i + 2);
    if (batch.length === 0) break;
    searchResults.push(...(await Promise.all(batch.map((q) => search.search(q)))).flat());
  }
  // Tier 3 — discovery + 5 sub-community searches (we treat discovery results as search, then use them)
  for (let i = 0; i < tier3DiscoveryQueries.length; i += 2) {
    const batch = tier3DiscoveryQueries.slice(i, i + 2);
    searchResults.push(...(await Promise.all(batch.map((q) => search.search(q)))).flat());
  }
  // Finally, also run the 4-6 base queries generically to catch anything missed
  for (let i = 0; i < baseQueries.length; i += 2) {
    const batch = baseQueries.slice(i, i + 2);
    searchResults.push(...(await Promise.all(batch.map((q) => search.search(q)))).flat());
  }

  const deduped = dedupeByUrl(searchResults);

  const diversified = diversifySearchResults(deduped);

  const research = await runAgent(
    researchAgent,
    {
      problemStatement: extraction.problem_statement,
      icp: extraction.icp,
      valueProp: extraction.value_prop,
      existingProductContext: productContextSummary,
      locationFocus: state.raw_submission.location_focus,
      documentExcerpts: state.raw_submission.attachments.filter(
        (a) => a.excerpt,
      ),
      searchResults: diversified,
    },
    ctx,
  );

  // Source audit (§5 Step 6): every evidence/competitor/workaround claim must
  // trace to a real search result. Anything untraceable is removed, not
  // softened. We check URL presence in the diversified set.
  const validUrls = new Set(diversified.map((r) => r.url));
  const auditedEvidence = research.evidence.filter((e) => validUrls.has(e.source_url));
  const auditedCompetitors = research.competitors.filter((c) => !c.source_url || validUrls.has(c.source_url));
  const auditedWorkarounds = research.current_workarounds.filter((w) => !w.source_url || validUrls.has(w.source_url));
  const auditedContrary = research.contrary_evidence.filter((c) => !c.source_url || validUrls.has(c.source_url));
  if (auditedEvidence.length < research.evidence.length) {
    console.warn(`[research] source audit dropped ${research.evidence.length - auditedEvidence.length} untraceable evidence claims`);
  }

  state = await updateCurrentState(versionId, (s) => ({
    ...s,
    research_report: {
      problem_strength: research.problem_strength,
      problem_strength_reasoning: research.problem_strength_reasoning,
      competitors: auditedCompetitors,
      evidence: auditedEvidence,
      current_workarounds: auditedWorkarounds,
      contrary_evidence: auditedContrary,
      open_questions: research.open_questions,
      community_signals: research.community_signals,
      proposed_changes: research.proposed_changes.map((change) => ({
        id: randomUUID(),
        text: change.text,
        reasoning: change.reasoning,
        patches: change.patches,
        patch_value: change.patch_value,
        status: "pending" as const,
        edited_text: null,
      })),
      // Deep-Dive §7 extensions — traceability first
      sources_searched: research.sources_searched ?? { review_platforms: [], social_platforms: [], general_web: deduped.length > 0 },
      intent_breakdown: research.intent_breakdown ?? {
        pain_complaint: 0,
        workaround_evidence: 0,
        switching_intent: 0,
        feature_request: 0,
        churn_signal: 0,
        price_sensitivity: 0,
        satisfaction_praise: 0,
        confusion_seeking_advice: 0,
      },
      notable_findings: (research.notable_findings ?? []).map((f) => ({
        ...f,
        retrieved_at: f.retrieved_at || new Date().toISOString(),
      })),
      contradictions_flagged: research.contradictions_flagged ?? [],
      // Honesty rule: when live search returned nothing, say so rather than
      // presenting model recall as researched fact (PRD §4.2).
      unsourced: deduped.length === 0,
      generated_at: new Date().toISOString(),
    },
  }));

  // ── Hypothesis Agent ─────────────────────────────────────────────────────
  // The research report becomes the bets the validation round tests. Seeded
  // here (status Testing, basis research) and re-evaluated at the decision
  // gate once the response pool is in. A hypothesis failure here must not
  // kill the research that just succeeded.
  try {
    const generated = await runAgent(
      hypothesisAgent,
      {
        problemStatement: extraction.problem_statement,
        icp: extraction.icp,
        valueProp: extraction.value_prop,
        problemStrength: research.problem_strength,
        evidence: research.evidence.map((e) => e.claim),
        contraryEvidence: research.contrary_evidence.map((e) => e.claim),
        competitors: research.competitors.map((c) => `${c.name}: ${c.summary}`),
        workarounds: research.current_workarounds.map((w) => w.description),
        communityQuotes: research.community_signals.map((s) => s.quote),
      },
      ctx,
    );

    const now = new Date().toISOString();
    state = await updateCurrentState(versionId, (s) => ({
      ...s,
      hypotheses: [
        // Founder-added hypotheses (basis feedback) survive a re-research;
        // research-basis ones are regenerated from the fresh report.
        ...s.hypotheses.filter((h) => h.basis === "feedback"),
        ...generated.hypotheses.map((h) => ({
          id: randomUUID(),
          statement: h.statement,
          category: h.category,
          basis: "research" as const,
          status: "Testing" as const,
          confidence: 0,
          supporting: [],
          counter: [],
          takeaway: "",
          testable_expectation: h.testable_expectation,
          generated_at: now,
        })),
      ],
    }));
  } catch (err) {
    console.error("[orchestrator] hypothesis generation failed", err);
  }

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
        search.search(
          `site:producthunt.com OR site:indiehackers.com OR site:news.ycombinator.com ${state.structured.problem_statement} ${state.structured.niche}`,
        ),
        search.search(
          `site:g2.com OR site:capterra.com ${state.structured.niche} pricing alternatives`,
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

  // ── Hypothesis Evaluation Agent ────────────────────────────────────────────
  // The whole pool is in, so every standing hypothesis gets judged against it.
  // Failures here leave hypotheses as they were - the gate itself still runs.
  let evaluatedHypotheses = state.hypotheses;
  if (state.hypotheses.length > 0) {
    try {
      const evalResult = await runAgent(
        hypothesisEvaluationAgent,
        {
          problemStatement: state.structured.problem_statement,
          hypotheses: state.hypotheses.map((h) => ({
            id: h.id,
            statement: h.statement,
            category: h.category,
            testable_expectation: h.testable_expectation,
          })),
          confirmationRate,
          responseCount: responses.length,
          responses: responses.map((r) => ({
            confirmed: r.confirmed,
            channel: r.channel,
            notes: r.notes,
          })),
          synthesis: {
            themes: synthesis.themes,
            objections: synthesis.objections,
            narrative: synthesis.narrative,
          },
        },
        ctx,
      );

      const byId = new Map(evalResult.evaluations.map((e) => [e.id, e]));
      evaluatedHypotheses = state.hypotheses.map((h) => {
        const e = byId.get(h.id);
        if (!e) return h;
        return {
          ...h,
          status: e.status,
          confidence: Math.max(0, Math.min(100, Math.round(e.confidence))),
          supporting: e.supporting,
          counter: e.counter,
          takeaway: e.takeaway,
        };
      });
    } catch (err) {
      console.error("[orchestrator] hypothesis evaluation failed", err);
    }
  }

  // ── Pricing Intelligence Agent ────────────────────────────────────────────
  // Anchors only: competitor prices from research plus the money respondents
  // actually described. With none of those the agent returns anchor_missing
  // and the studio says "no grounded estimate" instead of showing a guess.
  let pricingIntelligence = state.validation.pricing_intelligence;
  try {
    // Gather every money-bearing sentence we have — evidence claims, workaround
    // costs, community quotes and raw response notes. The pricing agent is
    // deliberately hungry for anchors; a thin anchor set is surfaced as
    // anchor_missing rather than guessed.
    const researchText = [
      ...(state.research_report?.evidence.map((e) => `${e.claim} ${e.source_title} ${e.source_url}`) ?? []),
      ...(state.research_report?.competitors.map((c) => `${c.name}: ${c.summary} ${c.source_url}`) ?? []),
      ...(state.research_report?.current_workarounds.map((w) => `${w.description} ${w.why_it_persists ?? ""} ${w.source_url}`) ?? []),
      ...(state.research_report?.contrary_evidence.map((e) => e.claim) ?? []),
      ...(state.research_report?.community_signals.map((s) => `${s.quote} ${s.source_title} ${s.platform}`) ?? []),
    ];
    const responseText = responses.map((r) => r.notes).join("\n\n");
    // Separate explicit budgets (wider range) from general spend mentions
    const competitorAnchors = moneySnippets(researchText.join("\n"));
    const spendAnchors = moneySnippets(responseText);
    // If still thin, fall back to any money in report reasoning as weak anchor (still better than inventing)
    const fallbackAnchors =
      competitorAnchors.length === 0 && state.research_report?.problem_strength_reasoning
        ? moneySnippets(state.research_report.problem_strength_reasoning)
        : [];

    pricingIntelligence = {
      ...(await runAgent(
        pricingIntelligenceAgent,
        {
          problemStatement: state.structured.problem_statement,
          icp: state.structured.icp,
          valueProp: state.structured.value_prop,
          niche: state.structured.niche,
          nicheTier: state.structured.niche_tier,
          competitorPrices: [...competitorAnchors, ...fallbackAnchors],
          costSignals: spendAnchors,
          statedBudgets: budgetSnippets(responseText),
        },
        ctx,
      )),
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[orchestrator] pricing intelligence failed", err);
  }

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
    hypotheses: evaluatedHypotheses,
    validation: {
      ...s.validation,
      confirmation_rate: confirmationRate,
      forced_early_analysis: forcedEarly,
      pricing_intelligence: pricingIntelligence,
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
 * Requires a completed research pass - the questions are derived from the
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
      "Research needs to finish first - the questions are built from it.",
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
        // The generator writes open, confirmation and scale questions only -
        // the choice kinds are for the founder to add, since good options
        // come from knowing your own audience.
        questions: result.questions.map((q) => ({
          id: randomUUID(),
          options: [],
          ...q,
        })),
        generated_at: new Date().toISOString(),
      },
    },
  }));
}

/** §4.3.3 - Post drafts. Drafts only; BRAINS never posts, in any tier, ever. */
export async function runPostDrafting(params: {
  versionId: string;
  state: IdeaState;
}): Promise<IdeaState> {
  const { versionId, state } = params;
  const communities = state.validation.communities.slice(0, 4);
  if (communities.length === 0) {
    throw new Error(
      "We need to find your communities first - start a validation track.",
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
          posted_at: null,
          posted_url: "",
          last_checked_at: null,
          replies_logged: 0,
        })),
      ],
    },
  }));
}

/** §4.3.3 - Comment drafts, tailored to specific existing threads. */
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
      "We haven't found specific threads to reply to yet - start a validation track.",
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
          posted_at: null,
          posted_url: d.thread_url,
          last_checked_at: null,
          replies_logged: 0,
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

/**
 * Keep community evidence from being crowded out by repeated vendor pages.
 * Search providers are free to rank, but the research brief needs a chance to
 * inspect lived experience, workarounds, competitors, and contrary evidence.
 *
 * Expanded to recognise Product Hunt, Indie Hackers, G2/Capterra, YouTube etc
 * so pricing and alternative pages are not demoted as "other".
 */
function diversifySearchResults<T extends { url: string; title: string; snippet: string }>(
  items: T[],
): T[] {
  const isCommunity = (item: T) =>
    /(^|\.)reddit\.com$|news\.ycombinator\.com|producthunt\.com|alternativeto\.net|indiehackers\.com|youtube\.com|youtu\.be|g2\.com|capterra\.com|trustpilot\.com|forum|community|discussion/i.test(item.url) ||
    /reddit|product ?hunt|indie ?hackers|g2|capterra|youtube|trustpilot|forum|community|discussion/i.test(`${item.title} ${item.snippet}`);
  const community = items.filter(isCommunity);
  const pricing = items.filter(
    (item) => !community.includes(item) && /pricing|price|per month|\$\s?\d+|plan|tier/i.test(`${item.title} ${item.snippet} ${item.url}`),
  );
  const other = items.filter((item) => !community.includes(item) && !pricing.includes(item));
  // Prioritise lived experience, then pricing anchors (feeds WTP), then general
  return [...community, ...pricing, ...other].slice(0, 48);
}

function credibilityTier(url: string): number {
  // Lower = more credible for lived experience / pricing. Used for rerank hint, not filter.
  if (/(^|\.)reddit\.com$|news\.ycombinator\.com|indiehackers\.com/i.test(url)) return 0;
  if (/youtube\.com|youtu\.be/i.test(url)) return 1;
  if (/producthunt\.com|alternativeto\.net/i.test(url)) return 1;
  if (/g2\.com|capterra\.com|trustpilot\.com/i.test(url)) return 1;
  if (/forum|community/i.test(url)) return 1;
  return 2;
}

/**
 * Checks back on a space the founder already posted in.
 *
 * Honest about its own limits: this reads SEARCH results about the thread, not
 * the thread itself. Without platform API access we cannot see replies
 * directly, and the agent is instructed never to invent them. The reliable
 * path for capturing a reply remains the founder logging it - this exists to
 * tell them whether going back is worth the trip.
 */
export async function checkTrackedSpace(params: {
  versionId: string;
  state: IdeaState;
  draftId: string;
}): Promise<{ state: IdeaState; report: Awaited<ReturnType<typeof runMonitor>> }> {
  const { versionId, state, draftId } = params;

  // Looked up per-list so each keeps its own type; `in`-narrowing across the
  // union widens `thread_url` to something unusable.
  const post = state.social_engagement.drafted_posts.find(
    (d) => d.id === draftId,
  );
  const comment = state.social_engagement.drafted_comments.find(
    (d) => d.id === draftId,
  );

  const draft = post ?? comment;
  if (!draft) throw new Error("That post isn't in this idea.");

  const search = getSearch();
  const target: string =
    draft.posted_url || comment?.thread_url || draft.community;

  const results = dedupeByUrl(
    await search.search(
      `${target} ${state.structured.problem_statement} recent discussion replies`,
    ),
  );

  const report = await runMonitor({
    versionId,
    problemStatement: state.structured.problem_statement,
    community: draft.community,
    threadUrl: target,
    searchResults: results,
  });

  // Stamped per-list rather than through a shared helper: posts and comments
  // are different shapes, and a generic map collapses them into a union that
  // no longer satisfies either.
  const checkedAt = new Date().toISOString();

  const next = await updateCurrentState(versionId, (s) => ({
    ...s,
    social_engagement: {
      drafted_posts: s.social_engagement.drafted_posts.map((d) =>
        d.id === draftId ? { ...d, last_checked_at: checkedAt } : d,
      ),
      drafted_comments: s.social_engagement.drafted_comments.map((d) =>
        d.id === draftId ? { ...d, last_checked_at: checkedAt } : d,
      ),
    },
  }));

  return { state: next, report };
}

async function runMonitor(params: {
  versionId: string;
  problemStatement: string;
  community: string;
  threadUrl: string;
  searchResults: { title: string; url: string; snippet: string }[];
}) {
  return runAgent(
    monitorAgent,
    {
      problemStatement: params.problemStatement,
      community: params.community,
      threadUrl: params.threadUrl,
      searchResults: params.searchResults,
    },
    { ideaStateVersionId: params.versionId },
  );
}
