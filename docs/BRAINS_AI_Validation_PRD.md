# BRAINS AI — Validation Engine PRD (Phase 1: Idea → Research → Validate → Decide)

**Document owner:** Stanley, Founder/CEO, BRAINS AI
**Status:** Draft v1.0 for developer handoff
**Scope of this PRD:** Entry point, research/strengthening, validation (Normal + Fast Track), Go/No-Go decision gate, rebuild loop.
**Out of scope (future PRDs):** Build phase, GTM/marketing funnels, launch/growth loop, kill/renew portfolio dashboard. This PRD's data model is designed so those phases plug in without re-architecting.

---

## 1. Purpose & Context

BRAINS AI is a workspace intelligence platform that takes a founder from "I have an idea" through validation, build, and go-to-market. This PRD covers the **first pipeline phase**: getting an idea into the system, strengthening it with research, and running it through a validation loop (community signal scanning + either self-serve interviews or a paid, BRAINS-run "Fast Track") until it either passes validation, gets reworked, or is killed.

This phase produces the **idea-state JSON record** — a single, continuously-updated object per idea that is the shared context object across all agents in this phase and later phases, and doubles as a future training dataset for BRAINS' own specialist SLMs (per the "agents now, SLMs later" strategy). Every agent in this PRD reads from and writes back to that record rather than holding its own private state.

### 1.1 Design principle: agents at every decision point
Anywhere this PRD says a judgment call, a synthesis, a go/no-go, an estimate, or a "propose changes" step happens, it is implemented as an **AI agent call**, not hardcoded logic — even in v1 where the agent is just an LLM with a tightly scoped prompt and tool access. This keeps us on the "agents now, SLMs later" path: usage data from these agent calls is what will eventually train the narrow specialist SLMs. Agents are listed explicitly in Section 6.

---

## 2. User Personas

| Persona | Description | Primary need |
|---|---|---|
| **Idea-stage founder** | Has a concept, no product built yet | Wants to know if the problem is real before spending money/time building |
| **Builder-stage founder** | Already has an app/MVP live | Wants to know if current traction/positioning is validated, or if they should pivot/kill |
| **BRAINS Ops team (internal)** | Nexabrains/BRAINS staff | Runs Fast Track interviews, manages the niche-expert pool, reviews AI-drafted validation reports before they go to the user |

---

## 3. High-Level Flow

```
┌─────────────┐   ┌──────────────┐   ┌───────────────────┐   ┌─────────────────┐   ┌────────────────┐
│ 1. ENTRY    │──▶│ 2. RESEARCH  │──▶│ 3. VALIDATION      │──▶│ 4. DECISION GATE │──▶│ 5. REBUILD LOOP│
│    POINT    │   │ & STRENGTHEN │   │ TRACK (Normal/Fast)│   │ (AI + human)     │   │ or PASS/KILL   │
└─────────────┘   └──────────────┘   └───────────────────┘   └─────────────────┘   └────────────────┘
                                                                                          │
                                                                                          ▼
                                                                              back to step 2 or 3
```

Every idea has an **idea_state** record that moves through statuses:
`draft → researching → validating_normal | validating_fast → gate_review → passed | needs_rework | killed`

---

## 4. Step-by-Step Functional Spec

### 4.1 Step 1 — Entry Point

**Goal:** Capture the idea and the founder's current stage, and persist full context immediately so nothing is lost even if the user abandons the session.

**UI:**
- Free-text field: "What are you building?" (min ~40 chars, no hard max — encourage a paragraph, not a tagline)
- Stage selector (single choice): `Idea only` / `MVP built, no users` / `Live with users`
- **The form is dynamic based on stage, not just conditionally showing extra fields:**
  - **Idea only:** no link/metrics fields shown at all — the form ends after the description and target audience. Nothing to skip past; it's simply not there.
  - **MVP built, no users** or **Live with users:** a single field appears — "Link to your product" (website URL, app store listing, or both). That's the *only* thing the user types for this part; everything else is pulled automatically (see below), not manually entered.
- Target audience free-text: "Who is this for?"
- Optional file upload: pitch deck, existing docs (stored, parsed for context — reuse `docx`/`pdf`/`pptx` parsing pipeline, not re-specified here)
- Submit → creates `idea_state` record, status = `draft`, immediately transitions to `researching`

