# BRAINS AI — Agents Architecture & Wiring

> Generated 2026-08-28 — covers `BRAINS-2` `main` @ `2275c68`. Single source of truth for all 18 agents, pipeline, data, and UI wiring. Update when `promptVersion` or `orchestrator.ts` changes.

---

## 1. Principles

- **Every judgment is an agent** (`src/lib/agents/types.ts:11`). No hardcoded scoring, no heuristics in API routes. Frontend talks to **one pipeline API** (`orchestrator.ts:30`), so any agent can be swapped for a fine-tuned SLM later (`agents now, SLMs later` PRD §6, §10).
- **Contract:** `AgentDefinition<TInput,TOutput>` (`types.ts:11`) — `name` (log partition), `promptVersion` (training corpus key), `outputSchema` (zod → JSON Schema), `system` + `buildMessages()`, `temperature`/`maxTokens`. All outputs are `stripEmDashes()`'d (`runtime.ts:89`).
- **Audit:** Every `runAgent()` logs `promptVersion`, `inputJson`, `outputJson`, `model`, `provider`, `latencyMs`, `error` to `brains.agent_run_logs` (`runtime.ts:64`, `schema.ts:550`) — append-only, trains SLMs later.
- **Never fabricate** — research `VOICE` + `research.ts:130` hard rules: every claim must trace to `source_url` in `searchResults`; `orchestrator.ts:362` audit drops untraceable claims.

---

## 2. LLM & Search Layer

**Provider switch** (`src/lib/llm/index.ts:20`):
- `LLM_PROVIDER=groq` → `groq` `openai/gpt-oss-120b` (default, free, `json_schema` strict) — `groq.ts:80`
- `LLM_PROVIDER=gemini` (+ `GEMINI_API_KEY` comma-list) → `gemini` `gemini-3.6-flash` with **key rotation + 429 retry** (`gemini.ts:29` `getGeminiKeys()` → `nextKey()` → `isQuotaError()`), fallback to Groq (`withGroqFallback:41`)
- `LLM_PROVIDER=anthropic` → `claude-sonnet-5`

`withRateLimitRetry()` (`groq.ts:53`) honors `retry-after` header, 4 attempts, exponential backoff.

**Search** (`src/lib/llm/index.ts:59`):
- `SEARCH_PROVIDER=groq` → `groq/compound-mini` (agentic, real `executed_tools[].output` → `Title/URL/Content` blocks `parseSearchOutput:196`) — `createGroqSearchProvider:214`
- `SEARCH_PROVIDER=gemini` → `gemini-3.6-flash` + `google_search` grounding tool → `groundingChunks` + `groundingSupports` → URLs/snippets (`gemini.ts:100`, `parseGroundedResults:146` snippet `0,2000`, `maxOutputTokens 1200`)
- Fallback: `withGroqSearchFallback:75` — if gemini <8 results, merges Groq results deduped. `unsourced` flag when `dedupe=0` (`orchestrator.ts:411`).

---

## 3. Data Model (PRD §7, `src/lib/db/schema.ts:60`)

- `brains` schema isolated from `public`
- `users` (Clerk `clerkId`), `ideas` (founder `user_id`, `share_token`), `idea_state_versions` **append-only** (`parent_version_id`, `stateJson: IdeaState`), `research_reports`, `validation_responses` (unified pool, `track`/`channel`/`review_status`), `experts`, `fast_track_orders`/`fast_track_interviews`, `pricing_config`, `decision_gates`, `agent_run_logs`
- `IdeaState` (`src/lib/domain/types.ts:…`): `raw_submission` → `structured` (`problem_statement`, `icp`, `value_prop`, `niche_tier`) → `research_report` → `validation` (`questionnaire`, `communities`, `responses`, `pricing_intelligence`, `synthesis_summary`, `verbatim_quotes`) → `decision_gate`

**Projection seam** (`src/lib/studio/projection.ts:210` `projectWorkspace()`): Engine → UI `FullWorkspaceData` (`src/lib/domain/empirical-types.ts:131`): `meta` + `respondents` (aliases, `avatarFor()`, `inferDecisionMaker()`), `quotes` (`splitQuotes` + `agentQuotesByResponse` + `categoriseQuote`), `competitors` (direct tools + workarounds), `hypotheses` (status/confidence), `socialMentions` (Reddit/HN/X). Never fabricates, never leaks PII.

