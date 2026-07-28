# BRAINS AI — Complete Design System (App)

**Scope:** app.nexabrains.io Marketing site (nexabrains.io) is intentionally deferred — see the Appendix for the one thing worth deciding now regardless.
**Standard:** claude.com-level polish — restrained, confident, evidence-driven. Every decision below is made, not left open, so a developer can build without re-litigating design choices mid-sprint.

---

## Quick-reference cheat sheet

For anyone who doesn't read the whole document — the five rules that matter most:

1. **One Primary button per view.** If two actions feel equally important, the flow is wrong, not the button choice.
2. **Every color is a semantic token, never a hex code in component code.** This is the entire mechanism that makes dark mode, and any future rebrand, a config change instead of a rewrite.
3. **The Score is always JetBrains Mono, tabular figures, never the display sans.** This is the one signature element that must be unmistakably consistent everywhere it appears.
4. **Motion is spent in exactly three places** (score reveal, status transitions, hover/focus) **and nowhere else.**
5. **Status color and brand color are never the same hue family.** Blue is the brand. Green/amber/red are status, full stop.

---

## Part 1 — Foundations

### 1.1 Design thesis

BRAINS AI's whole product is "evidence over opinion" — an idea gets a score, a signal, and reasoning, not a vibe. The design embodies that: precise, quiet confidence, numbers treated as first-class citizens, zero decorative noise. Most AI-product design right now clusters around three defaults — a warm cream background with a terracotta accent, a near-black background with a neon accent, or a dense broadsheet layout with hairline rules. BRAINS AI deliberately avoids all three. Its world is closer to an instrument panel than a magazine: clean, cool-toned, legible at a glance, built for someone making a real decision, not browsing.

**Signature element: the Score.** Every validation report treats the 0–100 score as a designed object — tabular monospace figures, a thin calibration arc behind it, animated once on reveal. This should be instantly recognizable as "a BRAINS AI report" wherever it appears: dashboard cards, the full report page, any future exported PDF.

### 1.2 Color system

Six named colors, used with discipline. Everything else is a derived neutral scale. Light values ship in v1; dark values are defined now so inversion later is a token swap, not a redesign (mechanism in §1.8).

| Token | Role | Light | Dark |
|---|---|---|---|
| **Ink** | Primary text / dark surfaces | `#14181F` | — |
| **Paper** | Primary background | `#F7F8FA` | — |
| **Signal (Brand)** | Primary accent — CTAs, links, focus, score arc | `#14267A` *(placeholder pending your original logo file — replace this one hex once confirmed, nothing else changes)* | `#435EDA` |
| **Go-Ahead** | Decision-gate pass, success, confirmations | `#2F8F5B` | `#7ECFA3` |
| **Rethink** | Decision-gate caution, low-confidence flags | `#C67C1E` | `#E5B475` |
| **Kill/Danger** | Destructive actions, errors | `#B3433D` | `#D18D89` |

**Neutral scale** (10-step, cool-neutral undertone to match Paper):
`#14181F` (900) · `#1E242E` (800) · `#2C333F` (700) · `#454E5C` (600) · `#6B7480` (500) · `#9AA2AB` (400) · `#C4C9CF` (300) · `#DEE1E5` (200) · `#EEF0F2` (100) · `#F7F8FA` (50)

**Usage rules:**
- Signal is the *only* color for primary buttons and links. Go-Ahead/Rethink/Kill never appear outside decision-gate or status contexts — this is what keeps status colors meaningful instead of decorative.
- Never pure black or pure white — always Ink/Paper, which carry a faint cool undertone that reads as designed rather than default.
- Dark-mode values are the same hues, lightened ~25–30% and desaturated ~5%, not the light value pasted onto a dark background (which reads muddy, not confident — see §1.8 for why).

### 1.3 Typography

Three roles, deliberately not "one grotesk for everything":

| Role | Typeface | Weight | Where |
|---|---|---|---|
| **Display** | General Sans | 600–700 | Page titles, section headers, report headline |
| **Body** | Public Sans | 400–500 | Paragraphs, labels, nav, buttons — chosen over Inter specifically because Inter is the default-by-default across AI products right now |
| **Data/Mono** | JetBrains Mono | 400–500, tabular-nums on | Score, confirmation %, IDs, timestamps — anything measured, never anything written |

