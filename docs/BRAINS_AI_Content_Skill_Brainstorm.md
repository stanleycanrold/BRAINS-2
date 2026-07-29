# BRAINS AI — Content / pSEO Skill Brainstorm

**Status:** Built. This brainstorm became three installed global skills (`~/.claude/skills/`), usable from any project:

- **`no-ai-slop`** — installed as-is from [github.com/petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) (MIT). Owns every tone-level AI-writing pattern: banned words, throat-clearing openers, colon reveals, fake-profound kickers, em-dash overuse, and the rest. Two jobs: edit a draft, or detect patterns without rewriting.
- **`brains-content-intel`** — the research stage below (points 4 and 6), adapted from the sibling project's `startup-intel` + `startup-intel-link-processor`. Runs rarely (build once, refresh quarterly), not per page.
- **`brains-content`** — the drafting + audit stage (points 1, 2, 3, 5, 7, 8 below), adapted from the sibling project's `PSEO.md`. Two jobs mirroring `no-ai-slop`'s own shape: draft a new page, or audit an existing one. Explicitly calls `no-ai-slop` for tone-level checks rather than duplicating its list, and consumes `brains-content-intel`'s output as an input rather than re-researching per page.

The reasoning below is preserved as the record of why each skill is shaped the way it is.

**Starting point:** Stanley's sibling project (`Documents/Nexabrains/skills/`) already has a working three-stage content pipeline: `startup-intel-link-processor.md` (analyze one URL → structured JSON), `startup-intel.md` (aggregate many of those into `patterns_summary.md` + `things_to_learn`/`things_to_avoid`), `PSEO.md` (draft a page against those patterns, enforce structure, run QA). The pipeline shape is sound and worth reusing. The proposal below is what changes for BRAINS AI specifically, not a rewrite of the mechanism.

The stated priority driving this doc: **content quality is the thing that determines whether these pages rank at all.** Everything below is in service of that, not of shipping more pages faster.

---

## What to keep from the NexaBrains skill, unchanged

- The three-stage pipeline shape (analyze → aggregate → draft → QA).
- The anti-plagiarism discipline: extract reusable patterns, never copy structure or wording, never closely paraphrase.
- The JSON schema for per-source pattern extraction.
- The instinct already stated in the pSEO marketing guide: cut a niche/page rather than publish it thin.
- The quality-scoring rubric as a starting point (authority / tactical depth / SEO structure / readability / CTA signal), tuned per below.

---

## What changes, and why

### 1. Word count is a floor to clear, not a target to hit

Forcing every tactical page to a fixed word count (NexaBrains uses 1,200) means a topic that genuinely needs 700 words gets padded to 1,200 — and padding-to-quota is the single most recognizable tell of AI-generated content. There is no reader who can't tell the difference between "this section exists because it earned its place" and "this section exists because we were 200 words short."

**Proposal:** replace "minimum word count" as the primary gate with a **substance floor**: a real framework or staged model, at least two concrete examples, at least two external citations for factual claims, at least one specific number. Length becomes an output of clearing that bar, not an input constraint. Keep a soft word-count floor for baseline SEO reasons (very short pages struggle to rank), but frame it explicitly as "don't pad past this" rather than "hit this," and set it lower than 1,200 — something like 700–900 for a page that genuinely clears the substance bar, with tactical/how-to guides free to run much longer when the topic warrants it.

Page types that are structurally short by design (a checklist page, a template page) should NOT be held to the same floor as a full guide — forcing a tight, genuinely useful checklist up to 1,200 words just reintroduces the padding problem for an entire page type. Substance requirements should vary by page type (guide vs. checklist vs. comparison), not be one blanket number.

### 2. Define the voice explicitly — don't just say "original language"

"Draft in original NexaBrains language" is an instruction to have a voice, not a definition of one. Without a defined voice, sufficiently-well-researched content still converges toward generic startup-blog tone, because every model trained on the same 60 elite sources tends to produce the same register: confident, listicle-shaped, "here's what nobody tells you" openers.

BRAINS AI already has a real, product-grounded voice that every agent in the app runs on today (`VOICE` constant, `src/lib/agents/catalog/voice.ts`):

> Evidence over opinion. Never state something as fact without grounds. Be specific to THIS idea — generic advice is a failure, not a fallback. Never flatter the founder, never soften a weak signal to be encouraging. Write plainly. No hype, no emoji, no filler. Never use em dashes.

**Proposal:** the content skill inherits this voice directly rather than inventing a separate marketing register. This is a genuine differentiator — the product's actual worldview (rigor, willingness to say "the signal is weak," refusal to flatter) becomes the content's worldview too, instead of marketing and product sounding like two different companies, which is the default failure mode almost everywhere.

### 3. Mechanically enforce an "AI slop tells" list, same discipline as the em-dash ban

The app already treats a specific writing tic (em dashes) as a structural rule enforced in code, not a style suggestion — both in the agent house rules and as a hard strip in `runtime.ts` regardless of what the model outputs. The same discipline should extend to a short, well-known list of AI-writing tells, checked mechanically (grep-able) before a page ships:

- "In today's fast-paced world," "it's important to note that," "let's dive in"
- unlock / leverage / elevate / robust / game-changer
- false-balance hedging ("on one hand… on the other hand…") used to avoid taking a position
- triads-of-three as a rhetorical crutch ("faster, easier, and more efficient")
- a "Conclusion" section that just restates the intro
- em dashes (already banned app-wide; extend the same rule here)

This is cheap to check and catches the tells a human reviewer would flag anyway — encode it once rather than relying on every review pass to notice it independently.

### 4. The real long-term differentiator is BRAINS AI's own data, not external citation

Every generic startup-advice source makes claims like "most startups fail because they don't validate early enough" — true-sounding, unfalsifiable, and interchangeable with a thousand other pages making the same claim. What no external source can write, because they don't have it: real aggregate numbers from real validations run through this specific product. Once there's usage volume, a sentence like *"across the marketplace-idea validations we've run, roughly X% cleared the 50% confirmation threshold on the first round"* is something a competitor literally cannot reproduce.

**Proposal:** tag validation reports/responses by niche and tier now (mechanism TBD when we build this) so that data becomes queryable for content later, even though there isn't enough volume yet to cite honestly. Launch content on properly-cited external sources in the meantime; layer in first-party data as it accumulates. This is the open decision below.

### 5. CTA convention should match this product's actual funnel, not get copied from NexaBrains'

NexaBrains' default hero CTA pair is "book a call" (primary) + AI workspace link (secondary) — a sales-led pattern. BRAINS AI is self-serve and product-led; the whole design of the micro-app discussed in the prior session is that the CTA *is* the interactive widget itself, not a lead-gen form. Copying the sales-led CTA convention here would be tonally wrong for the product.

**Proposal:** default hero CTA pair for BRAINS AI content pages: primary = the embedded "get your instant read" teaser widget, secondary = a sample validation report as proof (once one exists to show).

### 6. Don't re-run the full research pipeline per page

NexaBrains' skill implies (loosely) that pattern research happens once and feeds many pages, but doesn't say so explicitly. Making it explicit: build `patterns_summary.md` and a BRAINS-specific voice/style doc once, refresh on a slow cadence (quarterly, or when a batch of pages notably underperforms), and have individual page-generation calls reference those existing artifacts rather than re-deriving patterns from 60 URLs on every single draft. Cheaper, faster, and produces more consistent output across pages than re-deriving fresh each time.

### 7. Model choice: strongest available for drafting, not the cheap/fast one

The public Teaser Agent (free, unauthenticated, runs on every anonymous visitor) is correctly slated for Groq on its own key — speed and cost matter there and the task is a single lightweight reflection, not real research. The editorial drafting pass is the opposite case: it runs rarely (dozens of pages, not thousands of anonymous hits), and quality is explicitly the entire point of this exercise. It should run on the strongest model available, not get the same cost-optimization treatment as the teaser.

### 8. A judgment gate the QA script cannot automate

Every item on the structural QA checklist (word count, FAQ count, internal links, citations, schema) can be satisfied by a page that is technically correct and still flat. Before a page ships, it should clear one more gate that has to be a human or careful-agent judgment call rather than a script: **does this page contain at least one sentence or framework a sharp founder would actually want to screenshot and save?** If nothing in the draft clears that bar, the structural checklist passing doesn't matter — the page isn't done.

---

## Open decision (not mine to make)

**Hold pSEO publishing until there's real product usage data to cite, or launch now on external citation and layer in first-party data later?**

- Waiting: slower to market, but the first wave of content can immediately use the one differentiator competitors can't copy.
- Launching now: faster, content leans on properly-cited external research (per NexaBrains' existing citation discipline) until volume exists, then gets revised/extended with first-party numbers as they accumulate.

---

## Resolved once the skills were actually built

- **Substance floor per page type:** `brains-content` sets it qualitatively (a named framework, two concrete examples, two real citations, one specific number, three internal links) rather than a fixed word count, and explicitly forbids stretching a checklist page to guide-length. No fixed word-count target for guides — length is an output of clearing the floor, not an input constraint.
- **Source-cluster list:** resolved as additive rather than either/or. `brains-content-intel` keeps the general founder/startup cluster (still genuinely useful for register and structure) and adds a validation-rigor cluster (sample size, survivorship bias, interview bias, lean methodology) on top, weighted higher when the two disagree — since "sounds like the one product that shows its work" is closer to the actual thesis than "sounds like a startup blog." The exact weighting is left as a live editorial call each refresh reconsiders, not a fixed ratio.
- **AI-assistance disclosure: no.** Stanley directs and reviews every piece of content himself rather than the skills publishing autonomously — `brains-content` drafts, `no-ai-slop` and the audit job check it, and nothing goes out without his own pass. A disclosure line exists to tell a reader who actually stands behind a piece; here the founder does, the same as any writer who uses an editor.

## Still open — not mine to resolve

- Concrete mechanism for tagging validation data by niche/tier for future content use.

These get resolved when we're actually ready to build the skill, not now.
