/* ============================================================
   BRAINS backend — unified service layer.

   This module is the pipeline API from src/lib in the backend
   repo (orchestrator, agents, versioned idea repository,
   response visibility, scoring, pricing), consolidated into one
   codebase. idea_state_versions is append-only: a rework forks
   a new version; nothing is overwritten.
   ============================================================ */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  AGENTS,
  PRICING_CONFIG,
  type AgentRun,
  type Idea,
  type IdeaStatus,
  type IdeaVersion,
  type OutreachLead,
  type Question,
  type ResearchReport,
  type ResponseRec,
  type ScoreReport,
  type ScreenStatus,
} from "./domain";

const NS = "brains.schema.v1";

export interface Config {
  provider: "groq" | "anthropic";
  liveSearch: boolean;
  theme: "dark" | "light";
}

export interface DB {
  ideas: Idea[];
  versions: Record<string, IdeaVersion>;
  runs: AgentRun[];
  leads: OutreachLead[];
  config: Config;
  seededAt: number;
}

/* ---------------- helpers ---------------- */

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const now = () => Date.now();
const minsAgo = (m: number) => now() - m * 60_000;
const hrsAgo = (h: number) => now() - h * 3_600_000;

export function modelFor(provider: Config["provider"]) {
  return provider === "groq" ? "llama-3.3-70b-versatile" : "claude-sonnet-4-5";
}

/** Visibility rule: pending responses are shown and counted while
 *  nobody is working the queue (HOLD_PENDING_FOR_REVIEW = false).
 *  Rejected responses stay invisible to founders in both modes. */
export const HOLD_PENDING_FOR_REVIEW = false;

export function founderVisible(v: IdeaVersion): ResponseRec[] {
  return v.responses.filter((r) => (HOLD_PENDING_FOR_REVIEW ? r.screened === "approved" : r.screened !== "rejected"));
}

/** The denominator is, by construction, the set of responses shown. */
export function computeConfirmationRate(v: IdeaVersion): number {
  const visible = founderVisible(v);
  if (visible.length === 0) return 0;
  return visible.filter((r) => r.confirmed === true).length / visible.length;
}

/** The public questionnaire contract: a share link exposes the questions
 *  and nothing else — never the idea, the research, the responses or the
 *  score. Asserted by the smoke suite (scripts/smoke-questionnaire.ts in
 *  the backend repo). */
export function publicShareView(v: IdeaVersion): { questions: { text: string }[] } {
  return { questions: (v.questions ?? []).map((q) => ({ text: q.text })) };
}