---

## 4. Agent Catalog (18 agents, `src/lib/agents/catalog/`)

| # | Agent | File | `name` / `promptVersion` | Input | Output (zod) | Purpose | UI Wired |
|---|-------|------|--------------------------|-------|--------------|---------|----------|
| 1 | **Product-Context** | `product-context.ts` | `product_context` `1.0` | `url`, `pageText` (fetched via `fetchPageText:70` UA + head/body 8k) | `summary`, `category` | Turns founder's `product_link` into one-line context for extraction | Studio `OverviewTab` meta |
| 2 | **Extraction** | `extraction.ts:45` | `extraction` `1.0.0` `temp 0.2` | `description`, `targetAudience`, `stage`, `productContext`, `attachments` | `title` (≤6w), `problem_statement` (user terms), `icp` (narrow), `value_prop`, `niche` + `niche_tier` (`general_consumer`/`vertical_b2b`/`highly_specialized`) + reasoning | Normalises free-text into pipeline fields; `niche_tier` drives pricing (`pricing_config`) | Studio header, `DashboardTopBar` |
| 3 | **Research & Strengthening** | `research.ts:121` `4.0.0` `7000 tokens` | `problemStatement`, `icp`, `valueProp`, `searchResults[0..64]` (+ `evidence` loop) | `problem_strength` (`weak`/`moderate`/`strong`) + reasoning, `competitors[]`, `evidence[]` (claim+`source_url`), `current_workarounds[]`, `contrary_evidence[]`, `open_questions[]`, `community_signals[]` (3-8 verbatim, `platform`+`theme`), `proposed_changes[]` (patches), `sources_searched`, `intent_breakdown` (8 intents), `notable_findings[]` (with `intent_tags`), `contradictions_flagged[]` | **Core research** — 8-intent taxonomy (pain, workaround, switching, feature, churn, price, praise, advice), 6-step synthesis, Tier 1 (9) + Tier 2 (12) + Tier 3 (5) search. Every claim must trace to `source_url` in `searchResults`; paraphrase only (≤10w quote). Gate: Tier1 all + Tier2 ≥10 across ≥3 tables + Tier3 ≥5 sub-communities. `unsourced` when `dedupe=0` → now **skipped** (`orchestrator.ts:342` returns `weak` empty report, no agent call) | Studio `EvidenceTab` (quotes), `CompetitorTab`, `OverviewTab` `problem_strength`, `proposed_changes` (ResearchView) |
| 4 | **Signal-Scan** | `signal-scan.ts:44` | `signal_scanning` `1.0.0` `3k` | `problemStatement`, `icp`, `searchResults[0..20]` | `communities[4-8]` (real `url`+`why_relevant`+`example_thread_url`), `script` (Mom-Test, 5 steps) | Finds where ICP gathers + interview script | `SocialScanTab` communities, `FastTrackModal` script |
| 5 | **Questionnaire** | `questionnaire.ts` | `questionnaire` `1.0` | `problemStatement`, `icp`, `valueProp`, `problemStrength`, `evidenceThemes[0..6]` | `intro`, `questions[]` (`open`/`confirmation`/`scale`, `id`, `text`, `why_it_matters`) | Generates unbiased past-behavior questions from research | `Validation` `questionnaire` → `/q/[token]` public form |
| 6 | **Synthesis** | `synthesis.ts` | `validation_synthesis` | `problemStatement`, `responses[{confirmed, notes, source, channel}]` | `themes[]`, `objections[]`, `narrative`, `notable_points[]` | Reusable "what did people say" read of pool | `EvidenceTab` themes, `OverviewTab` narrative |
| 7 | **Decision-Gate** | `decision-gate.ts` | `decision_gate` | `problemStatement`, `icp`, `confirmationRate`, `totalResponses`, `channelMix`, `sourceCount`, `expertResponses`, `synthesis`, `researchStrength` | `score` (0-100), `reasoning`, `risk_factors[]`, `diagnostic`, `improvement_proposal[]` (patches) | Judgment layer on synthesis. Threshold enforced in orchestrator (`confirmationRate >= GO_AHEAD_THRESHOLD (PRD §4.4) → go_ahead else rethink`, `score` clamped). Adds `Small sample size` risk if `< MIN_RESPONSES` | Studio `SimulatorTab` / `DecisionGate` view, `gate_review` status |
| 8 | **Hypothesis** | `hypothesis.ts` | `hypothesis_generation` | `problemStatement`, `icp`, `valueProp`, `problemStrength`, `evidence[]`, `contrary[]`, `competitors[]`, `workarounds[]`, `communityQuotes[]` | `hypotheses[]` (`statement`, `category`, `testable_expectation`) | Seeds bets from research (`basis: research`, `status: Testing`) | `HypothesisTab` |
| 9 | **Hypothesis-Evaluation** | `hypothesis.ts` (2nd) | `hypothesis_evaluation` | `hypotheses[]`, `confirmationRate`, `responses[]`, `synthesis` | `evaluations[]` (`status` `Validated`/`Disproven` etc., `confidence`, `supporting`, `counter`, `takeaway`) | Re-judges every hypothesis at gate | `HypothesisTab` takeaways |
| 10 | **Pricing-Intelligence** | `pricing-intelligence.ts:…` | `pricing_intelligence` | `problemStatement`, `icp`, `valueProp`, `niche`/`niche_tier`, `competitorPrices[]` (`moneySnippets` from research), `costSignals[]`, `statedBudgets[]` (`budgetSnippets`) | `model` (`anchored`/`anchor_missing`), `wtp_point`, `wtp_range`, `confidence`, `anchors[]` | Hungry for money anchors; `anchor_missing` → UI shows "no grounded estimate", never guesses | `SimulatorTab` WTP, `OverviewTab` `willingnessToPayAvg` |
| 11 | **Response-Quality** | `response-quality.ts` | `response_quality` | `response.notes`, `answersJson`, `question` | `reviewStatus` (`pending`/`approved`/`rejected`), `qualityFlags[]`, `qualityReasoning`, `confidence`, `icpFit`, `wtpEstimate` | Screens pool; `pending` excluded from score, never deleted | `validation.responses` quality badge, `sampleQualityScore` |
| 12 | **Respondent-Profile** | `respondent-profile.ts` | `respondent_profile` | `notes` + `answersJson` | `RespondentProfile` (`company_size`, `industry`, `decision_maker`, `current_tools[]`, `display_name`) + `initialOf` | Extracts professional descriptors for projection | `AudienceTab` respondents |
| 13 | **Quote-Extraction** | `quote-extraction.ts` | `quote_extraction` `v2` | `response.notes` per pool row | `VerbatimQuote[]` (`text`, `category`, `why_it_matters`, `question_id`) — `feedback vs questions`, highly-correlated pain only, 0-2 per response, Jaccard echo filter, bare confirmation filter | Turns prose into `verbatim_quotes` | `EvidenceTab` `quotes` (pain-ranked) |
| 14 | **Post-Drafting** | `post-drafting.ts` | `post_drafting` | `problemStatement`, `icp`, `communities[0..4]` | `drafts[]` (`community`, `community_url`, `title`, `draft_text`, `rationale`) | Drafts only, never posts (PRD §4.3.3) | `SocialScanTab` drafted_posts |
| 15 | **Comment-Drafting** | `comment-drafting.ts` | `comment_drafting` | `threads[0..4]` (`community`, `url`, `title`, `snippet`) | `drafts[]` (`thread_url`, `draft_text`) | Thread-tailored replies | `SocialScanTab` drafted_comments |
| 16 | **Monitor** | `monitor.ts` | `monitor` | `problemStatement`, `community`, `threadUrl`, `searchResults` | `report` (is there new reply? worth revisiting?) — honest: reads *search* about thread, not thread itself, never invents replies | Check back on posted space | `checkTrackedSpace()` |
| 17 | **Copilot** | `copilot.ts` | `copilot` | `question`, `context` (workspace meta+quotes) | `answer` + `citations[]` | Studio chat bubble, grounded in workspace | `CopilotChatBubble.tsx` |
| 18 | **Teaser** | `teaser.ts` | `teaser` | `problemStatement`, `icp`, `valueProp` | `headline`, `body`, `cta` | Public `/research/[token]` teaser (light Tier1, 3 findings, no score) | `web` landing |

