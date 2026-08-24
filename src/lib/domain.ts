/* ============================================================
   BRAINS domain — the canonical idea_state shape and pipeline
   vocabulary. Mirrors src/lib/domain in the backend repo.
   ============================================================ */

export const PIPELINE_STAGES = ["describe", "research", "validate", "decide"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type IdeaStatus =
  | "draft"
  | "researching"
  | "researched"
  | "validating"
  | "scored"
  | "go"
  | "nogo"
  | "killed";

export const STATUS_LABEL: Record<IdeaStatus, string> = {
  draft: "Described",
  researching: "Researching",
  researched: "Researched",
  validating: "Validating",
  scored: "Scoring",
  go: "GO",
  nogo: "NO-GO",
  killed: "Killed",
};

export const STATUS_STAGE: Record<IdeaStatus, PipelineStage> = {
  draft: "describe",
  researching: "research",
  researched: "research",
  validating: "validate",
  scored: "decide",
  go: "decide",
  nogo: "decide",
  killed: "decide",
};

/* ---------- research ---------- */

export interface Citation {
  claim: string;
  source: string;
  url: string;
  kind: "market" | "competitor" | "community" | "pricing";
}

export interface Competitor {
  name: string;
  angle: string;
  gap: string;
}

export interface Segment {
  name: string;
  size: string;
  signal: number; // 0-100
  where: string;
}

export interface PricingIntel {
  wtpRange: [number, number];
  anchor: number;
  model: string;
  basis: string;
}

export interface ResearchReport {
  summary: string;
  market: { size: string; growth: string; trend: string };
  competitors: Competitor[];
  segments: Segment[];
  evidence: Citation[];
  pricingIntel: PricingIntel;
  proposedChanges: string[];
  unsourced: boolean;
  model: string;
  provider: string;
  latencyMs: number;
}

/* ---------- validation ---------- */

export interface Question {
  id: string;
  text: string;
  kind: "screen" | "problem" | "wtp" | "alternative" | "follow";
}

export type ScreenStatus = "pending" | "approved" | "rejected";

export interface ResponseRec {
  id: string;
  respondent: string;
  channel: string;
  answers: { q: string; a: string }[];
  screened: ScreenStatus;
  confirmed: boolean | null;
  note?: string;
  createdAt: number;
}

/* ---------- decision ---------- */

export interface ScoreDimension {
  key: string;
  label: string;
  weight: number;
  score: number;
  note: string;
}

export interface ScoreReport {
  total: number;
  verdict: "GO" | "NO-GO";
  threshold: number;
  enforcedBy: "code";
  dimensions: ScoreDimension[];
  confirmationRate: number;
  responsesCounted: number;
  responsesReceived: number;
  decidedAt: number;
}

/* ---------- versions (append-only) ---------- */

export interface IdeaVersion {
  id: string;
  ideaId: string;
  version: number;
  parentVersionId: string | null;
  title: string;
  oneLiner: string;
  audience: string;
  problem: string;
  assumption: string;
  status: IdeaStatus;
  createdAt: number;
  research: ResearchReport | null;
  questions: Question[] | null;
  shareId: string | null;
  responses: ResponseRec[];
  score: ScoreReport | null;
  reworkNotes: string[];
}

export interface Idea {
  id: string;
  slug: string;
  headVersionId: string;
  versionIds: string[]; // chronological
  createdAt: number;
}

/* ---------- agent audit ---------- */

export interface AgentRun {
  id: string;
  ideaId: string;
  versionId: string;
  agent: string;
  promptVersion: string;
  model: string;
  provider: string;
  inputDigest: string;
  outputDigest: string;
  latencyMs: number;
  status: "ok" | "degraded";
  at: number;
}

/* ---------- outreach ---------- */

export interface OutreachLead {
  id: string;
  name: string;
  email: string;
  product: string;
  audienceMatch: number;
  status: "new" | "invited" | "replied" | "booked";
  ideaId: string | null;
}

/* ---------- agents ---------- */

export interface AgentDef {
  id: string;
  name: string;
  promptVersion: string;
  stage: PipelineStage;
  duty: string;
}

export const AGENTS: AgentDef[] = [
  { id: "market_research", name: "Market Research", promptVersion: "v1.4", stage: "research", duty: "Sizes the market and cites only retrieved sources." },
  { id: "competitor_scan", name: "Competitor Scan", promptVersion: "v1.2", stage: "research", duty: "Maps incumbents and locates the defensible gap." },
  { id: "signal_scan", name: "Signal Scan", promptVersion: "v2.0", stage: "research", duty: "Finds live demand in communities, forums, reviews." },
  { id: "pricing_intel", name: "Pricing Intelligence", promptVersion: "v1.1", stage: "research", duty: "Derives willingness-to-pay range and anchor." },
  { id: "questionnaire_design", name: "Questionnaire Design", promptVersion: "v1.6", stage: "validate", duty: "Writes the interview; never leads the witness." },
  { id: "respondent_screening", name: "Respondent Screening", promptVersion: "v1.3", stage: "validate", duty: "Screens submissions; nonsense never reaches the founder." },
  { id: "evidence_scoring", name: "Evidence Scoring", promptVersion: "v2.1", stage: "decide", duty: "Scores each dimension from answers, not vibes." },
  { id: "verdict_synthesis", name: "Verdict Synthesis", promptVersion: "v1.8", stage: "decide", duty: "Advises; the 50% gate is enforced in code, not here." },
  { id: "rework_advisor", name: "Rework Advisor", promptVersion: "v1.0", stage: "decide", duty: "Turns a NO-GO into a forked next version." },
];

/* ---------- pricing config (Stripe prices computed from this) ---------- */

export const PRICING_CONFIG = {
  perInterview: 40,
  analysisFee: 290,
  minInterviews: 8,
  maxInterviews: 40,
  currency: "USD",
  simulated: true,
} as const;

export function roundQuote(interviews: number) {
  const n = Math.min(Math.max(interviews, PRICING_CONFIG.minInterviews), PRICING_CONFIG.maxInterviews);
  return {
    interviews: n,
    interviewCost: n * PRICING_CONFIG.perInterview,
    analysisFee: PRICING_CONFIG.analysisFee,
    total: n * PRICING_CONFIG.perInterview + PRICING_CONFIG.analysisFee,
  };
}

/* ---------- the fourteen capabilities ---------- */

export const CAPABILITIES: { title: string; body: string }[] = [
  { title: "Sourced market research", body: "Market size, growth and trend with every claim traced to a retrieved source. If live search returns nothing, the report is flagged unsourced — model recall is never presented as researched fact." },
  { title: "Competitor scan", body: "Incumbents mapped by angle, with the defensible gap named explicitly so the round tests the gap, not the category." },
  { title: "Community signal scan", body: "Live demand signals from the communities your buyers already inhabit — threads, reviews, workarounds — scored 0–100." },
  { title: "Pricing intelligence", body: "A willingness-to-pay range, an anchor price and a model recommendation, derived from comparable spend and restated in every interview." },
  { title: "Questionnaire design", body: "Six-question interviews built from your riskiest assumption. No leading questions, no product theatre — the script a trained interviewer would run." },
  { title: "Protected outreach", body: "Invitations go to screened, matched respondents. Public links expose only the questions — never the idea, the research or the score." },
  { title: "Response screening", body: "Every submission is screened before it counts. Rejected responses stay invisible to the founder; nonsense is never displayed as evidence." },
  { title: "Confirmation scoring", body: "The confirmation rate is computed over exactly the responses shown — the denominator reconciles with the list, by construction." },
  { title: "Go / no-go gate", body: "The 50% threshold is enforced in code, not left to the model. A model slip cannot flip a founder's verdict." },
  { title: "Append-only versions", body: "A rework forks a new version with a parent pointer; nothing is overwritten. Every past report stays readable forever, including for killed ideas." },
  { title: "Rework advisor", body: "After a NO-GO, the advisor turns the evidence into concrete proposed changes — the seed of the next version, not a pep talk." },
  { title: "Agent audit trail", body: "Every agent call is logged with prompt version, input, output, model, provider and latency. The audit trail today, the SLM training corpus tomorrow." },
  { title: "Provider swap", body: "Groq in phase one, Anthropic behind the same interface. One environment variable changes the provider; no agent, route or component is touched." },
  { title: "Continued social scan", body: "After the round, a weekly scan of the same communities keeps the signal alive — the week handed back to you, without posting as you." },
];