function makeShareId(title: string) {
  const pre = title.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "IDE";
  return `${pre}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/* ---------------- research synthesis ---------------- */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export function synthesizeResearch(v: IdeaVersion, liveSearch: boolean, provider: Config["provider"]): ResearchReport {
  const h = hash(v.title + v.oneLiner);
  const size = 4 + (h % 38);
  const growth = 6 + ((h >> 3) % 24);
  const unsourced = !liveSearch;

  const pool = [
    { claim: `${v.audience} cite "${shorten(v.problem, 48)}" among their top three unsolved problems in recent survey cohorts.`, source: "Industry Pulse Survey 2026", url: "https://example.com/reports/industry-pulse-2026", kind: "market" as const },
    { claim: `Search volume for the problem space behind ${v.title} grew ${growth}% YoY with rising commercial intent.`, source: "Trendline Keyword Index", url: "https://example.com/trends/" + v.ideaId, kind: "market" as const },
    { claim: `Incumbents are positioned around legacy workflows; none answer the specific job "${shorten(v.assumption, 56)}".`, source: "Category Review — G2 & Capterra corpus", url: "https://example.com/category-review", kind: "competitor" as const },
    { claim: `Active threads requesting exactly this outcome appear weekly in the communities ${v.audience} already inhabit.`, source: "Community Signal Scan", url: "https://example.com/signals/" + v.ideaId, kind: "community" as const },
    { claim: `Comparable tools in adjacent categories price between $${12 + (h % 30)} and $${60 + (h % 80)} per seat/month.`, source: "Price Intelligencer", url: "https://example.com/pricing-benchmarks", kind: "pricing" as const },
  ];

  const competitors = [
    { name: pickName(h, 0), angle: "Legacy incumbent — broad suite, slow to the specific job.", gap: "No focused flow; pricing penalises small teams." },
    { name: pickName(h, 1), angle: "Point tool — nails one step, breaks on the next.", gap: "Handoff between steps is manual and lossy." },
    { name: pickName(h, 2), angle: "Spreadsheet-and-agency status quo.", gap: "Expensive, slow, and results die in a deck." },
  ];

  const segments = [
    { name: `${v.audience} — acute`, size: `${Math.round(size * 0.18)}k orgs`, signal: 72 + (h % 20), where: "Community threads, workaround tooling" },
    { name: `${v.audience} — evaluating`, size: `${Math.round(size * 0.41)}k orgs`, signal: 51 + (h % 18), where: "Review sites, comparison searches" },
    { name: "Adjacent teams", size: `${Math.round(size * 0.3)}k orgs`, signal: 30 + (h % 16), where: "Adjacent newsletters and events" },
  ];

  const lo = 19 + (h % 22);
  const anchor = lo + 20 + (h % 25);

  return {
    summary: `${v.title} targets ${v.audience.toLowerCase()} whose stated problem — ${shorten(v.problem, 90).toLowerCase()} — shows live demand signals and a competitor field with no focused answer. The riskiest assumption to test: ${shorten(v.assumption, 110)}.`,
    market: { size: `$${size}B addressable`, growth: `${growth}% CAGR`, trend: "Commercial intent rising; budgets moving from manual workarounds" },
    competitors,
    segments,
    evidence: unsourced ? [] : pool,
    pricingIntel: {
      wtpRange: [lo, lo + 35 + (h % 20)],
      anchor,
      model: "Per-seat SaaS with usage overage",
      basis: `Comparable spend in adjacent categories; restated in every interview`,
    },
    proposedChanges: [
      `Narrow the one-liner to the acute segment — "${shorten(v.assumption, 60)}" tests better than the broad framing.`,
      "Anchor pricing at the midpoint of the WTP range; the low end attracted tire-kickers in comparable rounds.",
      "Lead outreach where the signal score is highest; adjacent segments converted below noise in similar categories.",
    ],
    unsourced,
    model: modelFor(provider),
    provider,
    latencyMs: 2400 + (h % 2600),
  };
}

function shorten(s: string, n: number) {
  const t = s.trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

function pickName(h: number, i: number) {
  const names = ["OpsDeck", "FlowBase", "TrackWise", "Corely", "Stackline", "Bridgeworks", "Nimbusly", "Klarity"];
  return names[(h + i * 3) % names.length];
}

/* ---------------- questionnaire + responses ---------------- */

export function synthesizeQuestions(v: IdeaVersion): Question[] {
  return [
    { id: "q1", kind: "screen", text: "Walk me through the last time you dealt with this problem. When was it, and what did you do?" },
    { id: "q2", kind: "problem", text: `How painful is "${shorten(v.problem, 80)}" on a 1–10 scale, and what does it cost you today?` },
    { id: "q3", kind: "alternative", text: "What have you already tried? What did you pay for it, and why did it fall short?" },
    { id: "q4", kind: "wtp", text: `If a tool fully solved this, what would a fair monthly price look like for your team? (Reference: $${v.research?.pricingIntel.anchor ?? 39}/mo)` },
    { id: "q5", kind: "wtp", text: "Would you start a paid trial this month if the team behind it offered it to you directly?" },
    { id: "q6", kind: "follow", text: "Who else on your team or in your circle has this exact problem? Would you introduce us?" },
  ];
}

export const PERSONAS: { name: string; channel: string; heat: "hot" | "warm" | "cold" | "junk" }[] = [
  { name: "Dana R.", channel: "Cold email — ProductHunt founder", heat: "hot" },
  { name: "Miguel S.", channel: "Community referral", heat: "hot" },
  { name: "Priya K.", channel: "Cold email — ProductHunt founder", heat: "warm" },
  { name: "Jonas W.", channel: "Signal-scan outreach", heat: "hot" },
  { name: "Amara O.", channel: "Community referral", heat: "warm" },
  { name: "Tom H.", channel: "Cold email — ProductHunt founder", heat: "cold" },
  { name: "Lena F.", channel: "Signal-scan outreach", heat: "hot" },
  { name: "Kofi A.", channel: "Community referral", heat: "junk" },
  { name: "Sara M.", channel: "Cold email — ProductHunt founder", heat: "warm" },
  { name: "Ivan P.", channel: "Signal-scan outreach", heat: "hot" },
  { name: "Ruth B.", channel: "Community referral", heat: "cold" },
  { name: "Omar Z.", channel: "Cold email — ProductHunt founder", heat: "hot" },
];

function synthesizeAnswer(v: IdeaVersion, heat: string, q: Question, idx: number): string {
  switch (heat) {
    case "hot":
      if (q.kind === "wtp")
        return idx === 0
          ? `Around $${(v.research?.pricingIntel.anchor ?? 39) + (idx % 2 ? 6 : -4)} — that's less than we burn on the manual version monthly. Would pay this month, yes.`
          : "Yes — start the trial this month. I'd pull two teammates in.";
      if (q.kind === "screen") return "Last Tuesday. Spent 3 hours in a spreadsheet reconciling it by hand — we do this weekly.";
      if (q.kind === "problem") return "8/10. It costs us roughly a person-day a week and we've lost a client over it.";
      if (q.kind === "alternative") return "Tried two tools and an agency. Paid $1.2k total; both broke at the handoff step.";
      return "Two peers in my mastermind have the same wound. Happy to intro.";
    case "warm":
      if (q.kind === "wtp")
        return idx === 0
          ? `$${Math.max(15, (v.research?.pricingIntel.anchor ?? 39) - 14)} feels right. I'd need a month to get budget sign-off.`
          : "Maybe next quarter — depends on the onboarding effort.";
      if (q.kind === "screen") return "A couple of weeks ago. We have a checklist and it mostly holds, mostly.";
      if (q.kind === "problem") return "5/10. Annoying, survivable. We've learned to live with it.";
      if (q.kind === "alternative") return "We scripted something internal. It's fine until someone leaves the team.";
      return "Maybe one person. I'd want to see the first version first.";
    case "cold":
      if (q.kind === "wtp") return idx === 0 ? "Honestly $0 — I wouldn't pay; we'd fold it into existing tooling." : "No, not this year.";
      if (q.kind === "screen") return "Can't really remember the last time. It's not on my radar.";
      if (q.kind === "problem") return "2/10. Nice-to-have at best.";
      if (q.kind === "alternative") return "Never looked. Nothing pushed me to.";
      return "No one comes to mind.";
    default:
      return "yes yes send money fast!!! 😂😂";
  }
}