**Voice** (`voice.ts`) — shared system prefix for all agents (tone, no em dashes, founder-to-founder).

---

## 5. Pipeline Wiring (Orchestrator)

**Entry** `POST /api/validate-idea` (`validate-idea/route.ts:30`) — maps composer `ideaTitle/targetIcp/coreProblem/targetPrice` → `raw_submission.description` → `createIdea()` → `runResearchPipeline()`.

**`runResearchPipeline:153` (steps 6.0-6.2 + hypotheses):**
1. **6.0 Product-Context** (`link`? `fetchPageText:70` UA + head( title+description+og) + body 8k, floor 60) → `productContextAgent`
2. **6.1 Extraction** → `extractionAgent` → `structured` + `title`
3. **6.2 Research**
   - Query planning 4-6 framings (clinical, frustrated `I hate`, ICP vocab, competitor)
   - **Tier 1** `10` queries (reddit×2, HN, X, G2, Capterra, PH, AppStore, Play, general) + **Tier 2** `12/10` across ≥3 tables (TrustRadius, AltTo, IndieHackers, Quora, LinkedIn, StackOverflow, GitHub, TrustPilot, Amazon, SaaSworthy...) + **Tier 3** `5` discovery — `search.search()` batches of 2, `dedupeByUrl`, `diversifySearchResults:938` (community → pricing → other, `0,48`)
   - **If `dedupe=0` → skip agent, set `unsourced:true` weak empty report** (`orchestrator.ts:342` — no simulation)
   - Else `researchAgent` → audit `validUrls` → `research_report`