**Type scale** (base 16px, 1.25 ratio):
- Display XL: 40/48, General Sans 700 — hero, report headline
- Display L: 28/36, General Sans 600 — page titles
- Display M: 20/28, General Sans 600 — section/card headers
- Body L: 16/26, Public Sans 400 — default copy
- Body M: 14/22, Public Sans 400 — secondary text, form fields
- Caption: 12/16, Public Sans 500, +0.02em tracking — labels, metadata
- Data L: 48/1, JetBrains Mono 500, tabular-nums — the Score
- Data M: 16/24, JetBrains Mono 400, tabular-nums — rates, counts, IDs

### 1.4 Layout, spacing & breakpoints

- 8px base unit throughout (8/16/24/32/48/64/96) — no arbitrary values, ever.
- Max content width: 960px for in-app panels (readable line length beats edge-to-edge density).
- Corner radius: 8px cards/inputs, 6px buttons, 12px modals, 999px (full pill) reserved exclusively for status badges and the segmented control — radius itself signals "this is a status or a selector," so it's never used decoratively elsewhere.
- Elevation: two levels only — flat (Paper + hairline border) and raised (white/`--surface-raised` + `0 1px 3px rgba(20,24,31,0.08)` shadow). No third "floating" level.
- **In dark mode, don't rely on shadow for elevation** — box-shadows barely read against a dark background and tend to look like a rendering glitch rather than a lift. Distinguish raised surfaces in dark mode by background tone alone (`--surface-raised` = `#1C2128` against `--surface-page` = `#14181F`), with the shadow kept but treated as a bonus, not the primary elevation cue.

**Breakpoints:**

| Name | Range | Shell behavior |
|---|---|---|
| Mobile | 0–767px | Sidebar becomes an off-canvas drawer, hamburger trigger in top bar |
| Tablet | 768–1023px | Sidebar auto-collapses to 64px icon-only rail |
| Desktop | 1024–1439px | Sidebar expanded (240px), standard layout |
| Wide | 1440px+ | Same as Desktop — content max-width caps growth, don't stretch panels wider just because the viewport is |

### 1.5 Iconography

Not previously defined — filling the gap. **Use a single icon set: Phosphor Icons, Regular weight** (open-source, consistent 1.5px-equivalent stroke, rounded line caps). Rounded caps specifically because they echo the logo mark's own rounded-cap web/spoke lines — this is a small detail, but it's the kind of consistency that separates "designed" from "assembled from whatever the component library shipped with."

- Sizes: 16px (inline with Body M/Caption text), 20px (default UI — buttons, table rows), 24px (nav/sidebar items).
- Color: icons inherit `--text-secondary` by default. They only switch to `--accent-brand` to indicate an active/selected state (e.g. the current sidebar nav item) — icon color is a state signal, not decoration.
- Never mix icon sets. Never use filled/solid icon variants alongside outline ones in the same view.

### 1.6 Motion

Spent in exactly three places, nowhere else:
1. **Score reveal** — gauge animates 0 → final score, ~600ms ease-out, on report load.
2. **Status transitions** — badge color/label crossfade, 200ms, when an idea's status changes.
3. **Focus/hover** — 120ms ease on buttons, links, inputs, cards.

No scroll-triggered reveals, no ambient background motion, no page-load choreography — this is an instrument panel, not a landing page, and extra motion undercuts the "measured, evidence-based" thesis. `prefers-reduced-motion` disables #1 and #2 (they snap instantly); #3 is subtle enough to leave as-is.

### 1.7 Voice in the interface

- Buttons name the exact action and keep that name through the whole flow: `Proceed to Build` produces a status change *to* "Proceed to Build," never a generic "Success!" toast.
- Errors state what happened and how to fix it, in the interface's voice — never "Oops," never an apology: *"We couldn't fetch that link. Check the URL or enter your product details manually."*
- Empty states are an invitation, not a dead end: a new account's Dashboard doesn't say "No ideas yet" — it says *"Describe what you're building — we'll take it from there,"* with the entry field right there.
- **Form validation errors** (new): inline, below the field, in `--status-danger` text with a small error icon — states the fix, not just the problem: *"Enter a valid URL (starting with https://)"*, not *"Invalid input."* Errors appear on blur, not on every keystroke — don't punish someone mid-typing.

