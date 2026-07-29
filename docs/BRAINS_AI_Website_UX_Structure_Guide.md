# BRAINS AI — Website UX & Information Architecture Guide

**Scope:** structure, layout, navigation, and usability for brains-ai.com — not colors or type (see the Complete Design System doc for tokens; this document tells you what to build with them and why, section by section, page by page).
**My role here:** senior PM + UX lead. Every structural call below is a decision, with the reasoning that justifies it — not a menu of options.

---

## Part 1 — Foundational UX principles (apply everywhere)

### 1.1 The scroll narrative principle

Every page on this site should answer the visitor's questions in the order they'd actually ask them in a real conversation — not the order that's easiest to build, or the order a template puts them in. Before laying out any page, write down the 3-5 questions a visitor has, in sequence, and let that sequence *be* the page structure. This one discipline is what prevents a marketing site from turning into a pile of sections in arbitrary order.

### 1.2 The hero is a thesis, not a template

The homepage hero should open with the single most characteristic thing about BRAINS AI: **you can type your idea and get a read on it right now, before signing up for anything.** That's not a claim to put in a headline — it's an interaction to put in the hero itself. The micro-app (from the pSEO guide) belongs directly in the hero, front and center, not as a "try it" link buried below a headline-and-stats block. A big number + small label + gradient accent is the template answer for an AI product hero; BRAINS AI's actual thesis is interactive, so the hero should be too.

### 1.3 Conversion hierarchy — one primary path per page

Every page has exactly one primary conversion action. Everything else is secondary, visually and structurally:

| Page | Primary action | Everything else is secondary |
|---|---|---|
| Home | Use the micro-app / sign up | Nav links, footer, blog teasers |
| How It Works | Sign up | Sample report link |
| Pricing | Start free / Get Fast Track estimate | FAQ, comparison detail |
| pSEO pages | Use the micro-app (niche-contextualized) | Related niches, blog links |
| Blog post | Sign up (end-of-post CTA) | Related posts |

A page with two equally-weighted CTAs forces the visitor to make a decision they didn't come to make. If a page seems to need two, that's a sign the page is trying to do two jobs — split it.

### 1.4 Trust architecture — spread thin, not clustered