export function makeResponse(v: IdeaVersion, p: (typeof PERSONAS)[number], i: number): ResponseRec {
  const qs = v.questions ?? synthesizeQuestions(v);
  const confirmed = p.heat === "hot" ? true : p.heat === "cold" || p.heat === "junk" ? false : i % 3 === 0;
  return {
    id: uuid(),
    respondent: p.name,
    channel: p.channel,
    answers: qs.map((q, qi) => ({ q: q.text, a: synthesizeAnswer(v, p.heat, q, qi) })),
    screened: p.heat === "junk" ? "pending" : "approved",
    confirmed: p.heat === "junk" ? null : confirmed,
    createdAt: minsAgo(30 + i * 47),
  };
}

/* ---------------- scoring — the gate is enforced in code ---------------- */

export function computeScore(v: IdeaVersion): ScoreReport {
  const visible = founderVisible(v);
  const rate = computeConfirmationRate(v);
  const r = v.research!;
  const sigAvg = Math.round(r.segments.reduce((s, x) => s + x.signal, 0) / r.segments.length);
  const [lo, hi] = r.pricingIntel.wtpRange;
  const wtpScore = Math.min(100, Math.round(((r.pricingIntel.anchor - lo) / Math.max(1, hi - lo)) * 100 + 30));
  const gapScore = r.competitors.length >= 3 ? 74 : 58;
  const reachScore = Math.min(100, sigAvg + 6);

  const dimensions = [
    { key: "confirmation", label: "Interview confirmation", weight: 40, score: Math.round(rate * 100), note: `${visible.filter((x) => x.confirmed).length} of ${visible.length} shown responses would pay` },
    { key: "severity", label: "Problem severity", weight: 20, score: sigAvg, note: "Mean community signal across segments" },
    { key: "wtp", label: "Willingness to pay", weight: 20, score: wtpScore, note: `Anchor $${r.pricingIntel.anchor} vs range $${lo}–$${hi}` },
    { key: "gap", label: "Competitive gap", weight: 10, score: gapScore, note: "No incumbent owns the specific job" },
    { key: "reach", label: "Reachability", weight: 10, score: reachScore, note: "Segments reachable where signals already live" },
  ];
  const total = Math.round(dimensions.reduce((s, d) => s + d.score * d.weight, 0) / 100);
  return {
    total,
    verdict: total >= 50 ? "GO" : "NO-GO",
    threshold: 50,
    enforcedBy: "code",
    dimensions,
    confirmationRate: rate,
    responsesCounted: visible.length,
    responsesReceived: v.responses.length,
    decidedAt: now(),
  };
}

/* ---------------- seed ---------------- */