**Auto-fill from a provided link (new — Product Context Agent, §6.0):**
- If the user is at MVP/Live stage and provides a link, a dedicated agent step fetches and reads the linked page(s) *before* asking the user anything further — website copy/features/pricing if it's a site, or app store listing (description, category, ratings, review count, recent review text) if it's an app store link.
- This auto-fetch replaces the manual "rough user count / existing metrics free-text" fields from the original design — the system infers what it can (e.g. approximate review volume as a traction proxy, star rating, recency of reviews) rather than asking the founder to type numbers they may not have handy or may not bother filling in.
- Auto-fetched context is shown back to the user as a short editable summary card ("Here's what we found — anything to correct or add?") before continuing, so it's confirmable but never a blocking data-entry chore.
- If the link can't be fetched (private page, broken link, no app store presence) the system falls back to the original manual free-text fields rather than blocking submission.
- This ties directly into diagnostic validation for builder-stage founders (§4.2) — the richer the auto-fetched context, the more the Research Agent can lean on the founder's *own* existing signal (reviews, ratings, drop-off hints) before ever going out to external communities, which is cheaper and more diagnostic than fresh outside interviews for this persona.

**Backend on submit:**
1. Create `ideas` row + `idea_state_versions` row 1 (see schema §7).
2. If a product link was provided, run the **Product Context Agent** (§6.0) synchronously (fast fetch + light extraction) before proceeding, so its output is already in `structured.existing_product_context` when the Research Agent runs.
3. Kick off async job → **Research Agent** (§6.1) — now able to use the auto-fetched product context alongside the raw submission.
4. Return idea `id` to client immediately; UI shows a "researching your idea…" loading state and polls / subscribes (websocket or polling) for the research output.

**Acceptance criteria:**
- No submission is ever lost — record is written before any agent call, so a failed agent call doesn't lose the user's input.
- User can edit their original submission later; edits create a new `idea_state_versions` row (full history retained, never overwritten).

---

### 4.2 Step 2 — Research & Idea Strengthening

**Goal:** Do a first pass of social + web research on the idea's problem space and competitive landscape, and have an agent propose concrete strengthening changes — before we spend any money on validation.

**What the agent does (Research & Strengthening Agent, §6.2):**
1. Extracts a structured problem statement + target user + hypothesized value prop from the free-text entry (this structured extraction is itself a small agent step, reusable everywhere else in the pipeline).
2. For MVP/Live-stage ideas, starts from the auto-fetched `structured.existing_product_context` (§4.1) — ratings, review themes, existing traction signal — before going external. This is cheaper and more diagnostic than fresh outside interviews for a founder who already has real usage data sitting in their reviews/existing feedback, so it's used as the first input, not skipped in favor of a generic external scan.
3. Runs web search: competitors, existing solutions, recent news in the space.
4. Runs social search: Reddit, X/Twitter, relevant forums/communities — looking for people describing the *same problem* (not the same solution). This reuses the same "find where people talk about this" logic that Step 3's Normal Track needs, so it should be a shared internal tool/function, not duplicated code.
5. Synthesizes findings into:
   - **Problem strength signal** (weak/moderate/strong, with evidence links)
   - **Competitive landscape summary** (who else solves this, how, gaps)
   - **3–5 concrete proposed changes** to sharpen the idea (e.g., narrower ICP, different angle, feature to cut/add) — each change tagged with *why* (evidence-backed reasoning, not generic advice)
5. Writes output into `idea_state.research_report` (JSON) and appends to idea-state JSON.