Don't put all your credibility-building in one "About" page and nowhere else. Trust signals should appear exactly where doubt would naturally arise in the scroll narrative:
- Right after the micro-app gives its teaser response (proof the AI's read is actually good) → a real sample Score gauge/report as social proof, not testimonial quotes alone.
- Right before pricing (doubt: "is this worth paying for?") → the honest disclaimer that a validation signal reduces risk, not guarantees market success. Counterintuitively, this builds more trust here than hiding it — a site that admits its own limits reads as more credible at the exact moment someone's deciding whether to pay.
- Right before signup on pSEO pages (doubt: "is this legit or a lead-gen trap?") → a one-line methodology note, not a wall of text.

### 1.5 Progressive disclosure over walls of text

Nowhere on this site should a visitor face a large block of unbroken copy. Break every explanation into: a short lead sentence, then either a numbered sequence (only where order is real, per the design system's structural-device rule), a short bulleted list, or an expandable "learn more" — never a paragraph over ~3 sentences in marketing copy.

---

## Part 2 — Navigation & wayfinding

### 2.1 Header (all pages)

```
[BRAINS AI logo]     How It Works   Pricing   Blog          [Log In]  [Sign Up →]
```
- Logo links home, always.
- Exactly 3 nav links — How It Works, Pricing, Blog. Not 6-7 items; a marketing site nav should be scannable in one glance, and more links dilute which ones matter.
- `Sign Up` is the only filled/primary-colored button in the header — `Log In` is a ghost/text link. This mirrors the site-wide "one primary action" rule at the navigation level itself.
- **Sticky on scroll**, condensed height (logo + Sign Up button only, nav links collapse into the logo's click-through) — so the primary conversion action is always one tap away, without the full nav competing for space as the visitor scrolls deep into a long pSEO or blog page.

### 2.2 Footer (all pages)

Four columns: Product (How It Works, Pricing, Fast Track), Company (About, Blog), Validate by Category (top 6-8 pSEO niche links — this is real internal-linking value, not just a footer for the sake of having one), Legal (Terms, Privacy). Keep it to these four — a sprawling footer with 30 links reads as either desperate for SEO or genuinely disorganized; the pSEO internal linking is better served by the hub page (Part 9) than by cramming every niche into the footer.

### 2.3 Breadcrumbs (pSEO and blog pages only)

`Home / Validate / SaaS Startup Idea` — small, `--text-secondary`, directly below the header. Not needed on Home/Pricing/About (single-level pages don't need wayfinding back to themselves).

---

## Part 3 — Homepage: full section-by-section structure

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (2.1)                                             │
├─────────────────────────────────────────────────────────┤
│ HERO                                                     │
│  Headline: what this is, one line                        │
│  Sub-line: who it's for, one line                        │
│  ┌───────────────────────────────────────┐               │
│  │  [Micro-app widget — live, interactive] │              │
│  └───────────────────────────────────────┘               │
├─────────────────────────────────────────────────────────┤
│ PROOF: sample Score gauge / report screenshot             │
│  "Here's what you'll get" — real artifact, not a mockup   │
├─────────────────────────────────────────────────────────┤
│ HOW IT WORKS (4 numbered steps — order is real, earns     │
│  the numbering)                                           │
├─────────────────────────────────────────────────────────┤
│ WHO THIS IS FOR (2 short columns: idea-stage / builder-   │
│  stage — mirrors the two real personas, not generic       │
│  "for everyone" copy)                                     │
├─────────────────────────────────────────────────────────┤
│ PRICING TEASER (3 tier cards, condensed, "See full        │
│  pricing" link — not the full comparison table here)      │
├─────────────────────────────────────────────────────────┤
│ METHODOLOGY / TRUST NOTE (short, honest — signal not      │
│  guarantee, per 1.4)                                      │
├─────────────────────────────────────────────────────────┤
│ FINAL CTA (repeat the micro-app or a simple Sign Up       │
│  button — don't make them scroll back up)                │
├─────────────────────────────────────────────────────────┤
│ FOOTER (2.2)                                              │
└─────────────────────────────────────────────────────────┘
```

**Why this order, specifically:** a visitor's real question sequence is *what is this → let me see it work → prove it's good → how does it work → is it for someone like me → what does it cost → can I trust this → okay, I'll try it.* Notice the micro-app appears twice (hero + final CTA) — this is deliberate, not lazy repetition: by the final CTA, a visitor who scrolled the whole page has more context and is more likely to actually type their idea than they were on first arrival, so repeating the exact same interactive element (not a different generic "get started" button) is the highest-converting choice here.

**Mobile stacking:** identical vertical order, no reordering — the sequence of questions doesn't change on mobile, only the layout density (the "who this is for" 2-column becomes stacked, pricing teaser cards become a horizontal-scroll strip rather than 3-across).

---

## Part 4 — How It Works page

```
Hero: one-line restatement of the thesis + "See it in action" anchor link to the loop diagram below
↓
The 5-step loop, illustrated (Entry → Research → Validate → Decide → Rebuild loop)
  — each step gets: a short label, one sentence, and a small visual (screenshot crop or simple
    diagram) — NOT a wall of paragraph text per step
↓
Deep-dive on the Decision Gate specifically (this is the part visitors are most skeptical of —
  "can I trust an AI's verdict?" — so it earns its own section: show the actual Score gauge +
  Summary + raw-responses-always-visible structure, since transparency IS the answer to the
  skepticism, not more marketing copy)
↓
CTA: Sign Up
```

**Why the Decision Gate gets its own dedicated section:** per the trust-architecture principle (1.4), this is exactly where doubt peaks on this specific page — a visitor reading "an AI decides go/rethink/kill" is skeptical by default, and the honest answer (you always see the raw data, the score comes with reasoning, you always have final say) needs real visual space, not a single bullet point buried in step 4 of 5.

---

## Part 5 — Pricing page

```
Header: page title + one-line framing ("Start free. Pay only when you want us to run the
  interviews for you.")
↓
3-column tier table: Free (Normal Track) / Fast Track / Continued Social Scan
  — each column: what's included, in plain founder-facing language (not feature-speak),
    one clear CTA button per column
↓
Fast Track live estimate calculator (embedded, no login required — the slider from the app's
  design system, reused here) — lets a visitor play with N before ever signing up
↓
FAQ (5-6 questions, accordion — refund policy, how experts are sourced, turnaround time,
  what happens if you don't like the result)
↓
Trust/methodology note (1.4) — placed here specifically because pricing is the page where
  "is this worth it" doubt is highest
```

**Why the calculator needs no login:** friction at the exact moment someone's evaluating cost is the single most common point where a marketing site loses a visitor who would have converted — let them see real numbers before asking anything of them.

---

## Part 6 — Fast Track detail page

```
Hero: "Why pay for validation?" — directly names the objection rather than avoiding it
↓
How expert sourcing actually works (plain, step-by-step: you pick N → we source niche
  experts → interviews run → you get a report in 1-2 weeks)
↓
Sample completed report (link/preview — same Score gauge artifact as elsewhere, reused for
  consistency, not a new mockup)
↓
CTA: Sign Up → straight into the Fast Track flow (B4 in the app spec)
```

---

## Part 7 — About / Trust page

```
Founder note (short, first-person, honest — not a corporate "our mission" paragraph)
↓
The BRAINS framework, briefly (Brand/Reach/Authority/Income/Network/Scale) — one line each,
  not a full essay; this page's job is trust, not a framework tutorial
↓
Methodology honesty section — full version of the disclaimer that appears in shorter form
  elsewhere on the site: validation signal reduces risk, it doesn't guarantee market success.
  This is the one page where this gets real space and isn't compressed to one line.
↓
CTA: Sign Up (lower emphasis than other pages — visitors here are building trust, not
  necessarily ready to convert yet; a single, calm text-link CTA is right, not a big button)
```

---

## Part 8 — Blog

**Listing page (`/blog`):** simple reverse-chronological grid, filterable by the same pillars as the LinkedIn calendar (0-to-1, AI News, Build With AI, AI Cost, Products That Sell) — this filter doubles as a content taxonomy that also organizes the internal linking into pSEO pages by topic relevance.

**Article template (`/blog/[slug]`):**
```
Title + one-line dek + read time + pillar tag
↓
Article body — short paragraphs, subheadings every 150-200 words, per 1.5
↓
Related pSEO page callout (contextual — e.g. an AI-cost article links to the AI-cost
  content, a validation article links to the relevant niche validation pages)
↓
End-of-post CTA: Sign Up (this is the primary conversion point for blog traffic, not the
  header nav — most blog readers arrive from search or social, not via the nav)
↓
Related posts (3, same pillar)
```

---

## Part 9 — pSEO page template (the highest-volume page type — structure matters most here)

```
Breadcrumb (2.3)
↓
H1: "How to Validate a [Niche] Startup Idea Before You Build It" (matches the target keyword,
  not a clever rephrase — pSEO titles should be direct)
↓
Genuine niche-specific intro paragraph (2-3 sentences demonstrating real knowledge of that
  niche's dynamics — see the pSEO guide's anti-thin-content section; this is the paragraph
  that makes or breaks whether this page is useful or templated)
↓
Micro-app, pre-contextualized ("Building a [niche] product? Get your instant read below")
  — same widget as the homepage, just with a niche-aware prompt line
↓
Niche-specific checklist or "what to check before building" section (3-5 items, genuinely
  tailored — e.g. marketplace niches get a cold-start-problem item, subscription niches get
  a churn item)
↓
Niche-specific FAQ (3-4 questions, real differentiation per niche, FAQPage schema)
↓
Related niches (2-3 internal links — "Building something more service-based? See our
  [consulting business] validation guide")
↓
CTA: Sign Up
```

**Why the micro-app sits above the checklist, not below it:** a visitor who searched "how to validate a SaaS idea" and landed here wants to *try* validating, not just read about validating — put the interactive proof-of-value before the informational content, not after, or you lose the visitor who scans and bounces before reaching it.

---

## Part 10 — Login / Signup

- **Signup carries context.** If a visitor arrived via the micro-app (hero, pSEO page, or blog CTA) with an idea already typed, signup must carry that text through — never make them retype what they already gave you. This is a small technical requirement with a large conversion impact; a signup form that discards prior context is the single most common way a warm lead goes cold on the last step.
- Minimal fields: email + password (or a single OAuth option) — no "company name," "role," "team size" fields at signup. Ask for anything beyond the essentials later, inside the app, once there's already a relationship — front-loading extra fields at signup measurably increases drop-off for no real benefit at this stage.
- Inline validation on blur, not on every keystroke (per the form-friction principle in Part 12).

---

## Part 11 — Mobile-specific UX patterns (cross-cutting, applies to every page above)

- **Sticky bottom CTA bar** on mobile only, appearing after the hero has scrolled past — a condensed single button (`Sign Up` or `Try it free`) fixed to the bottom of the viewport. Desktop relies on the sticky header CTA (2.1); mobile's smaller header can't hold that same weight, so the bottom bar picks it up instead.
- **Micro-app keyboard behavior:** when the textarea is focused on mobile, the widget should scroll itself to keep both the input and the submit button visible above the keyboard — a widget that gets half-covered by the keyboard with no way to see the submit button is a completed-thought, immediate-abandon failure mode worth explicitly testing for.
- **Tables become cards.** The pricing comparison table and any FAQ accordion should restructure to stacked cards on mobile, never a horizontally-scrolling table — horizontal scroll on a comparison table is a common desktop-first mistake that quietly kills mobile conversion.
- **Tap targets** minimum 44x44px, consistent with the app's own accessibility floor.

---

## Part 12 — Forms & friction-reduction patterns (cross-cutting)

- **Ask for the minimum at each step, not everything upfront.** The micro-app asks for one thing (the idea). Signup asks for one more thing (email/password). Anything else waits until it's actually needed inside the app.
- **Autofocus the first field** on any form the visitor arrives at intentionally (e.g. the micro-app textarea, the signup email field) — one less tap before they can start.
- **Inline errors, not toast/alert errors,** appearing directly below the field on blur, stating the fix per the design system's voice guidance ("Enter a valid email" not "Error").
- **No CAPTCHA visible to the user** anywhere on the marketing site — bot protection (Cloudflare Turnstile, per the pSEO guide) should be invisible; a visible "click all the traffic lights" puzzle on a marketing site is real, measurable conversion loss for a threat that invisible protection already handles.

---

## Part 13 — Performance & perceived speed

- The hero (including the micro-app shell) must render fast even before its JavaScript hydrates — show the static textarea and button immediately, hydrate the interactive behavior after, so the page never feels like it's "loading" even if the widget's logic takes a beat longer.
- pSEO pages especially: since these are the highest-volume entry point and often the visitor's very first impression of BRAINS AI, they cannot be the slowest page type on the site — verify Core Web Vitals on pSEO templates specifically, not just the homepage, since it's easy to optimize the page you look at most and neglect the template that gets generated 100 times.
- Any image (sample report screenshot, founder photo) should be sized and compressed per placement, never a full-resolution image scaled down by CSS.

---

## Part 14 — Accessibility tied to structure

- **Heading hierarchy is real, not visual-only:** one H1 per page (matching the actual topic — the pSEO template's H1 must match its target keyword exactly, both for SEO and for screen-reader users navigating by heading), H2s for major sections in the order shown above, never skipping levels for a font-size effect.
- **Landmark regions:** `<header>`, `<nav>`, `<main>`, `<footer>` used semantically, not just as styled divs — this is what lets a screen-reader user jump straight to main content, skipping repeated nav on every page.
- **Skip-to-content link**, visually hidden until focused, before the header — same requirement as the app.
- Every one of the structural decisions above (heading order, landmark regions, focus order) should be checked with an actual screen reader pass before launch, not assumed correct from markup alone.

---

## Part 15 — Site-wide conversion hierarchy (summary)

If a developer or future collaborator only reads one section, make it this one:

1. **Micro-app** (hero + pSEO pages) is the primary conversion mechanism for cold/search traffic.
2. **Sign Up button** (header, sticky) is the primary mechanism for anyone who already knows what BRAINS AI is (returning visitors, direct traffic, blog readers).
3. **Fast Track estimate calculator** is the secondary mechanism specifically for pricing-page visitors evaluating the paid tier.
4. Everything else on the site — About, Blog, footer links — exists to build enough trust that one of the above three converts, not to convert on its own. Don't add a competing CTA to any of these secondary pages; their job is context and credibility, not the close.