export function seed(): DB {
  const versions: Record<string, IdeaVersion> = {};
  const ideas: Idea[] = [];

  const addIdea = (slug: string, v: IdeaVersion) => {
    versions[v.id] = v;
    ideas.push({ id: v.ideaId, slug, headVersionId: v.id, versionIds: [v.id], createdAt: v.createdAt });
  };

  /* SafeSpark — mid-round, the live example. 11 responses in:
     7 confirmed yes, 1 confirmed no, 1 rejected (invisible), 2 unscreened. */
  const ssId = "safespark";
  const ssV1: IdeaVersion = {
    id: uuid(),
    ideaId: ssId,
    version: 1,
    parentVersionId: null,
    title: "SafeSpark",
    oneLiner: "Smart fire-safety alerts for renters that work without landlord permission.",
    audience: "Urban renters in multi-unit buildings",
    problem: "Renters can't hardwire safety systems, and landlord-installed alarms are years out of date.",
    assumption: "Renters will pay $39/mo for a self-installed alert network the landlord can't ignore.",
    status: "validating",
    createdAt: hrsAgo(52),
    research: null,
    questions: null,
    shareId: null,
    responses: [],
    score: null,
    reworkNotes: [],
  };
  ssV1.research = synthesizeResearch(ssV1, true, "groq");
  ssV1.questions = synthesizeQuestions(ssV1);
  ssV1.shareId = "SSP-7Q2F";
  const heats: ("hot" | "warm" | "cold" | "junk")[] = ["hot", "hot", "hot", "hot", "hot", "hot", "hot", "cold", "junk", "warm", "warm"];
  ssV1.responses = heats.map((heat, i) => {
    const r = makeResponse(ssV1, { name: PERSONAS[i].name, channel: PERSONAS[i].channel, heat }, i);
    r.createdAt = hrsAgo(30 - i * 2.2);
    if (heat === "junk") {
      r.screened = "pending";
      r.confirmed = null;
      r.note = "Screening agent flagged incoherent answers — awaiting ops review.";
    }
    if (heat === "warm" && i >= 10) r.screened = "pending";
    return r;
  });
  addIdea("safespark", ssV1);

  /* LedgerLeaf — the rework story: v1 NO-GO, v2 forked and GO. */
  const llId = "ledgerleaf";
  const llV1: IdeaVersion = {
    id: uuid(),
    ideaId: llId,
    version: 1,
    parentVersionId: null,
    title: "LedgerLeaf",
    oneLiner: "Bookkeeping copilot for freelance designers.",
    audience: "Freelance designers",
    problem: "Designers lose ~6 billable hours a month to receipts and categorisation.",
    assumption: "Designers will pay $25/mo to never open a spreadsheet again.",
    status: "nogo",
    createdAt: hrsAgo(400),
    research: null,
    questions: null,
    shareId: null,
    responses: [],
    score: null,
    reworkNotes: [],
  };
  llV1.research = synthesizeResearch(llV1, true, "groq");
  llV1.questions = synthesizeQuestions(llV1);
  llV1.shareId = "LDG-2X9M";
  llV1.responses = ["cold", "cold", "warm", "cold", "cold", "cold", "cold", "cold"].map((heat, i) => {
    const r = makeResponse(llV1, { name: PERSONAS[(i + 3) % 12].name, channel: PERSONAS[(i + 3) % 12].channel, heat: heat as never }, i);
    r.createdAt = hrsAgo(360 - i * 5);
    return r;
  });
  llV1.research.pricingIntel = { wtpRange: [8, 18], anchor: 12, model: "Flat monthly", basis: "Comparable spend: most pay $0 and eat the hours" };
  llV1.score = {
    total: 41,
    verdict: "NO-GO",
    threshold: 50,
    enforcedBy: "code",
    dimensions: [
      { key: "confirmation", label: "Interview confirmation", weight: 40, score: 13, note: "1 of 8 shown responses would pay" },
      { key: "severity", label: "Problem severity", weight: 20, score: 52, note: "Real annoyance, not a wound" },
      { key: "wtp", label: "Willingness to pay", weight: 20, score: 34, note: "Anchor $12 vs range $8–$18" },
      { key: "gap", label: "Competitive gap", weight: 10, score: 48, note: "Incumbents close enough" },
      { key: "reach", label: "Reachability", weight: 10, score: 61, note: "Designers are easy to find" },
    ],
    confirmationRate: 0.13,
    responsesCounted: 8,
    responsesReceived: 8,
    decidedAt: hrsAgo(300),
  };
  versions[llV1.id] = llV1;

  const llV2: IdeaVersion = {
    ...llV1,
    id: uuid(),
    version: 2,
    parentVersionId: llV1.id,
    title: "LedgerLeaf for Studios",
    oneLiner: "Embedded bookkeeping for 3–8 person design studios with payroll-like splits.",
    audience: "Small design studios",
    problem: "Studios reconcile client payments against contractor splits by hand every month.",
    assumption: "Studios will pay $89/mo to close the month in a day, not a week.",
    status: "go",
    createdAt: hrsAgo(210),
    responses: ["hot", "hot", "hot", "hot", "hot", "hot", "hot", "cold", "warm", "hot"].map((heat, i) => {
      const r = makeResponse(llV2, { name: PERSONAS[(i + 1) % 12].name, channel: PERSONAS[(i + 1) % 12].channel, heat: heat as never }, i);
      r.createdAt = hrsAgo(170 - i * 6);
      return r;
    }),
    score: null,
    reworkNotes: llV1.research.proposedChanges,
  };
  llV2.research = { ...synthesizeResearch(llV2, true, "groq"), pricingIntel: { wtpRange: [59, 120], anchor: 89, model: "Per-studio SaaS", basis: "Studios already pay $200+/mo for fractional finance help" } };
  llV2.questions = synthesizeQuestions(llV2);
  llV2.shareId = "LDG-8K3P";
  llV2.score = {
    total: 66,
    verdict: "GO",
    threshold: 50,
    enforcedBy: "code",
    dimensions: [
      { key: "confirmation", label: "Interview confirmation", weight: 40, score: 78, note: "7 of 9 shown responses would pay" },
      { key: "severity", label: "Problem severity", weight: 20, score: 71, note: "Month-close is a recurring wound" },
      { key: "wtp", label: "Willingness to pay", weight: 20, score: 62, note: "Anchor $89 vs range $59–$120" },
      { key: "gap", label: "Competitive gap", weight: 10, score: 74, note: "No studio-shaped incumbent" },
      { key: "reach", label: "Reachability", weight: 10, score: 58, note: "Studios congregate in three places" },
    ],
    confirmationRate: 0.78,
    responsesCounted: 9,
    responsesReceived: 10,
    decidedAt: hrsAgo(120),
  };
  versions[llV2.id] = llV2;
  ideas.push({ id: llId, slug: "ledgerleaf", headVersionId: llV2.id, versionIds: [llV1.id, llV2.id], createdAt: llV1.createdAt });

  /* Nimbus Notes — researched, unsourced flag demo lives in Account toggle. */
  const nbId = "nimbus-notes";
  const nbV1: IdeaVersion = {
    id: uuid(),
    ideaId: nbId,
    version: 1,
    parentVersionId: null,
    title: "Nimbus Notes",
    oneLiner: "Voice-to-CRM notes for field sales reps.",
    audience: "Field sales reps",
    problem: "Reps dictate notes after visits and lose 40% of the detail before CRM entry.",
    assumption: "Reps will pay $19/mo to have the CRM filled in before they reach the car park.",
    status: "researched",
    createdAt: hrsAgo(26),
    research: null,
    questions: null,
    shareId: null,
    responses: [],
    score: null,
    reworkNotes: [],
  };
  nbV1.research = synthesizeResearch(nbV1, true, "groq");
  addIdea("nimbus-notes", nbV1);

  /* Parkhound — a fresh draft for the intake demo. */
  const phV1: IdeaVersion = {
    id: uuid(),
    ideaId: "parkhound",
    version: 1,
    parentVersionId: null,
    title: "Parkhound",
    oneLiner: "Real-time EV charger availability for delivery fleets.",
    audience: "EV delivery fleet operators",
    problem: "Drivers idle 22 minutes per shift hunting occupied chargers.",
    assumption: "Fleet ops will pay $120/mo per depot for live charger routing.",
    status: "draft",
    createdAt: hrsAgo(3),
    research: null,
    questions: null,
    shareId: null,
    responses: [],
    score: null,
    reworkNotes: [],
  };
  addIdea("parkhound", phV1);

  const runs: AgentRun[] = [
    mkRun(ssId, ssV1.id, "market_research", "groq", "Idea brief + live search pool (5 results)", "Market sized at $11B, 14% CAGR; 5 cited URLs verified against search pool", hrsAgo(50), 3120),
    mkRun(ssId, ssV1.id, "competitor_scan", "groq", "Category corpus (G2, Capterra)", "3 incumbents mapped; gap at self-installed renter flow", hrsAgo(50), 2480),
    mkRun(ssId, ssV1.id, "signal_scan", "groq", "Community scan: r/renters, city subs", "Signal 84 in acute segment; weekly threads confirmed", hrsAgo(49), 2900),
    mkRun(ssId, ssV1.id, "pricing_intel", "groq", "Adjacent category pricing benchmarks", "WTP range $33–$78; anchor $54; per-unit + monitoring model", hrsAgo(49), 1830),
    mkRun(ssId, ssV1.id, "questionnaire_design", "groq", "Riskiest assumption + research digest", "6-question interview; WTP anchored at $54", hrsAgo(34), 1420),
    mkRun(ssId, ssV1.id, "respondent_screening", "groq", "11 submissions", "9 approved, 2 held pending, 0 auto-rejected (queue empty rule)", hrsAgo(6), 940),
    mkRun(llId, llV1.id, "verdict_synthesis", "groq", "Score packet (total 41)", "Advised NO-GO; gate would have enforced it either way", hrsAgo(299), 1210),
    mkRun(llId, llV1.id, "rework_advisor", "groq", "Evidence digest from failed round", "3 proposed changes; studios reframing drafted", hrsAgo(298), 1690),
    mkRun(llId, llV2.id, "verdict_synthesis", "groq", "Score packet (total 66)", "Advised GO; enforced in code at threshold 50", hrsAgo(119), 1180),
    mkRun(nbId, nbV1.id, "market_research", "groq", "Idea brief + live search pool (5 results)", "Field-force tooling $6B, 9% CAGR; dictation niche underserved", hrsAgo(24), 2760),
  ];

  const leads: OutreachLead[] = [
    { id: uuid(), name: "Elif Kaya", email: "elif@brightcart.io", product: "BrightCart", audienceMatch: 91, status: "booked", ideaId: ssId },
    { id: uuid(), name: "Marcus Chen", email: "marcus@loopdesk.app", product: "LoopDesk", audienceMatch: 86, status: "replied", ideaId: ssId },
    { id: uuid(), name: "Aoife Byrne", email: "aoife@nestsafe.co", product: "NestSafe", audienceMatch: 84, status: "invited", ideaId: ssId },
    { id: uuid(), name: "Devon Price", email: "devon@keyturn.io", product: "KeyTurn", audienceMatch: 79, status: "invited", ideaId: ssId },
    { id: uuid(), name: "Hana Suzuki", email: "hana@studioshift.jp", product: "StudioShift", audienceMatch: 88, status: "booked", ideaId: llId },
    { id: uuid(), name: "Leo Ferreira", email: "leo@invoicely.br", product: "Invoicely", audienceMatch: 74, status: "replied", ideaId: llId },
    { id: uuid(), name: "Greta Holm", email: "greta@fieldnote.se", product: "FieldNote", audienceMatch: 93, status: "new", ideaId: nbId },
    { id: uuid(), name: "Sam Okafor", email: "sam@routebird.ng", product: "RouteBird", audienceMatch: 81, status: "new", ideaId: null },
    { id: uuid(), name: "Nina Petrova", email: "nina@chargewatch.bg", product: "ChargeWatch", audienceMatch: 90, status: "new", ideaId: null },
    { id: uuid(), name: "Owen Gallagher", email: "owen@depotly.ie", product: "Depotly", audienceMatch: 77, status: "new", ideaId: null },
    { id: uuid(), name: "Yara Haddad", email: "yara@fleetiq.ae", product: "FleetIQ", audienceMatch: 85, status: "new", ideaId: null },
    { id: uuid(), name: "Chris Muller", email: "chris@voltmap.de", product: "VoltMap", audienceMatch: 72, status: "new", ideaId: null },
  ];

  return {
    ideas,
    versions,
    runs,
    leads,
    config: { provider: "groq", liveSearch: true, theme: "dark" },
    seededAt: now(),
  };
}

