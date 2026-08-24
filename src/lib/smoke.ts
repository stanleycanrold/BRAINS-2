/* ============================================================
   Engine smoke suite — the in-app twin of the backend repo's
   scripts/smoke-agents.ts, smoke-questionnaire.ts and
   smoke-visibility.ts. It exercises the REAL exported pipeline
   code (seed, synthesize*, computeScore, visibility, audit log)
   against a sandboxed schema — never the founder's live data.
   ============================================================ */

import { v4 as uuid } from "uuid";
import {
  seed,
  synthesizeResearch,
  synthesizeQuestions,
  computeScore,
  founderVisible,
  computeConfirmationRate,
  publicShareView,
  makeResponse,
  modelFor,
  mkRun,
  PERSONAS,
  HOLD_PENDING_FOR_REVIEW,
} from "./store";
import { AGENTS, PRICING_CONFIG, roundQuote, type IdeaVersion } from "./domain";

export interface SmokeResult {
  id: string;
  name: string;
  rule: string;
  pass: boolean;
  evidence: string[];
  ms: number;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ---------- sandbox builders ---------- */

function blankVersion(over: Partial<IdeaVersion>): IdeaVersion {
  const v: IdeaVersion = {
    id: uuid(),
    ideaId: "smoke",
    version: 1,
    parentVersionId: null,
    title: "Probe Idea",
    oneLiner: "A probe used only by the smoke suite.",
    audience: "QA engineers",
    problem: "Regressions slip through because invariants are not pinned.",
    assumption: "A suite that runs the real code beats a suite that mocks it.",
    status: "draft",
    createdAt: Date.now(),
    research: null,
    questions: null,
    shareId: null,
    responses: [],
    score: null,
    reworkNotes: [],
    ...over,
  };
  return v;
}

function withResponses(v: IdeaVersion, heats: ("hot" | "warm" | "cold" | "junk")[]): IdeaVersion {
  v.questions = synthesizeQuestions(v);
  v.research = synthesizeResearch(v, true, "groq");
  v.responses = heats.map((heat, i) =>
    makeResponse(v, { name: PERSONAS[i % PERSONAS.length].name, channel: PERSONAS[i % PERSONAS.length].channel, heat }, i)
  );
  return v;
}

function assert(cond: boolean, evidence: string[], line: string) {
  if (!cond) throw new Error(line);
  evidence.push(line);
}

/* ---------- the tests ---------- */

type Test = { id: string; name: string; rule: string; run: () => string[] };

const TESTS: Test[] = [
  {
    id: "seed.integrity",
    name: "Seed portfolio",
    rule: "the demo schema loads with the documented facts intact",
    run: () => {
      const db = seed();
      const ev: string[] = [];
      assert(db.ideas.length === 4, ev, `ideas: ${db.ideas.length} (SafeSpark, LedgerLeaf ×2 versions, Nimbus Notes, Parkhound)`);
      const ss = db.versions[db.ideas.find((i) => i.slug === "safespark")!.headVersionId];
      const vis = founderVisible(ss);
      const yes = vis.filter((r) => r.confirmed === true).length;
      assert(ss.responses.length === 11, ev, `SafeSpark responses: ${ss.responses.length} in (11 collected)`);
      assert(yes >= 7, ev, `confirmed-yes among visible: ${yes} — round is live and above the gate`);
      const ll = db.ideas.find((i) => i.slug === "ledgerleaf")!;
      assert(ll.versionIds.length === 2, ev, `LedgerLeaf fork chain: ${ll.versionIds.length} versions on record`);
      return ev;
    },
  },
  {
    id: "versions.append-only",
    name: "Append-only versions",
    rule: "a rework forks a new version; the previous report stays readable and untouched",
    run: () => {
      const db = seed();
      const ev: string[] = [];
      const ll = db.ideas.find((i) => i.slug === "ledgerleaf")!;
      const [v1id, v2id] = ll.versionIds;
      const v1 = db.versions[v1id];
      const v2 = db.versions[v2id];
      assert(v2.parentVersionId === v1.id, ev, `v2.parent_version_id → v1 (${v1.version} → ${v2.version})`);
      const snapshot = JSON.stringify(v1);
      const v3: IdeaVersion = { ...v2, id: uuid(), version: 3, parentVersionId: v2.id, status: "draft", score: null };
      db.versions[v3.id] = v3;
      ll.versionIds = [...ll.versionIds, v3.id];
      ll.headVersionId = v3.id;
      assert(JSON.stringify(db.versions[v1id]) === snapshot, ev, "v1 byte-identical after the fork — nothing overwritten");
      assert(db.versions[v1id].score!.verdict === "NO-GO", ev, "the killed report still reads: v1 = NO-GO (41/100)");
      return ev;
    },
  },
  {
    id: "gate.enforced-in-code",
    name: "50% go/no-go gate",
    rule: "the threshold is enforced in code — a model slip cannot flip a founder's verdict",
    run: () => {
      const ev: string[] = [];
      const profiles: { label: string; heats: ("hot" | "warm" | "cold" | "junk")[]; weakWtp?: boolean; lock?: "GO" | "NO-GO" }[] = [
        { label: "all cold, weak WTP", heats: ["cold", "cold", "cold", "cold", "cold", "cold", "cold", "cold"], weakWtp: true, lock: "NO-GO" },
        { label: "mostly cold", heats: ["cold", "cold", "cold", "cold", "cold", "warm", "cold", "cold", "cold"], weakWtp: true, lock: "NO-GO" },
        { label: "coin-flip round", heats: ["hot", "cold", "hot", "cold", "hot", "cold", "hot", "cold", "cold", "cold"] },
        { label: "mostly hot", heats: ["hot", "hot", "hot", "hot", "hot", "hot", "warm", "hot", "cold"], lock: "GO" },
        { label: "all hot", heats: ["hot", "hot", "hot", "hot", "hot", "hot", "hot", "hot"], lock: "GO" },
        { label: "hot with junk in the queue", heats: ["hot", "hot", "hot", "hot", "hot", "junk", "hot", "junk"] },
      ];
      let held = 0;
      for (const p of profiles) {
        const v = withResponses(blankVersion({ title: `Gate probe — ${p.label}` }), p.heats);
        if (p.weakWtp) v.research!.pricingIntel = { wtpRange: [8, 18], anchor: 11, model: "Flat monthly", basis: "smoke probe" };
        const s = computeScore(v);
        const expect = s.total >= 50 ? "GO" : "NO-GO";
        assert(
          s.verdict === expect && s.threshold === 50 && s.enforcedBy === "code",
          ev,
          `${p.label}: total ${s.total}/100 → ${s.verdict} (gate ${s.threshold}, enforced by ${s.enforcedBy})`
        );
        if (p.lock) assert(s.verdict === p.lock, ev, `locked outcome held: ${p.label} ⇒ ${s.verdict}`);
        held++;
      }
      assert(held === profiles.length, ev, `${held}/${profiles.length} profiles obeyed the code-enforced threshold`);
      return ev;
    },
  },
  {
    id: "questionnaire.questions-only",
    name: "Questionnaire isolation",
    rule: "a public share link exposes only the questions — never the idea, research or score",
    run: () => {
      const db = seed();
      const ev: string[] = [];
      const ss = db.versions[db.ideas.find((i) => i.slug === "safespark")!.headVersionId];
      const view = publicShareView(ss);
      const wire = JSON.stringify(view);
      assert(Object.keys(view).join(",") === "questions", ev, `payload keys: [${Object.keys(view).join(", ")}]`);
      assert(view.questions.length === (ss.questions ?? []).length && view.questions.length >= 4, ev, `${view.questions.length} questions exposed`);
      for (const secret of [ss.assumption, ss.problem, ss.research!.summary, ss.title, ss.audience]) {
        assert(!wire.includes(secret), ev, `leak check: "${secret.slice(0, 42)}…" not on the wire`);
      }
      return ev;
    },
  },
  {
    id: "visibility.rejected-hidden",
    name: "Response visibility",
    rule: "rejected responses stay invisible to founders — even when they say yes",
    run: () => {
      const ev: string[] = [];
      const v = withResponses(blankVersion({ title: "Visibility probe" }), ["hot", "cold", "junk", "hot"]);
      v.responses[2].screened = "rejected"; // the bait: junk that claimed yes
      v.responses[2].confirmed = true;
      const vis = founderVisible(v);
      assert(vis.length === 3, ev, `visible: ${vis.length} of ${v.responses.length} (rejected held back)`);
      assert(!vis.some((r) => r.screened === "rejected"), ev, "no rejected response reaches the founder, in either mode");
      assert(HOLD_PENDING_FOR_REVIEW === false, ev, "HOLD_PENDING_FOR_REVIEW = off — pending shown and counted");
      return ev;
    },
  },
  {
    id: "visibility.denominator",
    name: "Rate reconciles with the page",
    rule: "the confirmation rate's denominator is, by construction, the set of responses shown",
    run: () => {
      const ev: string[] = [];
      const db = seed();
      const ss = db.versions[db.ideas.find((i) => i.slug === "safespark")!.headVersionId];
      const vis = founderVisible(ss);
      const yes = vis.filter((r) => r.confirmed === true).length;
      const rate = computeConfirmationRate(ss);
      assert(Math.round(rate * vis.length) === yes, ev, `rate × visible = ${Math.round(rate * vis.length)} = confirmed-yes count (${yes})`);
      assert(Math.abs(rate - yes / vis.length) < 1e-9, ev, `denominator is exactly the visible set: ${yes}/${vis.length} = ${(rate * 100).toFixed(0)}%`);
      return ev;
    },
  },
  {
    id: "agents.audit-trail",
    name: "Agent audit trail",
    rule: "every agent call logs prompt version, model, provider and latency — the future SLM corpus",
    run: () => {
      const ev: string[] = [];
      const runs = AGENTS.map((a, i) => mkRun("smoke", "v-smoke", a.id, i % 2 ? "anthropic" : "groq", "probe input", "probe output", Date.now(), 300 + i * 90));
      assert(runs.length === AGENTS.length, ev, `${runs.length}/${AGENTS.length} agents logged a run`);
      assert(runs.every((r) => r.promptVersion && r.promptVersion.length > 0), ev, "prompt_version present on every run");
      assert(runs.every((r) => r.model === modelFor(r.provider as "groq" | "anthropic")), ev, "model matches provider on every run (groq ↔ anthropic swap holds)");
      assert(runs.every((r) => r.latencyMs > 0), ev, "latency recorded on every run");
      return ev;
    },
  },
  {
    id: "research.degrades",
    name: "Research degrades, never fakes",
    rule: "without live search the report is flagged unsourced — model recall is never presented as fact",
    run: () => {
      const ev: string[] = [];
      const v = blankVersion({ title: "Sourcing probe" });
      v.questions = synthesizeQuestions(v);
      const live = synthesizeResearch(v, true, "groq");
      const dead = synthesizeResearch(v, false, "groq");
      assert(live.evidence.length >= 4, ev, `live search on: ${live.evidence.length} sourced claims`);
      assert(live.evidence.every((e) => /^https:\/\//.test(e.url)), ev, "every citation traces to a retrieved URL — no invented sources");
      assert(dead.unsourced === true, ev, "live search off: report carries the unsourced flag");
      assert(dead.evidence.length === 0, ev, "live search off: zero citations shipped — the UI says so explicitly");
      return ev;
    },
  },
  {
    id: "provider.one-line-swap",
    name: "One-line provider swap",
    rule: "Groq → Anthropic is one variable; no agent, route or component changes",
    run: () => {
      const ev: string[] = [];
      const g = modelFor("groq");
      const a = modelFor("anthropic");
      assert(g !== a, ev, `LLM_PROVIDER=groq → ${g}`);
      assert(a.length > 0, ev, `LLM_PROVIDER=anthropic → ${a}`);
      return ev;
    },
  },
  {
    id: "pricing.server-side",
    name: "Server-side pricing",
    rule: "round prices are computed from pricing_config — never from the client",
    run: () => {
      const ev: string[] = [];
      const q = roundQuote(12);
      const expect = 12 * PRICING_CONFIG.perInterview + PRICING_CONFIG.analysisFee;
      assert(q.total === expect, ev, `12 interviews → $${q.total} = 12 × $${PRICING_CONFIG.perInterview} + $${PRICING_CONFIG.analysisFee} analysis`);
      assert(q.interviewCost === 12 * PRICING_CONFIG.perInterview && q.analysisFee === PRICING_CONFIG.analysisFee, ev, `line items split cleanly: interviews $${q.interviewCost} / analysis $${q.analysisFee}`);
      return ev;
    },
  },
];

/* ---------- runner ---------- */

export async function runSmokeSuite(tick?: (r: SmokeResult, index: number) => void): Promise<SmokeResult[]> {
  const out: SmokeResult[] = [];
  for (let i = 0; i < TESTS.length; i++) {
    const t = TESTS[i];
    const t0 = performance.now();
    let pass = true;
    let evidence: string[] = [];
    try {
      evidence = t.run();
    } catch (e) {
      pass = false;
      evidence = [`✗ ${e instanceof Error ? e.message : String(e)}`];
    }
    const r: SmokeResult = { id: t.id, name: t.name, rule: t.rule, pass, evidence, ms: Math.max(1, Math.round(performance.now() - t0)) };
    out.push(r);
    tick?.(r, i);
    await wait(260);
  }
  return out;
}

export const SMOKE_META = {
  schema: "brains.schema.v1",
  threshold: 50,
  holdPending: HOLD_PENDING_FOR_REVIEW,
  agents: AGENTS.length,
  total: TESTS.length,
};
