# BRAINS AI — Marketing Site Developer Guide + pSEO & Keyword Strategy

**Scope:** brains-ai.com (marketing site only — the app at app.brains-ai.com already has its own design system and page specs in the companion documents).
**Bar:** claude.com-quality — fast, restrained, confident. A marketing site earns more decorative license than the app (per the Appendix note in the Complete Design System doc), but "more license" means richer photography/illustration and looser layout rhythm, not more clutter or more animation.
**My call, as the person driving both the build and the growth strategy on this:** the micro-app and the pSEO system are the same investment, not two separate projects — every pSEO page's value comes from having the live idea-input widget embedded in it, and the widget's value at scale comes from pSEO driving people to it who wouldn't otherwise find you. Building them separately would waste most of the leverage in each.

---

## Part 1 — Tech stack recommendation

**Next.js (App Router), deployed on Vercel.** Reasoning, not just a default pick:
- pSEO at real scale (hundreds of niche pages) needs static generation for speed and crawlability, but you also need those pages to update as your keyword/pattern data evolves — **Incremental Static Regeneration (ISR)** is the specific feature that makes this work: pages are pre-rendered and served instantly, but regenerate on a schedule or via webhook when the underlying data changes, without a full redeploy.
- The micro-app (Part 3) is a genuine interactive widget, not just a form — Next.js lets you server-render the static page shell (fast LCP, good for SEO) and hydrate the interactive widget client-side after, so the widget's JavaScript never blocks the page from being fast and indexable.
- One codebase serves both the hand-written pages (Home, Pricing, Blog) and the data-driven pSEO pages (Part 4) — no need for a second system.

**Data layer for pSEO pages:** a structured dataset (JSON/database table, not hand-written Markdown files) of `{pattern, niche, generated_content, target_keyword}` records — each record renders through one page template. This is the same shape of system as the NexaBrains programmatic SEO pipeline you're already building (URL extraction → pattern aggregation → page generation) — **strongly consider reusing that same pipeline for BRAINS AI rather than building a second one.** The stages map directly: pattern aggregation here = your niche × template matrix (Part 5), page generation = the Next.js template rendering it.

---

## Part 2 — Site map

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Hero + embedded micro-app (Part 3), how-it-works summary, social proof, pricing teaser |
| How It Works | `/how-it-works` | Full walkthrough of the validation loop, sample report screenshot |
| Pricing | `/pricing` | Tier comparison, Fast Track calculator (reuses the Estimation Agent, same as the app) |
| Fast Track Detail | `/fast-track` | Deep trust-building for the paid tier |
| About / Trust | `/about` | Founder story, BRAINS framework, methodology honesty section (the "signal, not a guarantee" disclaimer lives here prominently) |
| Blog | `/blog`, `/blog/[slug]` | SEO content — this is where the LinkedIn content calendar gets a second life, repurposed (see Part 6) |
| **pSEO pages (new)** | `/validate/[niche]-startup-idea`, `/validate/[niche]-app-idea` etc. | Programmatic landing pages, each with the micro-app embedded, targeting long-tail search intent (Part 4–5) |
| Login / Signup | `/login`, `/signup` | Auth — carries any in-progress idea draft from the micro-app through to account creation |

---

## Part 3 — The micro-app: "Instant Idea Read"

This is the centerpiece, so it gets full specification rather than a one-liner.

### 3.1 What it does

A founder types their idea directly into a widget on the homepage (or any pSEO page), and gets an **immediate, free, lightweight response** — not just a form that redirects to signup with nothing given back. Concretely:

1. Textarea: "What are you building?" (same prompt as the app's Entry Point, for consistency)
2. Button: `Get my instant read`
3. On submit, a **Teaser Agent** (new, distinct from the app's full Research Agent — see 3.2) returns, within ~3–5 seconds:
   - A one-line problem-statement reflection ("Sounds like you're solving [X] for [Y]")
   - One quick observation — either a related existing solution/competitor category, or a one-line note on what's worth checking before building
   - A soft CTA: `Want the full validation report? Continue free →` — clicking carries the typed idea straight into signup, so nothing is retyped

### 3.2 Why a separate, lighter Teaser Agent, not the real Research Agent

The app's Research Agent (from the PRD) does real web + social search and takes 1–2 minutes — far too slow and too expensive to run on every anonymous visitor, including bots and people who'll never sign up. The Teaser Agent is a **fast, cheap, single-model-call reflection** with no external tool calls — it extracts and reflects, it doesn't research. This distinction matters for both cost control and speed; don't be tempted to just point the widget at the real agent to save engineering time.

### 3.3 Why give away a free teaser at all

This is a deliberate growth decision, not a nice-to-have: a pure "type your idea → forced signup wall" widget converts far worse than one that gives a taste of real value first. The teaser's job is to make the founder feel *understood* in one read, which is what earns the click into signup — the same principle as a good cold-open on any landing page, just interactive.

### 3.4 Abuse and cost protection (do not skip this)

A public, unauthenticated, free AI endpoint is a well-known cost and abuse vector — bots, scrapers, and competitors probing your prompts will hit this before real users do at any meaningful traffic volume. Required before launch, not an optimization to add later:
- Rate limiting per IP/session (e.g. 3–5 free reads per session, then a soft "sign up to continue" wall)
- Bot protection on submit (Cloudflare Turnstile or equivalent — invisible, don't make founders solve a puzzle)
- A hard cost ceiling/alert on the Teaser Agent's model spend, monitored from week one
- Never expose the underlying prompt or system instructions in any client-side response

### 3.5 Design spec

Built from the same component system as the app (Part 3 of the Complete Design System doc) — Card (raised), the same textarea style, the same Button primary variant in `--accent-brand`. The teaser response renders as a small raised card beneath the input, not a modal — keeps the visitor on the page, reading, rather than interrupting them. On the homepage this sits directly in the hero; on pSEO pages it sits below a niche-specific intro paragraph (Part 5).

---

## Part 4 — Marketing shell & visual quality bar

Per the Complete Design System's Appendix: same tokens (colors, type, the Score gauge as social proof), different shell than the app.

- **Top navigation**, not sidebar — Logo, How It Works, Pricing, Blog, Login/Signup CTA. This is a content/conversion site, not a record-management tool, so top nav is the right call here specifically (mirrors the reasoning in the app's shell decision, just the opposite conclusion for a different product shape).
- **Wider max-width** (1120px vs. the app's 960px) — marketing pages can breathe more.
- **More decorative license, with limits:** real photography or considered illustration in the hero is appropriate here in a way it isn't in the app; a sample Score gauge report screenshot as social proof is a strong, earned use of imagery. What doesn't change: still no stock-photo-of-people-pointing-at-laptops clichés, still no gradient-mesh-blob backgrounds (the single most overused AI-startup visual right now), still restrained motion — the site should feel considered, not templated.
- **Core Web Vitals targets:** LCP under 2.0s, CLS near 0, INP under 200ms — these are non-negotiable for both user experience and Google's ranking signals, and pSEO pages live or die on being fast at scale, not just the homepage.

---

## Part 5 — pSEO system architecture

### 5.1 The pattern × niche matrix

Rather than one page per exact keyword (unscalable) or one generic page (no long-tail reach), generate pages from a **template × niche matrix** — each combination gets its own URL, unique content, and the embedded micro-app pre-contextualized to that niche.

**Templates** (each becomes a URL pattern):
- `/validate/[niche]-startup-idea` — "How to validate a [niche] startup idea before you build it"
- `/validate/[niche]-app-idea` — "Is my [niche] app idea worth building?"
- `/checklist/[niche]-idea-validation` — "[Niche] idea validation checklist"
- `/interviews/[niche]-customer-questions` — "Customer interview questions for [niche] founders"

**Niches** (~25 to start — enough scale without diluting quality per page):
SaaS/software · Mobile app · AI app/tool · E-commerce store · Marketplace platform · Subscription box · Fintech app · Healthtech app · Edtech platform · B2B service business · Freelance/agency service · Newsletter/content business · Physical product · Local service business · Freelancer marketplace · Community/membership platform · Productivity tool · Developer tool/API · Creator economy tool · Wellness/fitness app · Real estate tech · Food/restaurant tech · Nonprofit/social venture · Consulting business · Coaching business

4 templates × 25 niches = **100 pages at launch**, expandable as the niche list grows — a meaningful footprint without overreaching before you know the pattern works.

### 5.2 Avoiding the thin-content trap (the most important section in this guide)

Programmatic SEO's single biggest failure mode is Google's Helpful Content system penalizing pages that are the same template with a word swapped — this is well-documented and it will actively hurt you, not just fail to help. **Every page needs genuine per-niche differentiation, not just a mail-merged niche name:**

- **A real, specific intro paragraph per niche** — not "Validating your [niche] idea is important," but something that demonstrates actual knowledge of that niche's dynamics (e.g., for marketplace platforms: the two-sided cold-start problem; for subscription boxes: churn as the make-or-break metric).
- **Niche-specific example communities** — this is where your product's own Signal Scanning Agent capability becomes a genuine content asset: the page can name 2–3 real types of communities relevant to that niche (e.g. for developer tools: relevant subreddits, Hacker News, dev Discord servers) rather than generic "go find your audience online" advice. This is content that's actually useful, which is exactly what separates a real pSEO page from a penalized one.
- **A niche-specific FAQ section** (3–4 questions) with FAQPage schema markup (Part 6) — genuinely different questions per niche, not the same four questions with the niche word swapped in.
- **Internal links to 2–3 adjacent niches** ("Building something more service-based? See our [consulting business] validation guide") — this is what turns 100 isolated pages into a real topic cluster Google can understand, rather than 100 orphaned pages.

If a page can't clear this bar with real differentiation, cut that niche rather than publish thin — a smaller set of genuinely useful pages will outperform a larger set of templated ones, both for ranking and for the "is this AI slop" perception a founder forms in 3 seconds on landing.

### 5.3 URL, canonical, and internal linking structure

- Clean, descriptive URLs as shown above — no query-string-based pSEO pages, they don't index or share well.
- Self-canonical on every pSEO page (each is genuinely unique content, not a duplicate needing to point elsewhere).
- A **hub page** at `/validate` linking to every niche page, organized by category — this is the crawl-discovery backbone; don't rely on sitemap alone for Google to find 100 pages.
- Breadcrumb navigation (Home → Validate → [Niche]) with BreadcrumbList schema.

---

## Part 6 — Technical SEO requirements

- **Structured data (JSON-LD):** `SoftwareApplication` schema on Home/Pricing, `FAQPage` schema on every pSEO page's FAQ section, `BreadcrumbList` on all pSEO pages, `Article` schema on blog posts.
- **Sitemap:** auto-generated, regenerated on every pSEO page publish/update (ties to the ISR revalidation webhook from Part 1).
- **Meta title/description templates:** pattern-driven but require a human (or agent) pass to avoid them reading as obviously templated — e.g. title pattern `Validate Your [Niche] Startup Idea Before You Build | BRAINS AI`, but the meta description should vary meaningfully per niche, not just swap the noun.
- **Open Graph + Twitter Card tags** on every page, including a dynamically generated OG image per pSEO page if feasible (niche name + Score-gauge motif) — meaningfully improves social click-through when these get shared.
- **Blog repurposing:** the LinkedIn content calendar built earlier is a ready-made blog content source — each LinkedIn post's topic (validation, AI news reactions, cost-saving, build-with-AI, GTM) becomes a longer blog article, cross-linked from the relevant pSEO pages and back. This is free content leverage from work you're already doing, not a separate content burden.

---

## Part 7 — Build order

1. Core hand-written pages (Home, Pricing, How It Works, About) with the marketing shell and design tokens — get the quality bar right on a small page count first.
2. Micro-app (Teaser Agent + widget) on Home only — validate that it actually converts before investing in pSEO scale around it.
3. pSEO template + data pipeline (reusing/adapting the NexaBrains pSEO system) — start with 15–20 pages across 4–5 niches to prove the differentiation approach (Part 5.2) works and ranks, before scaling to the full 100.
4. Full 100-page rollout once the pilot set shows real search traffic and the content bar holds up.
5. Blog repurposing from the LinkedIn calendar, cross-linked into the pSEO hub.

---

# Part 8 — SEO & pSEO Keyword Strategy (Senior Marketing view)

### 8.1 Core seed keywords (target on Home, Pricing, How It Works)

These are the head terms — lower volume than you'd like relative to competition, but they define what the whole site is "about" to search engines and should anchor your title tags:

- startup idea validation
- AI idea validator
- validate a business idea online
- MVP validation tool
- customer discovery software
- AI market research tool
- how to validate a startup idea
- idea validation before building

### 8.2 pSEO long-tail patterns (the actual traffic driver)

This is where real, compounding volume lives — individually low-search-volume, but 100+ pages of genuine long-tail intent adds up to more total qualified traffic than chasing the head terms above, and converts better because the intent is more specific:

- "how to validate a [niche] idea before you build it"
- "is my [niche] app idea worth building"
- "[niche] startup idea validation checklist"
- "customer interview questions for [niche] founders"
- "market research for [niche] startups"
- "how many people should I interview before building a [niche] app"
- "signs your [niche] startup idea won't work"

### 8.3 Informational/blog keywords (repurposed from the LinkedIn calendar)

- how to validate a business idea before building
- customer discovery questions to ask
- signs your startup idea is bad
- how many customer interviews before building an MVP
- cost to validate a startup idea
- how to know if people will pay for your product
- problem validation vs. willingness to pay
- how to find your first 100 customers
- how to cut your AI API costs
- AI model comparison for startups (ties to the AI-news pillar — genuinely useful, naturally links to current model landscape content)

### 8.4 Comparison/consideration-stage keywords (later, once domain authority builds)

Worth planning for, not launching with — these need real domain trust to rank and can look opportunistic too early:
- "AI idea validation vs traditional market research"
- "best startup idea validation tools" (a category roundup where BRAINS AI is one honest entry, not a thinly-veiled ad)
- "alternatives to [specific tool]" pages — only once you have enough content authority that this doesn't read as bait

### 8.5 Search intent mapping (how to prioritize)

| Intent | Keyword examples | Page type | Priority |
|---|---|---|---|
| Transactional (ready to try) | "AI idea validator", "startup idea validation tool" | Home, Pricing | Highest — these visitors convert fastest |
| Long-tail transactional | "validate my [niche] idea" | pSEO pages | High — this is your volume engine |
| Informational (researching) | "how to validate a startup idea", "customer discovery questions" | Blog | Medium — builds trust and internal links toward transactional pages |
| Comparison (evaluating options) | "best idea validation tools" | Blog/comparison pages | Lower priority initially, revisit once domain authority is established |

### 8.6 One honest caveat

pSEO works when the pages are genuinely useful and Google's helpful-content systems have gotten materially better at detecting templated content since pSEO became a popular growth tactic — the strategy above is designed around that reality (real per-niche differentiation, real internal linking, real schema), not around the "spin up 500 thin pages" version of pSEO that was viable a few years ago and isn't anymore. Budget real content effort per niche, not just engineering effort on the template.