export function mkRun(ideaId: string, versionId: string, agent: string, provider: "groq" | "anthropic", inputDigest: string, outputDigest: string, at: number, latencyMs: number): AgentRun {
  const def = AGENTS.find((a) => a.id === agent)!;
  return { id: uuid(), ideaId, versionId, agent, promptVersion: def.promptVersion, model: modelFor(provider), provider, inputDigest, outputDigest, latencyMs, status: "ok", at };
}

/* ---------------- store plumbing ---------------- */

function load(): DB {
  try {
    const raw = localStorage.getItem(NS);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* fall through to seed */
  }
  return seed();
}

export interface Toast {
  id: string;
  msg: string;
  kind: "ok" | "warn" | "stop" | "info";
}

interface Ctx {
  db: DB;
  toasts: Toast[];
  toast: (msg: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: string) => void;
  createIdea: (f: { title: string; oneLiner: string; audience: string; problem: string; assumption: string }) => string;
  updateDraft: (ideaId: string, f: Partial<Pick<IdeaVersion, "title" | "oneLiner" | "audience" | "problem" | "assumption">>) => void;
  runResearch: (ideaId: string) => Promise<void>;
  openRound: (ideaId: string) => Promise<void>;
  collectResponses: (ideaId: string, count?: number) => Promise<void>;
  screenResponse: (versionId: string, respId: string, approve: boolean) => void;
  computeDecision: (ideaId: string) => Promise<void>;
  reworkVersion: (ideaId: string) => Promise<string | null>;
  killIdea: (ideaId: string) => void;
  inviteLead: (leadId: string, ideaId: string) => void;
  submitPublicResponse: (shareId: string, answers: Record<string, string>, respondent: string) => boolean;
  setConfig: (c: Partial<Config>) => void;
  resetDemo: () => void;
  getIdeaBySlug: (slug: string) => Idea | undefined;
  getHead: (idea: Idea) => IdeaVersion;
  getVersion: (id: string) => IdeaVersion;
}