4. **Hypotheses** (`hypothesisAgent`) → `status Testing`, `basis research` (keeps `feedback` ones)

**`runSignalScan:468`** — `getSearch()` 4 community queries → `signalScanAgent` → `validation.communities` + `script` → auto `runQuestionnaire:762` (needs research).

**`runDecisionGate:535`** — needs `responses.length>0`:
- `synthesisAgent` → `themes/objections/narrative`
- `hypothesisEvaluationAgent` per hypothesis
- `pricingIntelligenceAgent` (anchors from `moneySnippets` + `budgetSnippets`)
- `decisionGateAgent` → `score` + `signal` (enforced `confirmationRate >= 0.6` → `go_ahead`), `riskFactors` (+ small-sample warning)

**Other orchestrator entrypoints:** `runPostDrafting:809`, `runCommentDrafting:863`, `checkTrackedSpace:972`, `runQuestionnaire:762`.

**Explicit simulation:** `POST /api/simulate` (`simulate/route.ts:33`) + `simulation-data.ts` — user-triggered, generates `FullWorkspaceData` with `isSimulation:true`, `SIMULATED` badges in `EvidenceTab`/`CompetitorTab`/`AudienceTab`/`OverviewTab`. **Not used as fallback.**

**Mapping to new app:** `projection.ts:210` → `StudioApp` tabs: `Home` (sprints), `Decision` (`decision_gate`), `ICP Responses` (`respondents`), `What they said` (`quotes` verbatims), `Alternatives` (`competitors`+`workarounds`), `Assumptions` (`hypotheses`), `Community` (`socialMentions`), `Pricing` (`pricing_intelligence`).

---

## 6. How to Improve Results

**Research quality (biggest lever):**
- Increase `GROQ_SEARCH_MODEL` from `compound-mini` to `compound` (or `SEARCH_PROVIDER=gemini` with grounding) for richer `groundingSupports` — today `maxOutputTokens 1200` + snippet `2000` already boosted verbatim.
- Add `GEMINI_API_KEYS` rotation (now supports comma-list `src/lib/llm/gemini.ts:29`) — add 2-3 keys from different projects.
- Expand Tier 2 coverage: add `site:peerSpot.com`, `site:gartner.com` already there, but add `slack.com`, `discord.com` discovery.

**Pipeline:**
- Add `response-quality` pre-filter before synthesis (already `reviewStatus !== pending` excluded, but `sampleQualityScore` could gate).
- Add `quote-extraction` dedup across rounds (already `verbatim_quotes` per `response_id`).
- Make `decision_gate` threshold per `niche_tier` (highly_specialized needs fewer confirms).

**UI:**
- Show `unsourced` banner when `research_report.unsourced` (no live sources) — offer "Run Simulation (Preview)" vs "Retry with broader ICP".
- `EvidenceTab` already `SIMULATED` badges — ensure `isSimulation` propagates to `SocialScanTab` too.

