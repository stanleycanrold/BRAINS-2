# BRAINS AI — Validation Engine

Takes a founder from "I have an idea" through research, validation, and a
go/no-go decision. Implements `docs/BRAINS_AI_Validation_PRD.md` against
`docs/BRAINS_AI_Complete_Design_System.md`.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:migrate           # or: npx drizzle-kit migrate
npm run dev
```

The app expects Node 20+. It will use port 3001 if 3000 is taken.

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | React 19, Turbopack |
| Styling | Tailwind v4 | Semantic tokens only — see below |
| Database | Neon Postgres + Drizzle | Namespaced to the `brains` schema |
| Auth | Clerk | Resource-level checks, not path matching |
| LLM | Groq (phase 1) → Anthropic | One-line provider swap |
| Payments | Stripe | Simulated until keys are added |

## Two things to know before changing code

**1. No hex values in components — ever.** Every colour is a semantic token
defined once in `src/app/globals.css`. This is the entire mechanism that makes
dark mode a config change rather than a rewrite; both token sets already ship.
If you need a new colour, add a named token first.

**2. `idea_state_versions` is append-only.** A rework forks a new version with
`parent_version_id` set; it never mutates the previous one. Every past report
stays readable forever, including for killed ideas. `src/lib/data/ideas.ts` is
the only module allowed to write versions.

## Layout

```
src/
├── app/
│   ├── (app)/          Signed-in screens (dashboard, ideas, engage, account)
│   ├── api/            Route handlers — the pipeline API
│   └── globals.css     ← the ONLY place raw hex values live
├── components/
│   ├── ui/             Design-system primitives (Part 3 of the design doc)
│   ├── shell/          Sidebar, top bar, pipeline stepper
│   └── brand/          Logo and wordmark
└── lib/
    ├── agents/         Agent definitions + orchestrator + run logging
    ├── llm/            Provider adapters behind one interface
    ├── data/           Versioned idea repository
    ├── db/             Drizzle schema and client
    └── domain/         The canonical idea_state shape (zod)
```

## Swapping Groq for Anthropic

Set `ANTHROPIC_API_KEY` and `LLM_PROVIDER=anthropic`. That is the entire
change — no agent, route, or component is touched. The adapter is already
written and typechecked (`src/lib/llm/anthropic.ts`).

## Agents

Nine agents, all behind `src/lib/agents/runtime.ts`. Every run records its
prompt version, full input, full output, model, provider and latency into
`agent_run_logs` — that table is both the audit trail and the future training
corpus for BRAINS' specialist SLMs, so the logging is not optional.

The frontend never calls an agent directly. It talks to the pipeline API, and
`src/lib/agents/orchestrator.ts` decides which agents to run based on the
idea's status. That indirection is what lets any agent be replaced by a trained
SLM later without changing the API contract.

## Verification scripts

```bash
npx tsx --env-file=.env.local scripts/smoke-llm.ts     # provider + live search
npx tsx --env-file=.env.local scripts/smoke-agents.ts  # research agent + citation check
```

`smoke-agents.ts` asserts the PRD's hard rule that every cited URL traces back
to a real search result — no invented sources.

## Known constraints

- **Groq free tier is 8,000 tokens/minute** on the default model. The provider
  backs off and retries on 429/413, and agent token budgets are sized around
  it. A paid tier removes the ceiling.
- **Search degrades rather than fails.** If live search returns nothing, the
  research report is flagged `unsourced` and the UI says so explicitly instead
  of presenting model recall as researched fact.