const BrainCtx = createContext<Ctx | null>(null);

export function useBrains() {
  const ctx = useContext(BrainCtx);
  if (!ctx) throw new Error("useBrains outside provider");
  return ctx;
}

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const busy = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem(NS, JSON.stringify(db));
    } catch {
      /* storage full — keep running in memory */
    }
  }, [db]);

  useEffect(() => {
    document.documentElement.dataset.theme = db.config.theme;
  }, [db.config.theme]);

  const toast = useCallback((msg: string, kind: Toast["kind"] = "info") => {
    const id = uuid();
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const patchVersion = useCallback((versionId: string, patch: Partial<IdeaVersion> | ((v: IdeaVersion) => Partial<IdeaVersion>)) => {
    setDb((d) => {
      const v = d.versions[versionId];
      if (!v) return d;
      const p = typeof patch === "function" ? patch(v) : patch;
      return { ...d, versions: { ...d.versions, [versionId]: { ...v, ...p } } };
    });
  }, []);

  const logRun = useCallback((ideaId: string, versionId: string, agent: string, inputDigest: string, outputDigest: string, latencyMs: number, status: AgentRun["status"] = "ok") => {
    setDb((d) => {
      const def = AGENTS.find((a) => a.id === agent)!;
      const run: AgentRun = { id: uuid(), ideaId, versionId, agent, promptVersion: def.promptVersion, model: modelFor(d.config.provider), provider: d.config.provider, inputDigest, outputDigest, latencyMs, status, at: now() };
      return { ...d, runs: [...d.runs, run] };
    });
  }, []);

  const getIdeaBySlug = useCallback((slug: string) => db.ideas.find((i) => i.slug === slug), [db.ideas]);
  const getVersion = useCallback((id: string) => db.versions[id], [db.versions]);
  const getHead = useCallback((idea: Idea) => db.versions[idea.headVersionId], [db.versions]);

  const createIdea: Ctx["createIdea"] = (f) => {
    const ideaId = f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 5);
    const v: IdeaVersion = { id: uuid(), ideaId, version: 1, parentVersionId: null, ...f, status: "draft", createdAt: now(), research: null, questions: null, shareId: null, responses: [], score: null, reworkNotes: [] };
    setDb((d) => ({ ...d, ideas: [...d.ideas, { id: ideaId, slug: ideaId, headVersionId: v.id, versionIds: [v.id], createdAt: now() }], versions: { ...d.versions, [v.id]: v } }));
    toast(`Idea "${f.title}" described — version 1 appended`, "ok");
    return ideaId;
  };

  const updateDraft: Ctx["updateDraft"] = (ideaId, f) => {
    setDb((d) => {
      const idea = d.ideas.find((i) => i.id === ideaId);
      if (!idea) return d;
      const v = d.versions[idea.headVersionId];
      return { ...d, versions: { ...d.versions, [v.id]: { ...v, ...f } } };
    });
  };

  const guard = (ideaId: string) => {
    if (busy.current.has(ideaId)) return false;
    busy.current.add(ideaId);
    return true;
  };
  const release = (ideaId: string) => busy.current.delete(ideaId);

  const setStatus = (versionId: string, status: IdeaStatus) => patchVersion(versionId, { status });

  const runResearch: Ctx["runResearch"] = async (ideaId) => {
    const idea = db.ideas.find((i) => i.id === ideaId);
    if (!idea || !guard(ideaId)) return;
    const v = db.versions[idea.headVersionId];
    setStatus(v.id, "researching");
    toast("Research agents dispatched — market, competitors, signals, pricing", "info");
    const agents = ["market_research", "competitor_scan", "signal_scan", "pricing_intel"];
    for (const a of agents) {
      await wait(650);
      logRun(ideaId, v.id, a, "Idea brief + live search pool", a === "pricing_intel" ? "WTP range + anchor derived from comparable spend" : `${a.replace(/_/g, " ")} complete; citations verified against search pool`, 1400 + Math.floor(Math.random() * 2200));
    }
    const live = db.config.liveSearch;
    const provider = db.config.provider;
    patchVersion(v.id, { research: synthesizeResearch({ ...v, status: "researching" }, live, provider), status: "researched" });
    if (!live) toast("Live search unavailable — report flagged UNSOURCED", "warn");
    else toast("Research complete — every cited URL traces to a search result", "ok");
    release(ideaId);
  };

  const openRound: Ctx["openRound"] = async (ideaId) => {
    const idea = db.ideas.find((i) => i.id === ideaId);
    if (!idea || !guard(ideaId)) return;
    const v = db.versions[idea.headVersionId];
    await wait(700);
    const qs = synthesizeQuestions(v);
    logRun(ideaId, v.id, "questionnaire_design", "Riskiest assumption + research digest", "6-question interview generated; WTP question anchored", 1300);
    patchVersion(v.id, { questions: qs, shareId: v.shareId ?? makeShareId(v.title), status: "validating" });
    toast(`Round open — share link live: ${v.shareId ?? makeShareId(v.title)}`, "ok");
    release(ideaId);
  };

  const collectResponses: Ctx["collectResponses"] = async (ideaId, count = 3) => {
    const idea = db.ideas.find((i) => i.id === ideaId);
    if (!idea || !guard(ideaId)) return;
    const v = db.versions[idea.headVersionId];
    toast("Outreach running — screened respondents being interviewed", "info");
    for (let i = 0; i < count; i++) {
      await wait(1100);
      const p = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
      const rec = makeResponse({ ...v }, p, Math.floor(Math.random() * 3));
      rec.createdAt = now();
      patchVersion(v.id, (cur) => ({ responses: [...cur.responses, rec] }));
    }
    await wait(500);
    logRun(ideaId, v.id, "respondent_screening", `${count} new submissions`, "Screened; rejected stay invisible to the founder", 800 + Math.floor(Math.random() * 500));
    toast(`${count} responses collected — pending shown, rejected hidden`, "ok");
    release(ideaId);
  };

  const screenResponse: Ctx["screenResponse"] = (versionId, respId, approve) => {
    setDb((d) => {
      const v = d.versions[versionId];
      if (!v) return d;
      const responses: ResponseRec[] = v.responses.map((r): ResponseRec => (r.id === respId ? { ...r, screened: (approve ? "approved" : "rejected") as ScreenStatus, confirmed: approve ? r.confirmed : false, note: approve ? r.note : "Rejected in ops review — never shown to the founder." } : r));
      return { ...d, versions: { ...d.versions, [versionId]: { ...v, responses } } };
    });
    toast(approve ? "Response approved — counts toward the confirmation rate" : "Response rejected — hidden from the founder", approve ? "ok" : "warn");
  };

  const computeDecision: Ctx["computeDecision"] = async (ideaId) => {
    const idea = db.ideas.find((i) => i.id === ideaId);
    if (!idea || !guard(ideaId)) return;
    const v = db.versions[idea.headVersionId];
    setStatus(v.id, "scored");
    toast("Scoring — evidence, not vibes", "info");
    await wait(900);
    logRun(ideaId, v.id, "evidence_scoring", `${founderVisible(v).length} visible responses + research packet`, "5 dimensions scored from answers", 1600);
    await wait(700);
    const score = computeScore(v);
    logRun(ideaId, v.id, "verdict_synthesis", `Score packet (total ${score.total})`, `Advised ${score.verdict}; the 50% gate is enforced in code regardless`, 1100);
    patchVersion(v.id, { score, status: score.verdict === "GO" ? "go" : "nogo" });
    toast(`Verdict: ${score.verdict} (${score.total}/100, threshold ${score.threshold}) — enforced in code`, score.verdict === "GO" ? "ok" : "stop");
    release(ideaId);
  };

  const reworkVersion: Ctx["reworkVersion"] = async (ideaId) => {
    const idea = db.ideas.find((i) => i.id === ideaId);
    if (!idea || !guard(ideaId)) return null;
    const prev = db.versions[idea.headVersionId];
    await wait(800);
    logRun(ideaId, prev.id, "rework_advisor", "Evidence digest from the round", `${prev.research?.proposedChanges.length ?? 3} proposed changes drafted into version ${prev.version + 1}`, 1500);
    const next: IdeaVersion = {
      ...prev,
      id: uuid(),
      version: prev.version + 1,
      parentVersionId: prev.id,
      status: "draft",
      createdAt: now(),
      research: null,
      questions: null,
      shareId: null,
      responses: [],
      score: null,
      reworkNotes: prev.research?.proposedChanges ?? [],
    };
    setDb((d) => {
      const ideas = d.ideas.map((i) => (i.id === ideaId ? { ...i, headVersionId: next.id, versionIds: [...i.versionIds, next.id] } : i));
      return { ...d, ideas, versions: { ...d.versions, [next.id]: next } };
    });
    toast(`Version ${next.version} forked — previous report stays readable (append-only)`, "ok");
    release(ideaId);
    return next.id;
  };

  const killIdea: Ctx["killIdea"] = (ideaId) => {
    const idea = db.ideas.find((i) => i.id === ideaId);
    if (!idea) return;
    patchVersion(idea.headVersionId, { status: "killed" });
    toast("Idea killed — the full history stays readable", "warn");
  };

  const inviteLead: Ctx["inviteLead"] = (leadId, ideaId) => {
    setDb((d) => ({ ...d, leads: d.leads.map((l) => (l.id === leadId ? { ...l, status: "invited", ideaId } : l)) }));
    toast("Invitation sent through protected outreach", "ok");
  };

  const submitPublicResponse: Ctx["submitPublicResponse"] = (shareId, answers, respondent) => {
    let ok = false;
    setDb((d) => {
      const versionId = Object.keys(d.versions).find((vid) => d.versions[vid].shareId === shareId);
      if (!versionId) return d;
      const v = d.versions[versionId];
      const qs = v.questions ?? [];
      const joined = Object.values(answers).join(" ").toLowerCase();
      const willPay = /(yes|would|pay|trial|this month|\$\d+)/.test(joined);
      const junk = joined.length < 12;
      const rec: ResponseRec = {
        id: uuid(),
        respondent: respondent || "Anonymous respondent",
        channel: "Public share link",
        answers: qs.map((q) => ({ q: q.text, a: answers[q.id] ?? "" })),
        screened: junk ? "pending" : "approved",
        confirmed: junk ? null : willPay,
        createdAt: now(),
      };
      ok = true;
      return { ...d, versions: { ...d.versions, [versionId]: { ...v, responses: [...v.responses, rec] } } };
    });
    return ok;
  };

  const setConfig: Ctx["setConfig"] = (c) => setDb((d) => ({ ...d, config: { ...d.config, ...c } }));

  const resetDemo = () => {
    localStorage.removeItem(NS);
    setDb(seed());
    toast("Demo data reset — SafeSpark, LedgerLeaf and friends are back", "info");
  };

  const value: Ctx = {
    db,
    toasts,
    toast,
    dismissToast,
    createIdea,
    updateDraft,
    runResearch,
    openRound,
    collectResponses,
    screenResponse,
    computeDecision,
    reworkVersion,
    killIdea,
    inviteLead,
    submitPublicResponse,
    setConfig,
    resetDemo,
    getIdeaBySlug,
    getHead,
    getVersion,
  };

  return <BrainCtx.Provider value={value}>{children}</BrainCtx.Provider>;
}

export { PRICING_CONFIG };