### 1.8 Theming architecture — the actual inversion mechanism

**Ship light-only in v1. Wire every component to semantic tokens from day one anyway** — this is what makes dark mode a config swap later instead of a rewrite.

```
Palette (§1.2)  →  Semantic tokens  →  Components (reference tokens ONLY)
#F7F8FA             --surface-page        background: var(--surface-page)
#14267A             --accent-brand        NEVER: background: #14267A directly
```

**Token map:**

| Token | Light | Dark |
|---|---|---|
| `--surface-page` | `#F7F8FA` | `#14181F` |
| `--surface-raised` | `#FFFFFF` | `#1C2128` |
| `--border-default` | `#DEE1E5` | `#2C333F` |
| `--text-primary` | `#14181F` | `#F7F8FA` |
| `--text-secondary` | `#6B7480` | `#9AA2AB` |
| `--accent-brand` | `#14267A` | `#435EDA` |
| `--status-success` | `#2F8F5B` | `#7ECFA3` |
| `--status-caution` | `#C67C1E` | `#E5B475` |
| `--status-danger` | `#B3433D` | `#D18D89` |

**Starter code for the dev team** (CSS custom properties, drop-in):

```css
:root,
[data-theme="light"] {
  --surface-page: #F7F8FA;
  --surface-raised: #FFFFFF;
  --border-default: #DEE1E5;
  --text-primary: #14181F;
  --text-secondary: #6B7480;
  --accent-brand: #14267A;
  --status-success: #2F8F5B;
  --status-caution: #C67C1E;
  --status-danger: #B3433D;
}

[data-theme="dark"] {
  --surface-page: #14181F;
  --surface-raised: #1C2128;
  --border-default: #2C333F;
  --text-primary: #F7F8FA;
  --text-secondary: #9AA2AB;
  --accent-brand: #435EDA;
  --status-success: #7ECFA3;
  --status-caution: #E5B475;
  --status-danger: #D18D89;
}
```

Toggle `data-theme` on the root element — no page reload required, and it can respond to a user preference or `prefers-color-scheme` equally. **No component should ever contain a raw hex value.** If a one-off color need comes up during build, it goes into this table as a new named token first — never inlined.

---

## Part 2 — App Shell

### 2.1 The decision: persistent left sidebar, not top navigation

BRAINS AI is a record-management tool, not a content-browsing site — a founder juggles multiple ideas at different pipeline stages and needs to jump between them constantly. That's the exact shape of product where a sidebar wins over top nav (Linear, Notion, Stripe's dashboard, Claude.ai itself all use this for the same underlying reason). Top nav is correct for the marketing site later; it would be wrong here.

### 2.2 Shell anatomy

```
┌──────────────┬────────────────────────────────────────────────────┐
│              │  Top bar: breadcrumb / pipeline stepper / actions  │
│   SIDEBAR    ├────────────────────────────────────────────────────┤
│  240px/64px  │                                                    │
│  collapsible │              MAIN CONTENT (max-width 960px)        │
│              │                                                    │
└──────────────┴────────────────────────────────────────────────────┘
```

**Sidebar:**
- Top: logo mark (icon-only when collapsed) + collapse toggle
- `+ New Idea` — full-width, `--accent-brand` filled, the single most visually prominent element in the sidebar, always
- Ideas list: name, status badge, score chip if past gate_review, recency-sorted with a status filter — flat list, not folders/tags (right amount of structure at current scale — see 2.3 note on future portfolio growth)
- Secondary nav (below a hairline divider): `Engage`, `Billing & Account`
- Bottom: avatar/account menu (profile, logout, theme toggle once dark ships)
- Collapse: manual toggle to icon-only rail; automatic collapse under 1024px; off-canvas drawer under 768px (breakpoints per §1.4)

**Top bar:**
- Breadcrumb/title — idea name + version tag (e.g. "v2") when inside an idea
- Pipeline stepper (inside an idea only): Entry · Research · Validate · Decide, current stage in `--accent-brand`, completed stages checked, **every past stage remains clickable** — this is both navigation and a progress indicator, and it's what makes the PRD's "nothing becomes unreachable once you continue" rule actually visible in the UI
- Contextual actions, right-aligned, page-specific (e.g. `Rework Idea` appears here only on the Report page)