**UI:**
- Research report screen: problem-strength badge, competitor list (cards), and the proposed changes as **individually acceptable/rejectable cards** — user can accept a change (which patches the idea's structured problem/value-prop fields), reject it, or edit it inline.
- "Continue to Validation" CTA once user has reviewed (they are not required to accept any changes).

**Acceptance criteria:**
- Every claim in the research report that comes from a search result must carry a source link (no unsourced assertions presented as fact).
- User's accept/reject/edit decisions on proposed changes are stored (useful signal for later SLM training on "what changes founders actually take").

---

### 4.3 Step 3 — Validation

This is the core of the PRD. Two tracks, selected by the user, both converging on the same output shape (a `validation_report`) so the Decision Gate in Step 4 doesn't care which track produced it.

#### 4.3.0 Track selection screen
- Explains both tracks side by side (see table below).
- Fast Track shows a **live cost estimate** before purchase (see §4.3.2).

| | Normal Track (Slow) | Fast Track (Paid) |
|---|---|---|
| Cost | Free | Paid, per-interview + analysis fee |
| Who talks to people | User does it themselves | BRAINS team runs it |
| Volume | 10+ unpaid interviews target | User picks N experts to interview |
| Timeline | Self-paced | 1–2 weeks turnaround |
| Questionnaire generation | Agent-generated (shared capability) | Agent-generated (shared capability) |
| Social media engagement assist | Agent drafts comments/replies, user posts themselves | Agent drafts comments/replies; higher-touch support (Ops-assisted) |
| Output | Same structured validation_report | Same structured validation_report |

> **Note:** questionnaire/script generation and social media engagement assistance are shared capabilities available in *both* tiers — the tiers differ in who does the legwork (user vs. BRAINS) and volume/speed, not in which tools are available. All responses gathered — whether from a self-run interview, a BRAINS-run Fast Track interview, or a reply thread in a social community — flow into the **same unified response pool** (`validation_responses`, §7) so the Decision Gate always synthesizes across every channel together, not per-channel.

---

#### 4.3.1 Normal Track

**Goal:** Help the user find where their target users already congregate online and run their own interviews/survey, self-paced, unpaid.

**What the system does:**
1. **Signal Scanning Agent** (§6.3) identifies specific communities (named subreddits, Facebook groups, Slack/Discord communities, LinkedIn groups, niche forums) where the target problem is actively discussed, with example threads as evidence.
2. Generates a **survey/interview script** (agent-drafted, editable by user) built around the problem statement — designed to surface unprompted problem confirmation, not lead the witness.
3. User manually goes out and talks to people / posts the survey; the UI gives them a simple structured intake form to log each response:
   - Did they confirm experiencing this problem? (yes/no/unsure)
   - Free-text notes
   - Source (which community/person, optional identifying info)
4. User needs **10+ logged responses** minimum before the track can be marked "ready for gate review" (soft gate — user can force it earlier with a warning, but the Decision Gate agent will note low sample size as a risk factor).
5. On "I'm done collecting", **Validation Synthesis Agent** (§6.4) computes the confirmation rate and produces the `validation_report`.

**UI:**
- Community list with links + example threads
- Script editor
- Response log table (add response, running counter, running confirmation %)
- "Finish & analyze" button (disabled below 10 unless user overrides)

---

#### 4.3.2 Fast Track

**Goal:** User pays BRAINS to run the interviews for them, using a pool of niche experts, with results back in 1–2 weeks.

**Step-by-step:**

1. **Pick N interviewees.** User selects how many people they want interviewed (slider/stepper, e.g. 3–25, configurable min/max).
2. **Live estimate.** As soon as N is chosen (and ideally as soon as the idea's niche/domain is known from Step 2), the system shows:
   - Cost per interviewee (this can vary by niche — a specialized B2B SaaS niche expert costs more than a general consumer one; see **Estimation Agent**, §6.5, and pricing table §4.3.2.1)
   - Flat/scaled **analysis fee** (covers BRAINS team + AI synthesis time — scales mildly with N, not linearly, since analysis is partially fixed-cost)
   - **Total estimate**, before payment
3. **Checkout.** User pays (Stripe or similar — see §9 integrations). On successful payment:
   - `fast_track_orders` row created (status `pending_sourcing`)
   - Internal task created for BRAINS Ops (or, longer-term, an **Expert Sourcing Agent**, §6.6) to source and schedule N experts matching the idea's niche from the expert pool (`experts` table, §7)
4. **Sourcing & scheduling.** Ops (or the agent, once mature) matches idea niche → expert tags, sends outreach, books time (calendar integration), logs each interview's scheduled slot. User sees a simple progress tracker: `X of N scheduled`, `X of N completed`.
5. **Interviews happen** (Ops-run calls, or in future a scripted agent-assisted call flow — out of scope for v1, assume human-run calls with a shared script derived from the same script-generation agent used in Normal Track).
6. **Transcription/notes.** Each completed interview's notes/recording are logged (`fast_track_interviews` row) — same structured fields as Normal Track responses (confirmed? yes/no/unsure, free-text notes) plus the expert's identity and specialization tag.
7. Once all N are in, **Validation Synthesis Agent** runs identically to Normal Track, but with an added weighting/quality note: expert interviews carry a `confidence` field (since these are targeted domain experts, not necessarily end-users — the report should be honest about what this validates: *problem exists in the eyes of domain experts*, which is a different (often stronger) signal than raw end-user confirmation, and the report language should say this explicitly).
8. User gets notified (email/in-app) when the report is ready — target 1–2 weeks from payment.

**4.3.2.1 Pricing model (for Estimation Agent to compute from, and for Ops to configure)**

Store as a configurable table, not hardcoded:

| Niche tier | Cost per interview (example) | Notes |
|---|---|---|
| General consumer | $X low | Larger available pool |
| Vertical B2B / SaaS | $X mid | Smaller pool, higher expertise needed |
| Highly specialized (regulated, technical, medical, etc.) | $X high | Scarce experts, premium |

Analysis fee: base fee + small per-interview increment (fixed cost of synthesis doesn't scale 1:1 with N).

> Actual dollar figures are a business decision for Stanley/Ops to set and tune — the system should read these from an admin-configurable pricing table (`pricing_config`), not from code, so rates can change without a deploy.

**Acceptance criteria (Fast Track):**
- No expert is contacted before payment succeeds.
- User can see exactly what they're paying for (per-interview + analysis, itemized) before committing.
- If BRAINS can't source N qualified experts within a reasonable window, user is notified and offered: reduce N, extend timeline, or refund the shortfall.

---

#### 4.3.3 Social Media Engagement Assistance (both tiers, plus a standalone recurring subscription)

**Goal:** Help the user find and engage in the communities identified by the Signal Scanning Agent (§6.3) — without pitching — to surface more problem-confirmation signal, and to keep doing this on an ongoing basis as a paid subscription independent of any single idea's validation cycle.

**Two purpose-built agents, not one general one:**
- **Post Drafting Agent** (§6.8) — drafts standalone posts the founder could publish (e.g. a new Reddit/LinkedIn post asking a genuine question or sharing a related experience) to surface people with the target problem.
- **Comment Drafting Agent** (§6.9) — drafts replies to specific existing threads the Signal Scanning Agent found, tailored to that thread's context.
- Kept separate because the two are different writing tasks (cold-open post vs. contextual reply) with different prompts, different platform norms, and different rate-limit/policy rules — collapsing them into one agent would make both worse.

**Standing policy: BRAINS never posts on the user's behalf, in any tier, ever.** Both agents only draft. The founder always reviews, is prompted to edit before publishing, and publishes manually themselves. This is a hard product rule, not a v1-only limitation — the paid tiers below buy more/better *guidance*, never automation of the posting action itself.

**Tiers:**
- **Free:** limited drafts per week/month, tied to communities already surfaced for an idea in validation.
- **Fast Track (one-time, per validation round):** higher draft volume, Ops-assisted monitoring of threads for replies.
- **Continued Social Scan subscription (new, recurring):** a standalone paid plan, decoupled from any single validation round, where BRAINS keeps scanning relevant communities and drafting posts/comments on an ongoing basis — useful for a founder who has already passed validation and wants to keep sourcing signal, feedback, or early users over time. This is a natural upsell path once a founder has been through at least one paid Fast Track cycle and trusts the drafts.

**What the system does:**
1. Reuses the community list already produced in §4.3.1 step 1 (Signal Scanning Agent) — generated once per idea, shared across Normal/Fast tracks and both drafting agents, never regenerated per-feature.
2. Founder reviews each draft, is nudged to personalize it (system flags drafts that look too generic/templated before allowing "mark as posted"), and publishes it themselves.
3. Any reply the user receives — someone confirming or describing the problem — is logged back into the **same unified questionnaire/response structure** as interviews and surveys (`channel: social`), so it counts toward the same confirmation rate the Decision Gate uses.

**UI:**
- "Engage" tab: separate sub-sections for "Posts to publish" and "Comments to leave", each with the draft, an edit box, an "I edited this" checkbox before "Mark as posted" unlocks (soft nudge, not a hard block), and a lightweight "log the reply" form once a response comes in.

**Acceptance criteria:**
- Neither agent ever drafts language that pitches the product, asks for payment, or misrepresents the user's identity/intent.
- No auto-posting in any tier, ever — this is a permanent product boundary, not a phase-1 limitation to relax later.
- Continued Social Scan subscription must be purchasable independent of running a new validation round (a founder past validation should still be able to buy it).

---

### 4.4 Step 4 — Decision Gate (Go/No-Go)

**Goal:** Turn everything gathered across every channel (interviews, surveys, and social engagement replies) into a clear, human-readable summary — with a score, a go-ahead/rethink signal, and concrete improvement ideas — then have a human (the user) confirm the next step.

**Two agents work together here:**

- **Validation Synthesis Agent** (§6.4) — reads every logged response across all channels (interview, survey, social) and produces: (a) the raw confirmation rate, (b) a plain-language **summary of what people actually said** (recurring themes, strongest objections, most compelling confirmations — not just a percentage), and (c) notable quotes/patterns worth the founder's attention (paraphrased, never verbatim-scraped at length).
- **Decision Gate Agent** (§6.7) — takes the synthesis output and produces the founder-facing verdict:
  - **Score:** a 0–100 validation score (not just the raw confirmation %; it's the confirmation rate adjusted for sample size, response quality/depth, and source diversity — see risk factors below).
  - **Signal:** `go_ahead` or `rethink` (mapped from score/threshold — see rule below).
  - **Improvement proposal:** a concrete, evidence-cited list of what to change if the signal is `rethink` (or what to sharpen even on a `go_ahead`, e.g. "strong signal from freelancers, weak from agencies — consider narrowing ICP to freelancers first").
  - **Reasoning:** plain-language explanation of how the score was reached, so the founder isn't just handed a number.

**Primary threshold rule:** **if ≥50% of respondents (across all channels combined) confirm experiencing the problem → `go_ahead`.** Below 50% → `rethink` (not an automatic kill — a below-threshold result always triggers a **diagnostic sub-analysis**: is the problem statement wrong, the audience wrong, or the problem genuinely weak? — folded into the improvement proposal).

**Risk factors the agent must surface alongside the score (never just emit a bare number):**
- Sample size (flag if total responses across all channels is under 10)
- Response quality/depth (thin one-word "yes" answers vs. detailed problem articulation)
- Source diversity (all responses from one community/channel = weaker signal)
- Channel mix (interview vs. survey vs. social-reply responses may carry different reliability — the agent should note this, not silently average it away)
- Fast Track-specific: expert-confidence vs. lived-experience distinction (see 4.3.2 step 7)
- Contradicts the research report from Step 2? (e.g., research said "strong" but responses say weak — flag the conflict explicitly)

**UI — Founder's Report Screen:**
- Headline: **Score** (0–100) + **Signal badge** (`Go Ahead` / `Rethink`)
- **Summary section** (from Validation Synthesis Agent): plain-language "here's what people told us" — themes, standout quotes (paraphrased), objections
- **All raw responses**, viewable in full: every logged response (interview, survey, social) with its source and confirmed/unsure/no tag — founder can always drill into the raw data, not just the summary
- **Risk factors**, called out individually
- **Improvement proposal**: concrete next-step suggestions, shown as accept/reject/edit cards — same interaction pattern as Step 2's proposed changes, so accepting one patches the idea's structured fields directly for the next loop
- Three action buttons: `Proceed to Build`, `Rework Idea` (loop back), `Kill This Idea`
- **The loop-back option is always available** — regardless of score, the founder can choose to rework and re-validate. If the score is below threshold, the UI should default-highlight `Rework Idea` as the recommended action, but never block the founder from re-validating even after a `Go Ahead` (e.g. if they want to sharpen further before building) or from proceeding anyway despite a `Rethink` signal (human always has final say, per §4.4 human-confirmed gate principle below).

**Acceptance criteria:**
- Agent never silently recommends "kill" without the diagnostic sub-analysis explaining *why* (wrong audience vs wrong problem vs no problem) — a bare score is not an acceptable output.
- The founder can always see the raw underlying responses, not just the agent's synthesis — the summary never replaces access to the source data.
- Below-threshold results must always permit an immediate loop back into Step 2 (rework research) or Step 3 (re-validate) with no artificial cap on how many times an idea can be looped — this is core to the product's iterative design.
- Every idea's terminal state (`passed`/`killed`) plus the full report is retained permanently for the future portfolio-level "what to kill/what to change" reporting mentioned as later scope.

---

### 4.5 Step 5 — Rebuild Loop

**Goal:** If `Rework Idea` is chosen, cleanly loop the user back into Step 2 or Step 3 with the accepted changes already applied, without losing history.

**Behavior:**
- Choosing `Rework Idea` creates a new `idea_state_versions` entry (parent = previous version), pre-populated with accepted improvement-proposal changes (from the Decision Gate, §4.4) patched into the structured idea fields.
- User can choose to: re-run Research (Step 2) if the changes are substantial (new audience/problem), or skip straight to a new Validation round (Step 3) if changes are minor.
- **The loop is unbounded and always available.** There is no cap on how many rework cycles an idea can go through, and rework is not restricted to below-threshold results — a founder can rework after a `Go Ahead` score too if they want to sharpen further. Below-threshold (`rethink`) results should default-highlight the rework path in the UI, but the system must never block a loop-back request regardless of the current score.
- Full version history is visible to the user as a simple timeline: v1 (original) → v2 (rework: changed audience) → v3 (rework: narrowed feature)…, each with its own research/validation reports attached.
- `Kill This Idea` sets terminal status `killed`, report retained, idea archived (not deleted) — still visible in a "past ideas" list.
- `Proceed to Build` sets terminal status `passed` for this phase and is the handoff point into the (future, out-of-scope) Build phase — this PRD just needs to make sure `idea_state` has everything the Build phase will need (final problem statement, ICP, validated pain points, evidence) already captured in the JSON.

---

## 5. Idea-State JSON — Canonical Shape

This is the shared object every agent reads/writes. Kept versioned (§7) so nothing is ever overwritten.

```json
{
  "idea_id": "uuid",
  "version": 2,
  "parent_version": 1,
  "status": "validating_fast",
  "stage_at_entry": "mvp_built",
  "raw_submission": {
    "description": "string",
    "target_audience": "string",
    "product_link": "string|null"
  },
  "structured": {
    "problem_statement": "string",
    "icp": "string",
    "value_prop": "string",
    "existing_product_context": {
      "source_type": "website|app_store|none",
      "summary": "string (auto-fetched, user-confirmed)",
      "rating": "number|null",
      "review_count": "number|null",
      "notable_review_themes": ["string"]
    }
  },
  "research_report": {
    "problem_strength": "weak|moderate|strong",
    "competitors": [{ "name": "", "summary": "", "source_url": "" }],
    "proposed_changes": [{ "id": "", "text": "", "reasoning": "", "status": "accepted|rejected|edited" }]
  },
  "validation": {
    "track": "normal|fast",
    "communities": [{ "name": "", "url": "", "example_thread_url": "" }],
    "script": "string",
    "responses": [{ "confirmed": "yes|no|unsure", "notes": "", "source": "", "channel": "interview|survey|social", "expert_id": "uuid|null" }],
    "confirmation_rate": 0.0,
    "synthesis_summary": {
      "themes": ["string"],
      "notable_points": ["string (paraphrased, not verbatim)"],
      "objections": ["string"]
    }
  },
  "social_engagement": {
    "drafted_posts": [{ "community": "", "draft_text": "", "status": "drafted|edited|posted" }],
    "drafted_comments": [{ "community": "", "thread_url": "", "draft_text": "", "status": "drafted|edited|posted|reply_logged" }]
  },
  "fast_track_order": {
    "n_requested": 0,
    "cost_per_interview": 0,
    "analysis_fee": 0,
    "total_cost": 0,
    "status": "pending_sourcing|scheduling|in_progress|completed"
  },
  "decision_gate": {
    "score": 0,
    "signal": "go_ahead|rethink",
    "reasoning": "string",
    "risk_factors": ["string"],
    "improvement_proposal": [{ "id": "", "text": "", "reasoning": "", "status": "accepted|rejected|edited" }],
    "user_decision": "proceed|rework|kill|null"
  },
  "created_at": "",
  "updated_at": ""
}
```

---

## 6. AI Agents — Specification

Each agent: purpose, inputs, outputs, tools it needs, and where its output lands. All agents should log their full input/output/prompt version for future SLM training data collection (per BRAINS' "agents now, SLMs later" strategy) — do not treat this logging as optional/nice-to-have, it's core to the product's long-term architecture.

| # | Agent | Trigger | Inputs | Tools needed | Output → writes to |
|---|---|---|---|---|---|
| 6.0 | **Product Context Agent** | Entry submit, if a product link was given | `raw_submission.product_link` | web fetch (site or app store page) | `structured.existing_product_context` |
| 6.1 | **Extraction Agent** | On entry submit | raw_submission (+ existing_product_context if present) | none (pure LLM) | `structured.problem_statement/icp/value_prop` |
| 6.2 | **Research & Strengthening Agent** | After extraction | structured fields | web search, social search | `research_report` |
| 6.3 | **Signal Scanning Agent** | Normal Track start | structured fields | web search, social/community search | `validation.communities`, `validation.script` |
| 6.4 | **Validation Synthesis Agent** | User marks track "done" | `validation.responses` (all channels: interview/survey/social) | none (pure LLM over structured data) | `validation.confirmation_rate` + `validation.synthesis_summary` (themes, notable points, objections) |
| 6.5 | **Estimation Agent** | Fast Track N selected | idea niche, N, `pricing_config` | none | `fast_track_order.cost_per_interview/analysis_fee/total_cost` |
| 6.6 | **Expert Sourcing Agent** *(v1: human Ops, v2: agent)* | Fast Track payment success | idea niche, `experts` pool | internal DB query, outreach tool (email/calendar) | `fast_track_order.status`, interview scheduling |
| 6.7 | **Decision Gate Agent** | Synthesis Agent completes | `validation.synthesis_summary`, `validation.confirmation_rate`, `research_report` | none (pure LLM synthesis) | `decision_gate.score/signal/reasoning/risk_factors/improvement_proposal` |
| 6.8 | **Post Drafting Agent** | User opens "Posts to publish" (either tier, or subscription) | `validation.communities`, structured problem fields | web/social read access to community norms | `social_engagement.drafted_posts` |
| 6.9 | **Comment Drafting Agent** | User opens "Comments to leave" (either tier, or subscription) | `validation.communities` (specific threads), structured problem fields | web/social read access to threads | `social_engagement.drafted_comments` |

**On agent 6.4 vs 6.7:** these are kept as two distinct agent calls rather than one — Synthesis is a pure "what did people say" read of the data (reusable anywhere a raw response summary is needed, e.g. future portfolio reporting), while the Decision Gate is a judgment call layered on top (score, threshold rule, improvement proposal). Keeping them separate means the threshold/scoring logic can be tuned or replaced independently of how responses get summarized.

**Orchestration note:** Consistent with BRAINS' existing architecture, a single **orchestrator** should route between these agents rather than the frontend calling each directly — the frontend talks to one pipeline API, the orchestrator decides which specialist agent(s) to invoke based on `idea_state.status`. This keeps the door open to swap any agent for a trained specialist SLM later without touching the frontend or API contract.

---

## 7. Data Model (tables)

```
users
  id, email, name, created_at

ideas
  id, user_id (fk), created_at, current_version_id (fk -> idea_state_versions)

idea_state_versions
  id, idea_id (fk), version_number, parent_version_id (fk, nullable),
  status (enum: draft|researching|validating_normal|validating_fast|gate_review|passed|needs_rework|killed),
  state_json (jsonb — the full idea-state object from §5),
  created_at, updated_at

research_reports
  id, idea_state_version_id (fk), problem_strength, competitors_json, proposed_changes_json, created_at

validation_responses
  id, idea_state_version_id (fk), track (normal|fast), channel (interview|survey|social),
  confirmed (yes|no|unsure), notes, source, expert_id (fk, nullable), created_at
  -- unified table: every response, regardless of whether it came from a self-run interview,
  -- a Fast Track expert interview, a survey submission, or a logged social-media reply, lands here.

social_engagement_posts
  id, idea_state_version_id (fk), community_name, thread_url, drafted_text,
  status (drafted|edited|posted|reply_logged), validation_response_id (fk, nullable — set once a reply is logged), created_at

experts
  id, name, niche_tags (array), contact_info, rate_per_interview, availability_notes, active (bool)

fast_track_orders
  id, idea_state_version_id (fk), n_requested, cost_per_interview, analysis_fee, total_cost,
  payment_status (pending|paid|refunded), payment_ref, status (pending_sourcing|scheduling|in_progress|completed),
  created_at, completed_at

fast_track_interviews
  id, fast_track_order_id (fk), expert_id (fk), scheduled_at, completed_at, status (scheduled|completed|no_show|cancelled),
  validation_response_id (fk, nullable — links to the logged response once done)

pricing_config
  id, niche_tier, cost_per_interview, analysis_fee_base, analysis_fee_per_unit, effective_from

decision_gates
  id, idea_state_version_id (fk), score (int 0-100), signal (go_ahead|rethink), reasoning,
  risk_factors_json, improvement_proposal_json, user_decision (proceed|rework|kill|null), decided_at

agent_run_logs
  id, idea_state_version_id (fk), agent_name, prompt_version, input_json, output_json,
  model_used, latency_ms, created_at
```

---

## 8. API Endpoints (v1 surface)

```
POST   /ideas                          — create idea from entry-point submission
GET    /ideas/:id                      — fetch current idea_state (latest version)
GET    /ideas/:id/versions             — list version history
POST   /ideas/:id/research/accept-change   — accept/reject/edit a proposed change
POST   /ideas/:id/track                — select normal|fast track
GET    /ideas/:id/communities          — signal-scanning results (shared across tracks)
POST   /ideas/:id/responses            — log a response (interview, survey, or social) into the unified pool
GET    /ideas/:id/social/drafts        — agent-drafted comments for identified communities
POST   /ideas/:id/social/drafts/:draftId/mark-posted — user marks a drafted comment as posted
POST   /ideas/:id/fast-track/estimate  — { n } -> cost breakdown (Estimation Agent)
POST   /ideas/:id/fast-track/order     — create paid order, trigger sourcing
GET    /ideas/:id/fast-track/status    — scheduling/completion progress
POST   /ideas/:id/finalize-validation  — user marks track complete -> triggers synthesis + gate
POST   /ideas/:id/decision             — user's final proceed|rework|kill choice
GET    /ideas/:id/report               — full validation + decision gate report (for UI render)
```

Internal/ops-only:
```
GET    /internal/experts               — manage expert pool
POST   /internal/experts
GET    /internal/pricing-config
PUT    /internal/pricing-config
GET    /internal/fast-track-orders     — ops queue for sourcing/scheduling
```

---

## 9. Third-Party Integrations

| Need | Suggested integration |
|---|---|
| Web search | Any search API (existing BRAINS research tooling can likely be reused) |
| Social/community search | Reddit API, X/Twitter API, general web search scoped to forums; note API access/cost constraints upfront |
| Payments | Stripe (Checkout or Payment Intents) |
| Scheduling | Calendly-style embed or Google Calendar API for expert interview booking |
| Notifications | Email (transactional, e.g. SES/Postmark) + in-app |
| Transcription (future) | Otter.ai/Whisper API if interviews move to recorded calls |

---

## 10. Non-Functional Requirements

- **Auditability:** every agent decision must be traceable to its inputs (see `agent_run_logs`) — this is a compliance and product-quality requirement, not optional logging.
- **No data loss:** idea_state versions are append-only; never overwrite, always version.
- **Payment safety:** no expert outreach or cost incurred before payment confirmation webhook is received and verified.
- **Latency targets:** Research Agent output within ~1–2 minutes of submission (async, user sees progress state). Fast Track full turnaround: 1–2 weeks (human-in-the-loop, not a latency SLA in the technical sense, but should be tracked/reported per order).
- **Extensibility:** agent implementations must sit behind a common interface (input: idea_state slice + config → output: structured JSON) so any agent can be swapped for a fine-tuned specialist SLM later without changing callers.

---

## 11. Success Metrics (this phase)

- % of entries that reach a Decision Gate (vs. abandoned at draft/research)
- Normal vs Fast Track adoption split
- Average confirmation_rate at gate, by track
- % of "rework" ideas that come back for a second validation round
- Fast Track: actual turnaround time vs 1–2 week target; expert pool utilization
- Agent recommendation vs user's actual decision — agreement rate (key signal for whether the agent's judgment is trustworthy, feeds directly into "agents now, SLMs later" tuning)

---

## 12. Open Questions for Stanley / Ops (flag before dev starts)

1. Actual $ figures for the pricing tiers (§4.3.2.1) — placeholder in `pricing_config`, needs real numbers.
2. Min/max N for Fast Track interviews — suggested slider bounds?
3. Refund policy if BRAINS can't source enough qualified experts in time.
4. Is Expert Sourcing (§6.6) human-run (Ops) for v1, with the agent version deferred? (Recommended: yes, human-run first, log everything so the agent can be trained/validated against Ops decisions before automating.)
5. Should "Kill This Idea" require a reason/tag from the user (useful later for portfolio-level "why do ideas die" reporting)?

---

## 13. Suggested Build Order (for the dev team)

1. Data model + `idea_state_versions` versioning system (foundation everything else depends on)
2. Entry point UI + Extraction Agent
3. Research & Strengthening Agent + report UI
4. Normal Track (Signal Scanning Agent + response logging + Validation Synthesis Agent) — ship this before Fast Track, it validates the whole loop end-to-end without payment complexity
5. Decision Gate Agent + gate UI + rebuild loop wiring
6. Fast Track: pricing config, Estimation Agent, payment integration, expert pool + Ops queue (agent sourcing deferred to v2)
7. `agent_run_logs` instrumentation across all of the above (should really be built alongside step 1, not bolted on last — call this out to the dev team explicitly)

---

*End of PRD. Next document (separate): GTM/marketing funnel + launch/growth loop phase, once this phase is built and validated in practice.*
