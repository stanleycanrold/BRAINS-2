# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-08-25

## Product Overview
**One-liner:** BRAINS AI validates your startup idea with real customers in 48 hours — before you write code.
**What it does:** Founders describe an idea in one sentence. BRAINS researches the problem space with live sources, runs Mom-Test interviews with verified ideal customers, and returns a scored GO/PIVOT/KILL decision with verbatim quotes, willingness-to-pay, and funnelled risks. No fake personas, no invented citations.
**Product category:** Startup validation / customer discovery platform — founders search for "validate my idea," "customer interviews," "is my startup idea good."
**Product type:** B2B SaaS (self-serve) + services (Fast Track interviews)
**Business model:** Free: unlimited ideas, research, scoring, rework. Paid: Fast Track (per-interview, tiered by niche) + Continued Social Scan. No subscription required to reach a decision.

## Target Audience
**Target companies:** Pre-seed to Series A B2B SaaS (2–80 employees), technical founding teams (AWS/GCP/Supabase, GitHub-native), indie hackers and solo founders building their first B2B wedge.
**Decision-makers:** Founder/CEO (champion + economic buyer), CTO/VP Engineering (technical buyer, cares about integration friction), Head of Product (user champion, cares about problem severity).
**Primary use case:** Answer "should I build this?" with evidence — not opinions — from people who match the ideal customer profile.
**Jobs to be done:**
- Hire us to prove the pain is real (or not) with strangers who match my ICP
- Hire us to find what people already pay (competitors, workarounds, payroll cost) to anchor pricing
- Hire us to tell me whether to go, pivot, or kill — with the reasoning I can show an investor
**Use cases:**
- Solo founder with a sentence and a target audience, no MVP yet
- Team with an MVP but no paying users, needs to know if the problem is urgent enough
- Team live with users, needs to test a new wedge/feature before committing sprint

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Founder/CEO (Champion + Economic Buyer) | Speed to decision, investor credibility, not wasting 6 months | Has an idea, no signal, terrified of building the wrong thing | 48-hour scored verdict with verbatim quotes you can put in a deck |
| CTO / VP Eng (Technical Influencer) | Integration friction, data privacy, engineer hours lost | Past tools required read-access to prod DB, manual screenshots | Metadata-only checks, CLI/GitHub-native, no prod access, zero sprint disruption |
| Head of Product / Design Partner (User) | Problem severity, workaround cost, feature must-haves | Can't get 10 unbiased interviews this week | 10+ Mom-Test interviews with past-behaviour questions, not hypotheticals |

## Problems & Pain Points
**Core problem:** Founders build in isolation, then discover the problem is weak, the audience is wrong, or nobody will pay — after months of code.
**Why alternatives fall short:**
- YC/book advice ("talk to customers") gives no one to talk to and no script — interviews stay hypothetical
- DIY research returns SEO vendor pages, not lived experience — no competitors, no workarounds, no counter-evidence
- Legacy GRC/validation tools (Vanta/Drata for compliance, generic survey tools) are overbuilt, annual contracts, and built for enterprise — not for a 12-person team needing 10 interviews this week
- Free AI chat gives confident invented citations — looks researched, isn't
**What it costs them:** 60+ senior eng hours per audit cycle, $8k+ in wasted payroll, 3 weeks off product velocity, lost enterprise pilots (e.g., HIPAA gap), and the opportunity cost of the wrong wedge.
**Emotional tension:** Fear of being the founder who wasted a year, stress of manual screenshot evidence, doubt when friends say "great idea!" but strangers won't pay, shame of asking customers leading questions.

## Competitive Landscape
**Direct:** Validation platforms that promise interviews + scoring — fall short because they invent citations or use generic survey panels, not ICP-verified, Mom-Test past-behaviour interviews; they show a number with no thread to open.
**Secondary:** General tools bent to the job (Google Forms/Typeform + manual Reddit search + spreadsheet) — fall short because they take a week, produce leading questions, and never synthesize a decision with pricing bounds.
**Indirect:** Doing nothing and absorbing the cost (Notion tracker, manual AWS IAM screenshots, assistant, WhatsApp group) — falls short because it breaks past 15 people and fails audits/pilots; the habit persists because it feels free.

## Differentiation
**Key differentiators:**
- Every factual claim carries a real source URL — no invented citations, flagged `unsourced` when search returns nothing
- Mom-Test past-behaviour script + ICP-verified respondents (budget decision-maker, tools they use today) — not hypotheticals
- Pricing intelligence grounded in money already spent (competitor prices, workaround payroll, stated budgets) — Van Westendorp bound, never invented; `anchor_missing` instead of a guess
- Append-only versioning + full transcript verbatims + hypothesis ledger — rework keeps history, founder trusts the words were actually said
**How we do it differently:** Research agent diversifies across Reddit/HN/Product Hunt/G2/YouTube before returning, quote extraction trims but never rewrites, decision gate enforces 50% confirmation threshold regardless of model output.
**Why that's better:** Founder can interrogate every number, open every thread, and show an investor a reasoning, not a vibe. A made-up willingness-to-pay is worse than `—`.
**Why customers choose us:** We say "weak" when it is weak, show counter-evidence separately so it can't be folded into a flattering narrative, and the one-line `why_it_matters` on each quote tells them what the numbers don't.