### 2.3 Why a list, not a kanban board

Tempting given the pipeline has discrete stages, but kanban earns its complexity at higher idea-volume-per-founder than this product will typically see early on. A sortable list with clear status badges is more legible at this scale and doesn't misrepresent the product as project-management software. **Flag for later:** if the long-term portfolio "what to kill/what to change" reporting (from the original PRD) ends up meaning founders manage a large number of ideas at once, that's the point to revisit this — but that's a call to make with real usage data, not to build for speculatively now.

---

## Part 3 — Component Library

Every component references semantic tokens (§1.8) only. States specified are default / hover / active / focus / disabled unless noted.

### 3.1 Buttons

| Variant | Background | Text | Border | Use for |
|---|---|---|---|---|
| Primary | `--accent-brand` | white | none | The one next action per view |
| Secondary | transparent | `--text-primary` | 1px `--border-default` | Alternate actions |
| Destructive | transparent | `--status-danger` | 1px `--status-danger` @30% | `Kill This Idea`, deletes — outlined, not filled, so it never visually competes with Primary until deliberately hovered |
| Ghost | transparent | `--text-secondary` | none | `Cancel`, `Skip` |
| Icon button | transparent | `--text-secondary` | none | Compact actions, 32px min hit target |

Height 40px default / 32px compact (tables, cards) / 48px (only the entry-point's primary CTA). Padding 16px horizontal. Radius 6px. Hover = 6% shift, active = 12%, focus = 2px `--accent-brand` outline at 2px offset, disabled = 40% opacity, no pointer events.

**Rule:** never two Primary buttons in one view.

### 3.2 Inputs & form controls

- **Text/textarea:** 1px `--border-default`, 8px radius, 12px/14px padding. Focus: border → `--accent-brand`, 2px, no shadow glow.
- **Validation error state:** border → `--status-danger`, inline message below (per §1.7's voice rule), error icon inside the field's trailing edge.
- **Validation success state** (used sparingly — e.g. confirming a fetched product link resolved): border → `--status-success` momentarily, no persistent green — success isn't a state to dwell on visually.
- **Segmented control** (Entry's stage selector): pill container, selected segment filled `--accent-brand` + white text — the only non-status, non-badge use of a filled pill, reserved deliberately.
- **Slider** (Fast Track N): track `--border-default`, filled portion `--accent-brand`, white handle — live estimate updates next to it in real time, no separate "calculate" step.
- **Toggle:** filled `--accent-brand` on, `--border-default` off.
- **Checkbox/radio:** 18px, `--accent-brand` fill + white check when selected, 1.5px `--border-default` otherwise.

### 3.3 Cards

Flat (list rows, secondary content) and raised (Dashboard idea cards, Score card, modals) — no third elevation level.

**Idea card:**
```
┌────────────────────────────────────────────┐
│ Idea name (Display M)                [●●●] │ ← overflow menu, hover-only
│ One-line description (Body M, --text-secondary) │
│ [Status Badge]              Score: 72  v3   │
│ Updated 2 days ago                          │
└────────────────────────────────────────────┘
```
Whole card is clickable; hover = shadow deepens slightly, 120ms.

### 3.4 Status badges

Pill (999px radius), 4px/10px padding, Caption text, always word + color together (never color alone).

| Status | Tint | Text |
|---|---|---|
| Draft / Researching | `--border-default` tint | `--text-secondary` |
| Validating | `--accent-brand` @10% | `--accent-brand` |
| Gate Review | `--status-caution` @10% | `--status-caution` |
| Passed / Go Ahead | `--status-success` @10% | `--status-success` |
| Needs Rework / Rethink | `--status-caution` @10% | `--status-caution` |
| Killed | `--status-danger` @10% | `--status-danger` |

### 3.5 The Score gauge

270° arc (not a full circle — the gap reads as a gauge, not a donut chart), track `--border-default`, progress arc `--accent-brand`. Center number: **Data L, always** — never the display sans, in every context it appears. Large (~160px) on the Report page, animated 0→score over 600ms on load; small (~32px) on Dashboard cards, static, no animation (motion budget is spent once, on the report reveal — not repeated per card render).

### 3.6 Tables

48px row height default, 40px in dense/Ops contexts. Sortable headers: Caption, `--text-secondary`, arrow on hover, active sort in `--text-primary`. Row hover: ~3% background shift. Hairline row borders, no zebra striping — more precise at this data density, less decorative.

### 3.7 Modals

Reserved for irreversible/high-consequence actions only — `Kill This Idea` confirmation, Fast Track payment confirmation, account deletion. Never for routine multi-step flows (those live on their own pages). Max-width 480px, `--surface-raised`, 12px radius, scrim `--text-primary` @40%. Actions right-aligned, Secondary left of Primary/Destructive.

### 3.8 Toasts

Reversible, low-consequence confirmations only ("Draft saved," "Response logged"). Bottom-right, `--surface-raised`, 8px radius, 4s auto-dismiss, manually dismissible. Never used for the decision-gate outcome — that gets a full page, not something that can be missed.

### 3.9 Tabs

Underline style (2px `--accent-brand` on active, `--text-secondary` inactive) — not pill/boxed, so tabs read distinctly from the segmented control and status badges, which are the only two places filled pills appear.

### 3.10 Tooltips

Always `--text-primary`-dark background regardless of active theme (the one element that doesn't invert — it should always read as an overlay), white text, 6px radius, 400ms hover delay. Used for truncated names, risk-factor explanations, icon-only button labels.

### 3.11 Progress indicators (non-score)

Linear bar for Fast Track order tracking ("3 of 8 scheduled") — `--border-default` track, `--accent-brand` fill, fraction shown as text alongside (never rely on bar length alone). This is the one legitimate literal progress bar, since it tracks a real count toward a known total. Everywhere else (research agent processing), use a narrative status line instead — nothing to show a percentage of yet.

### 3.12 Empty states

Second-person invitation + the relevant action inline, never a decorative illustration. Dashboard's empty state *is* the entry field. Engage's empty state (no communities yet) is one line linking back to Communities.

### 3.13 Loading states

Per-component skeletons matching the real shape, never a single centered spinner for a whole page. Exception: the Research Agent's ~1–2 minute wait gets a narrative line ("Scanning competitors… Checking community discussions…"), since nothing exists yet to skeleton-fy.

---

## Part 4 — Screens & Flows (App)

Every screen below is built entirely from the components in Part 3 — nothing here should require one-off styling. Each entry gives: route, purpose, exact content, states to design for, primary action(s), and what screen(s) come next, so the sequence and every branch/loop is unambiguous.

### 4.0 Flow overview — step by step

```
 1. B1 Dashboard ──▶ 2. B2 Entry Point ──▶ 3. B3 Research Report ──▶ 4. B4 Track Selection
                                                                            │
                                              ┌─────────────────────────────┴──────────────────────┐
                                              ▼                                                      ▼
                                    5. B5 Normal Track Workspace                         6. B6 Fast Track Estimate & Checkout
                                              │                                                      │
                                              │                                          7. B7 Fast Track Order Status
                                              │                                                      │
                                              └──────────────────┬───────────────────────────────────┘
                                                                  ▼
                                                   (either track, any time) 8. B8 Engage — Social Assistance
                                                                  │
                                                                  ▼
                                                   9. B9 Validation Report / Decision Gate
                                                                  │
                                       ┌──────────────────────────┼──────────────────────────┐
                                       ▼                          ▼                          ▼
                              Proceed to Build            Rework Idea                Kill This Idea
                              (handoff to Build      loops back to B3 or B4         idea archived,
                               phase — future PRD)    with a new version              status = killed
                                                                  │
                                                                  ▼
                                                   10. B10 Idea Version History (always reachable)

  Reachable from anywhere via the sidebar: 1. Dashboard · 8. Engage · 12. Account & Billing
  Reachable from any idea at any time: 11. Idea Detail (full record, every stage's data)
  Internal only, separate auth: 13. Admin/Ops Console
```

The loop (B9 → Rework → B3/B4 → ... → B9 again) is unbounded, per the PRD — the UI must never cap how many times this cycle runs for a given idea.

---

### 4.1 B1 — Dashboard
**Route:** `/dashboard` (also the post-login landing page)
**Purpose:** the founder's home base — portfolio view of every idea, at every stage.
**Components used:** Sidebar (§2.2), Idea card (§3.3), Status badge (§3.4), Score gauge small variant (§3.5), Empty state (§3.12), Loading skeleton (§3.13).
**Content:** grid of idea cards (name, one-line description, status badge, score if past gate_review, last-updated), sortable by status/score/recency.
**States:**
- Empty (new account): the entry field itself renders here directly, per §3.12 — not a "no ideas" message.
- Populated: standard grid.
- Loading: skeleton cards matching the idea-card shape, not a spinner.
**Primary action:** `+ New Idea` (sidebar, always visible) → **B2**.
**Also links to:** any existing idea card → **B11** (Idea Detail) if the idea has progressed past entry, or resumes directly into whichever screen (B3/B4/B5/etc.) matches its current status.

```
┌───────────────┬──────────────────────────────────────────────────────┐
│ [BRAINS AI]   │  Your Ideas                                          │
│ [+ New Idea]  │  ┌────────────────────┐ ┌────────────────────┐      │
│ Ideas         │  │ AI meal planner    │ │ Freelance invoicing │      │
│  ● Meal plan..│  │ for busy parents   │ │ tool for designers  │      │
│  ● Invoicing  │  │ [Validating]       │ │ [Passed]  Score 81  │      │
│  ○ Old idea   │  └────────────────────┘ └────────────────────┘      │
│ ─────────     │  ┌────────────────────┐                             │
│ Engage        │  │ Old idea, killed   │                             │
│ Billing       │  │ [Killed]           │                             │
│ [Avatar] ▾    │  └────────────────────┘                             │
└───────────────┴──────────────────────────────────────────────────────┘
```

---

### 4.2 B2 — New Idea: Entry Point
**Route:** `/ideas/new`
**Purpose:** capture the idea and the founder's current stage; persist immediately so nothing is lost.
**Components used:** Text input/textarea, Segmented control (§3.2), file upload control, Button (§3.1).
**Content:**
- Description textarea ("What are you building?")
- Segmented control: `Idea only` / `MVP built, no users` / `Live with users`
- **Dynamic by stage** — Idea-only shows nothing further beyond audience; MVP/Live shows a single "link to your product" field, nothing else
- Target audience field
- Optional file upload (pitch deck/docs)
**States:**
- Idea-only: link/metrics fields absent from layout entirely, not just hidden.
- Link submitted: "Reading your product page…" loading state → editable auto-fetched summary card (rating, review themes) for confirmation.
- Fetch failed: graceful fallback to manual entry, framed as normal, not an error dead-end.
**Primary action:** `Continue` → creates the idea record immediately on submit (before any agent runs) and transitions to **B3**.

---

### 4.3 B3 — Research Report
**Route:** `/ideas/:id/research`
**Purpose:** show problem-strength signal, competitive landscape, and agent-proposed changes before any validation spend.
**Components used:** Status badge (repurposed for problem-strength: weak/moderate/strong using Rethink/neutral/Go-Ahead colors), Card (flat, for competitor list), accept/reject/edit proposal card (a variant of Card + Button group), narrative loading state (§3.13).
**Content:** problem-strength badge, competitor cards with source links, 3–5 proposed-change cards (each individually acceptable/rejectable/editable — accepting patches the idea's structured fields directly).
**States:** loading with a real progress narrative ("Scanning competitors… Checking community discussions… Drafting suggestions…"), not a generic spinner — this step takes 1–2 minutes.
**Primary action:** `Continue to Validation` → **B4**. (Also reachable later, read-only, from the pipeline stepper in the top bar or from **B11**.)

---

### 4.4 B4 — Validation Track Selection
**Route:** `/ideas/:id/validation`
**Purpose:** the Normal vs. Fast Track decision point.
**Components used:** Card (raised, side-by-side comparison), Slider (§3.2) for an inline Fast Track estimate preview.
**Content:** two comparison cards (Normal: free, self-serve, 10+ interviews; Fast Track: paid, BRAINS-run, N experts, 1–2 week turnaround), Fast Track card includes a live cost preview using the Estimation Agent.
**Primary action:** `Start Normal Track` → **B5**, or `Get Fast Track Estimate` → **B6**.

---

### 4.5 B5 — Normal Track Workspace
**Route:** `/ideas/:id/validation/normal`
**Purpose:** the self-serve validation workspace.
**Components used:** Tabs (§3.9) — Communities / Script / Responses — Table (§3.6) for the response log, running confirmation % in Data M mono.
**Content:**
- **Communities tab:** list with example thread links (from the Signal Scanning Agent)
- **Script tab:** editable interview/survey script
- **Responses tab:** log table (confirmed yes/no/unsure, notes, source), running count and confirmation % always visible
**States:** soft nudge banner below 10 responses ("10+ responses gives a more reliable signal — you're at 4"), not a hard block.
**Primary action:** `Finish & Analyze` (disabled-with-explanation below 10, overridable) → **B9**.
**Side branch:** the Communities tab links directly into **B8** (Engage) at any point — a founder can start drafting posts/comments before finishing interviews.

---

### 4.6 B6 — Fast Track: Estimate & Checkout
**Route:** `/ideas/:id/validation/fast-track/checkout`
**Purpose:** N selection, live cost breakdown, payment.
**Components used:** Slider (§3.2), itemized cost display (Data M mono for numbers), payment form (Stripe embed).
**Content:** N stepper/slider, itemized breakdown (cost/interview × N + analysis fee = total) updating live, checkout embed.
**States:** estimate loading, payment processing, payment failed (clear retry, no data loss), payment success → **B7**.
**Primary action:** `Confirm & Pay`.

---

### 4.7 B7 — Fast Track: Order Status
**Route:** `/ideas/:id/validation/fast-track/status`
**Purpose:** progress tracker while BRAINS sources and runs interviews.
**Components used:** Linear progress indicator (§3.11) — the one legitimate literal progress bar in the product.
**Content:** "X of N scheduled," "X of N completed," estimated completion date, notification preference toggle.
**States:** pending_sourcing → scheduling → in_progress → completed (auto-transitions to **B9** once complete).

---

### 4.8 B8 — Engage: Social Media Assistance
**Route:** `/ideas/:id/engage` (also reachable idea-independent from the sidebar, for the Continued Social Scan subscription)
**Purpose:** Post Drafting + Comment Drafting agent output; guide-not-post, both tiers.
**Components used:** Tabs (§3.9) — Posts to publish / Comments to leave — Card (flat) per draft, checkbox + Button.
**Content:** each draft shown with edit box, "I edited this" checkbox that unlocks `Mark as posted` (soft nudge, not a hard block), and a "log the reply" mini-form once a response comes back (feeds the same response pool used in B5/B9).
**States:** empty (no communities yet → links back to B5's Communities tab), draft-generation loading.
**Primary action:** none singular — an ongoing workspace, revisited over time.

---

### 4.9 B9 — Validation Report / Decision Gate
**Route:** `/ideas/:id/report`
**Purpose:** the single most important screen in the product.
**Components used:** Score gauge large variant (§3.5), Signal badge (Go Ahead/Rethink — Status badge §3.4), Table (§3.6) for raw responses, accept/reject/edit proposal card (same component as B3), Button group (Proceed/Rework/Kill), Modal (§3.7) for the Kill confirmation.
**Content, top to bottom:**
1. **Score** (animated on load) + **Signal badge**
2. **Summary** (themes, notable points, objections — plain prose from the Validation Synthesis Agent)
3. **All raw responses** — filterable table (channel: interview/survey/social, confirmed/unsure/no, source, notes) — always accessible, never hidden behind the summary
4. **Risk factors**, called out individually (sample size, source diversity, channel mix, etc.)
5. **Improvement proposal** — accept/reject/edit cards
6. **Decision buttons:** `Proceed to Build` / `Rework Idea` / `Kill This Idea` — Rework is visually emphasized only when the signal is Rethink; otherwise all three sit at equal visual weight
**States:** below-threshold sample size shown as a prominent risk-factor callout, not fine print.
**Primary action:** one of the three decision buttons, each with a clear confirming state change (Kill routes through the Modal per §3.7; Proceed/Rework do not need a modal — they're not destructive).
**Next screen:** Rework → back to **B3** or **B4** (new version created); Kill → idea archived, returns to **B1**; Proceed → handoff point for the (future) Build phase, for now returns to **B1** with status `passed`.

---

### 4.10 B10 — Idea Version History
**Route:** `/ideas/:id/versions`
**Purpose:** the rework-loop timeline.
**Components used:** vertical timeline (custom, built from Card + connecting line), Status badge per version node.
**Content:** v1 → v2 → v3… each node showing a one-line summary of what changed, current version highlighted, click into any past version's full report (read-only, reuses B9's layout in a non-editable state).
**Primary action:** `Start new rework` from the latest version, or resume an in-progress version.

---

### 4.11 B11 — Idea Detail (full record)
**Route:** `/ideas/:id`
**Purpose:** the canonical single-idea view — the idea-state JSON made human-readable; always reachable, nothing becomes unreachable once a founder continues past a stage.
**Components used:** Tabs (§3.9) mirroring pipeline stages — Entry / Research / Validation / Decision — each showing that stage's data even after the idea has moved past it.
**Content:** read access to every stage's output for this idea, regardless of current status.

---

### 4.12 B12 — Account & Billing
**Route:** `/account`
**Purpose:** standard account settings.
**Components used:** Text input, Toggle (theme switch once dark ships), Table (invoice history).
**Content:** profile, password, connected payment method, Continued Social Scan subscription management, invoice history.

---

### 4.13 B13 — Admin/Ops Console *(internal only — separate auth)*
**Route:** `ops.brains-ai.com` (separate subdomain/auth, not customer-facing)
**Purpose:** run the operational side of Fast Track.
**Components used:** Table (dense variant, §3.6), form controls for pricing config.
**Content:** expert pool management (add/edit experts, niche tags, ratings), pricing config editor, Fast Track order queue (sourcing/scheduling status), agent run logs viewer.
**Note:** deliberately not held to the same polish bar as the customer product — clarity and density over delight, since Ops needs to move fast through many records, not be impressed.



---

## Part 5 — Accessibility & quality floor (non-negotiable)

- Contrast: Ink-on-Paper and all semantic tokens meet WCAG AA minimum for body text, in both themes; Score gauge numbers meet AA regardless of theme.
- Visible keyboard focus on every interactive element — 2px `--accent-brand` outline, never a browser default, never removed without a replacement.
- **Tab order** follows visual/reading order: sidebar → top bar → main content, top to bottom within each. Skip-to-content link for keyboard/screen-reader users, hidden until focused.
- Responsive down to 375px — the Report page needs a genuine mobile stack plan (gauge → summary → responses → actions), not a squeezed desktop layout.
- `prefers-reduced-motion` respected — score gauge and status crossfades snap instantly if set.
- Every status/score conveyed with color *and* text/icon together, never color alone.
- Form errors are announced to assistive tech (`aria-live` region or equivalent), not just visually flagged.

---

## Part 6 — Anti-patterns (what we're deliberately not doing)

Worth stating explicitly so nothing drifts back toward these over time, especially under deadline pressure:

- **No warm-cream-and-terracotta or black-and-neon palette** — the two most common AI-product defaults right now; BRAINS AI's cool, precise palette is a deliberate departure from both.
- **No kanban board on the Dashboard** — see §2.3.
- **No modal wizards for routine flows** — modals are for irreversible actions only.
- **No decorative illustrations in empty states** — every empty state is an invitation with the action inline.
- **No zebra-striped tables** — a hairline border is enough at this density.
- **No scroll-triggered animation or ambient motion** — motion is spent in exactly three places (§1.6).
- **No hardcoded hex values in component code, ever** — everything is a token (§1.8).
- **No mixing icon styles or weights** — one set (Phosphor Regular), consistently.

---

## Appendix — Marketing site (deferred, one decision worth locking now)

The marketing site (brains-ai.com) will use a different shell entirely — top navigation, wider max-width, more decorative license than the app affords itself. That's correct and shouldn't be second-guessed when that phase starts. The one thing worth deciding now, since it affects brand consistency across both properties: **the color tokens, type roles, and the Score gauge itself carry over unchanged** — the marketing site should show the same gauge as social proof (per the original page spec) and use the same Signal blue for its own CTAs, even though its layout and tone can be more expressive than the app's. Everything else about the marketing site is out of scope until that phase begins.
