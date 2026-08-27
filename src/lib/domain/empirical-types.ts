export interface WorkspaceMeta {
  id: string;
  name: string;
  tagline: string;
  currentRound: number;
  status: 'active' | 'completed' | 'reworking';
  totalRespondents: number;
  unpromptedPainMentionRate: number; // percentage (e.g. 78)
  willingnessToPayAvg: number; // $ value
  overallValidationScore: number; // 0 - 100
  verdict: 'STRONG_SIGNAL' | 'MODERATE_SIGNAL' | 'PIVOT_RECOMMENDED' | 'INSUFFICIENT_DATA';
  verdictReasoning: string;
  lastUpdated: string;
  ownerName: string;
  ownerAvatar: string;
  targetMarket: string;
  sampleQualityScore: number; // e.g. 98%
  /** Where the WTP number came from, so the UI never dresses a guess as data. */
  willingnessToPayModel?: 'respondent_avg' | 'anchored' | 'anchor_missing' | 'none';
}

export interface Respondent {
  id: string;
  name: string;
  role: string;
  company: string;
  companySize: string;
  industry: string;
  avatar: string;
  interviewDate: string;
  durationMinutes: number;
  verifiedSource: 'Fast Track Verified' | 'Self-Sourced Organic' | 'Cold Outreach' | 'Community Partner';
  qualityScore: number;
  painSeverity: number; // 1 - 10
  willingnessToPay: number; // monthly USD
  budgetDecisionMaker: boolean;
  currentTools: string[];
  keyQuote: string;
  fullTranscript: {
    speaker: string;
    text: string;
    timestamp: string;
    highlight?: 'pain' | 'budget' | 'objection' | 'validation';
  }[];
  urgencyLevel: 'Immediate (Next 30 days)' | 'Medium (1-3 months)' | 'Low (Browsing)';
  sentiment: 'Strong Champion' | 'Interested' | 'Neutral/Cautious' | 'Skeptical';
  /** Their raw answer to the confirmation question. */
  confirmed?: 'yes' | 'no' | 'unsure';
  /** How well they match the ICP, judged from their profile. */
  icpFit?: 'match' | 'adjacent' | 'outside' | 'unknown';
  icpFitReasoning?: string;
}

export interface EvidenceQuote {
  id: string;
  respondentId: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorAvatar: string;
  text: string;
  category: 'Problem Urgency' | 'Willingness to Pay' | 'Existing Friction' | 'Feature Requirement' | 'Objection & Risk';
  sentiment: 'positive' | 'negative' | 'neutral' | 'urgent';
  unprompted: boolean;
  sourceType: 'In-Depth Interview' | 'Reddit r/SaaS' | 'Hacker News' | 'X/Twitter' | 'Typeform Survey';
  date: string;
  tags: string[];
  upvotes?: number;
  /** Why the extraction agent kept this quote. */
  whyItMatters?: string;
  /** The question whose answer produced it, when known. */
  questionText?: string;
}

export interface CompetitorWorkaround {
  id: string;
  name: string;
  category: 'Direct Tool' | 'Manual Workflow' | 'Legacy Enterprise' | 'No-Code Patch';
  marketShareEstimate: number; // percentage
  satisfactionScore: number; // 1-10
  primaryComplaint: string;
  monthlyCostRange: string;
  whyUsersChurn: string[];
  ourWedgeAdvantage: string;
  sourceUrl?: string;
}

export interface Hypothesis {
  id: string;
  statement: string;
  status: 'Validated' | 'Partially Validated' | 'Disproven' | 'Testing';
  confidenceScore: number; // 0 - 100
  supportingEvidenceCount: number;
  counterEvidenceCount: number;
  testMethod: string;
  takeaway: string;
  category: 'Problem' | 'Pricing' | 'Go-To-Market' | 'Tech Feasibility';
  /** research = generated from the research report; feedback = founder-stated. */
  basis?: 'research' | 'feedback';
  /** The actual evidence pointers, not just their counts. */
  supporting?: string[];
  counter?: string[];
}

export interface SocialMention {
  id: string;
  platform: 'Reddit' | 'HackerNews' | 'X/Twitter' | 'ProductHunt' | 'G2';
  author: string;
  handle: string;
  title?: string;
  content: string;
  timestamp: string;
  url: string;
  sentiment: 'High Pain' | 'Workaround Need' | 'Product Request' | 'Neutral';
  extractedNeeds: string[];
  engagement: { likes: number; comments: number };
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: {
    sourceId: string;
    sourceName: string;
    quote: string;
  }[];
}

export interface FullWorkspaceData {
  meta: WorkspaceMeta;
  respondents: Respondent[];
  quotes: EvidenceQuote[];
  competitors: CompetitorWorkaround[];
  hypotheses: Hypothesis[];
  socialMentions: SocialMention[];
}