## Objections
| Objection | Response |
|-----------|----------|
| "If you require DB read access, security will block it." | We read metadata-only cloud logs and GitHub PRs — no raw prod DB, and we say so up front. |
| "We already have a 3-year Vanta/Drata contract." | We wedge where they don't: early-to-mid market, CLI + pay-as-you-grow $149–$399, no annual lock, no auditor lock-in. |
| "A survey with 'would you pay?' is enough." | Stated intent is not evidence. We anchor only on money described as spent/charged/budgeted — otherwise we return `no anchor`. |

**Anti-persona:** Enterprise CISO at 300+ person org needing FedRAMP Moderate, on-prem agents, and custom SAML SCIM from day one — better served by OneTrust/ServiceNow. Also founders who want us to invent a flattering report rather than hear "weak."

## Switching Dynamics
**Push:** Two senior engineers pulled off product for 3 weeks per audit, 94-line Google Sheet, auditor rejecting unverified bash scripts, lost hospital pilot over a 2-day HIPAA log gap.
**Pull:** 48-hour turnaround, verified ICPs you don't have to recruit, verbatim quotes with why_it_matters, and a price you can defend because it traces to a URL.
**Habit:** "We have a spreadsheet and a habit" — manual folders feel free, and the founder can keep asking friends who say "great idea!"
**Anxiety:** Will interviewees be real? Will my data leak? Will the score be a black box? — answered by source URLs, never-leak respondents, and a reasoning paragraph for every score.

## Customer Language
**How they describe the problem:**
- "Every single audit cycle pulls two of my senior engineers off product velocity for 3 weeks just screenshotting AWS IAM policies."
- "We lost an enterprise hospital pilot because our HIPAA access logs had a 2-day gap."
- "I hate taking screenshots for SOC 2 more than anything else in software engineering."
- "We have $180k in denied insurance claims sitting in a backlog because our billing coordinator cannot spend 45 minutes on the phone for each $300 claim."
**How they describe us:**
- "I would swipe the corporate card today. That is literally less than 3 hours of senior dev salary time."
- "If it detects a secret and swaps it for a local stub automatically, instead of just failing the build, that's the killer feature."
**Words to use:** verified, verbatim, past behaviour, unprompted, workaround, willingness-to-pay, anchor, evidence over opinion, go/pivot/kill
**Words to avoid:** AI-powered (vague), revolutionary, disruptive, guarantee, "would you pay?", "definitely use", em dashes (—) in user-facing copy (use " - ")
**Glossary:**
| Term | Meaning |
|------|---------|
| ICP | Ideal Customer Profile — the narrow "freelance designers who invoice 5-20 clients/mo," not "small businesses" |
| Mom-Test | Questions about past behaviour ("last time it happened"), not hypotheticals |
| Verbatim | Respondent's own words, trimmed but never rewritten |
| Anchor | Money described as spent/charged/budgeted — the only basis for pricing |
| Van Westendorp | Price bounds from observed spend (too cheap → too expensive), not stated intent |
| Sprint | One validation round (research → interviews → decision) |

## Brand Voice
**Tone:** Direct, evidence-first, calm confidence — no hype, no hedging. Founder-to-founder.
**Style:** Conversational but precise, short sentences, one plain line for `why_it_matters`, numbers with prose so a founder can interrogate them.
**Personality:** Rigorous, Unbiased, Helpful, Opinionated when evidence is strong, humble when thin

## Proof Points
**Metrics:** 79.4% unprompted pain mention rate (AutoAudit), 86/100 GO at 14 respondents, $285 avg WTP with anchor; 27.5 eng hours lost per audit cycle (~$4,100 payroll)
**Customers:** HyperScale Logix (45-60, Fintech), Synapse Health AI (18, HealthTech), Zeta Protocol (24, Web3) — all Fast Track Verified
**Testimonials:**
> "Every single audit cycle pulls two of my senior engineers off product velocity for 3 weeks just screenshotting AWS IAM policies." — Elena Rostova, VP Eng, HyperScale Logix
> "We lost an enterprise hospital pilot because our HIPAA access logs had a 2-day gap." — Marcus Vance, CTO, Synapse Health AI
> "I would swipe the corporate card today." — Elena Rostova on $300–$400/mo flexible pricing
**Value themes:**
| Theme | Proof |
|-------|-------|
| Pain is real | 12 people saying it unprompted beats 1 vendor blog post — we count independent sources |
| Price you can defend | $249 sweet spot from competitor + payroll anchors, not "would you pay $X?" |
| Fewer false positives | Counter-evidence kept separate, never averaged away |

## Goals
**Business goal:** Become the default pre-code diligence for B2B founders — 10+ verified interviews with a scored decision in 48h.
**Conversion action:** Orchestrate a sprint (describe problem + ICP + value prop) and reach a decision; secondary is book Fast Track interviews.
**Current metrics:** Free plan active, 0 billed yet (Stripe simulated), avg 3 ideas per founder, 10-response soft gate before scoring

## Changelog
- v1 (2026-08-25) — Initial context. Auto-drafted from README, web landing (WebHero/WebPlatform pillars), dashboard copy, and validation PRD; ready for founder review.
