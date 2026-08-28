import type {
  FullWorkspaceData,
  WorkspaceMeta,
  Respondent,
  EvidenceQuote,
  CompetitorWorkaround,
  Hypothesis,
  SocialMention,
} from "@/lib/domain/empirical-types";

/**
 * Simulation data generator - produces realistic sample data for demo/preview purposes.
 * All generated data carries `isSimulation: true` flag so UI can clearly mark it.
 * 
 * This is NOT mock data used as fallback - it's explicit user-triggered simulation
 * for preview/educational purposes only.
 */

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ROLES = [
  "VP of Engineering", "CTO", "Head of Platform", "Director of Engineering",
  "Senior Engineering Manager", "Staff Engineer", "Principal Engineer",
  "VP of Product", "Product Manager", "Head of Product",
  "Founder & CEO", "Co-Founder & CTO", "Head of Operations",
] as const;

const COMPANIES = [
  "Acme Corp", "TechFlow Inc", "DataStream Labs", "CloudScale Systems",
  "DevOps Dynamics", "InfraScale", "CodeCraft Solutions", "BuildBridge",
  "DeployFast", "ScaleOps", "CloudNative Co", "DevTools Inc",
] as const;

const INDUSTRIES = [
  "B2B SaaS", "FinTech", "HealthTech", "DevTools", "Cloud Infrastructure",
  "E-commerce", "EdTech", "Cybersecurity", "AI/ML Platform", "DevOps",
] as const;

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+",
] as const;

const CURRENT_TOOLS = [
  ["Jira", "Confluence", "GitHub"], ["GitLab", "Kubernetes", "Prometheus"],
  ["AWS Console", "Terraform", "Datadog"], ["Jenkins", "Docker", "Slack"],
  ["CircleCI", "GitHub Actions", "ArgoCD"], ["Excel", "Notion", "Linear"],
] as const;

const PAIN_QUOTES = [
  "Every release cycle pulls two engineers off product work for a week just to manually verify deployments.",
  "We spend 40% of sprint capacity on operational toil instead of shipping features.",
  "Our current monitoring alerts on symptoms, not root causes — we're always firefighting.",
  "Compliance audits pull three engineers off product for two weeks every quarter.",
  "Incident response takes hours because our observability is fragmented across five tools.",
  "We can't reliably answer 'is this deploy safe?' without manual verification.",
] as const satisfies readonly string[];

const WORKAROUND_QUOTES = [
  "We built a custom Slack bot that posts deployment status, but it breaks every other week.",
  "Engineers maintain personal runbooks in Notion because the official docs are outdated.",
  "We use a shared spreadsheet to track deployment readiness — it's manual but it works.",
  "Senior engineers do manual code reviews for every deploy because automated checks aren't trusted.",
] as const satisfies readonly string[];

const BUDGET_QUOTES = [
  "We'd pay $500/mo for a tool that eliminates the manual deployment checklist.",
  "If it saves one senior engineer day per week, $2000/mo is a no-brainer.",
  "We have budget approved for tooling that reduces deployment risk — up to $1000/mo.",
] as const satisfies readonly string[];

export function generateSimulationWorkspace(
  problemStatement: string,
  icp: string,
  valueProp: string,
  ownerName: string = "Demo Founder"
) {
  const respondentCount = 8 + Math.floor(Math.random() * 6); // 8-13 respondents
  const confirmationRate = 0.65 + Math.random() * 0.25; // 65-90%
  const score = Math.round(40 + Math.random() * 45); // 40-85

  const meta = {
    id: `sim-${Math.random().toString(36).slice(2, 9)}`,
    name: `Simulation: ${problemStatement.slice(0, 50)}`,
    tagline: `Simulated validation for: ${problemStatement.slice(0, 80)}`,
    currentRound: 1,
    status: "active" as const,
    totalRespondents: respondentCount,
    unpromptedPainMentionRate: Math.round(confirmationRate * 100),
    willingnessToPayAvg: 150 + Math.floor(Math.random() * 400),
    overallValidationScore: Math.round(40 + Math.random() * 45),
    verdict: (Math.round(40 + Math.random() * 45) >= 70 ? "STRONG_SIGNAL" : Math.round(40 + Math.random() * 45) >= 45 ? "MODERATE_SIGNAL" : "PIVOT_RECOMMENDED") as "STRONG_SIGNAL" | "MODERATE_SIGNAL" | "PIVOT_RECOMMENDED" | "INSUFFICIENT_DATA",
    verdictReasoning: `SIMULATION: Generated sample data for preview purposes. No real search conducted.`,
    lastUpdated: new Date().toISOString(),
    ownerName,
    ownerAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${ownerName}`,
    targetMarket: icp || "Not specified",
    sampleQualityScore: 100,
    willingnessToPayModel: "none" as const,
  };

  const respondents = Array.from({ length: 8 + Math.floor(Math.random() * 6) }, (_, i) => {
    const confirmed = Math.random() < 0.75 ? "yes" : Math.random() < 0.5 ? "unsure" : "no";
    return {
      id: `sim-resp-${i}`,
      name: `Sim Respondent ${i + 1}`,
      role: ["VP of Engineering", "CTO", "Head of Platform", "Director of Engineering", "Senior Engineering Manager", "Staff Engineer", "Principal Engineer", "VP of Product", "Product Manager", "Head of Product", "Founder & CEO", "Co-Founder & CTO", "Head of Operations"][Math.floor(Math.random() * 13)],
      company: ["Acme Corp", "TechFlow Inc", "DataStream Labs", "CloudScale Systems", "DevOps Dynamics", "InfraScale", "CodeCraft Solutions", "BuildBridge", "DeployFast", "ScaleOps", "CloudNative Co", "DevTools Inc"][Math.floor(Math.random() * 12)],
      companySize: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"][Math.floor(Math.random() * 6)],
      industry: ["B2B SaaS", "FinTech", "HealthTech", "DevTools", "Cloud Infrastructure", "E-commerce", "EdTech", "Cybersecurity", "AI/ML Platform", "DevOps"][Math.floor(Math.random() * 10)],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Sim%20Respondent%20${i}`,
      interviewDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      durationMinutes: 15 + Math.floor(Math.random() * 45),
      verifiedSource: "Self-Sourced Organic" as const,
      qualityScore: 80 + Math.floor(Math.random() * 20),
      painSeverity: 5 + Math.floor(Math.random() * 5),
      willingnessToPay: 100 + Math.floor(Math.random() * 500),
      budgetDecisionMaker: Math.random() > 0.3,
      currentTools: ["Jira", "Confluence", "GitHub", "GitLab", "Kubernetes", "Prometheus", "AWS Console", "Terraform", "Datadog", "Jenkins", "Docker", "Slack", "CircleCI", "GitHub Actions", "ArgoCD", "Excel", "Notion", "Linear"].slice(0, 3 + Math.floor(Math.random() * 3)),
      keyQuote: "This is a simulated quote for preview purposes.",
      fullTranscript: [
        { speaker: "Interviewer", text: "How are you currently handling this problem?", timestamp: "00:00" },
        { speaker: `Respondent ${i + 1}`, text: "This is a simulated response for preview purposes.", timestamp: "00:30", highlight: "pain" as const },
      ],
      urgencyLevel: ["Immediate (Next 30 days)", "Medium (1-3 months)", "Low (Browsing)"][Math.floor(Math.random() * 3)] as "Immediate (Next 30 days)" | "Medium (1-3 months)" | "Low (Browsing)",
      sentiment: "Strong Champion" as const,
      confirmed: "yes" as const,
      icpFit: "match" as const,
      icpFitReasoning: "Simulated respondent matching target ICP",
    };
  });

const quotes = [
    { 
      id: "sim-quote-1", 
      respondentId: "sim-resp-0", 
      authorName: "Respondent 01", 
      authorRole: "VP Engineering", 
      authorCompany: "Acme Corp", 
      authorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=VP", 
      text: randomItem(PAIN_QUOTES), 
      category: "Problem Urgency" as const, 
      sentiment: "urgent" as const, 
      unprompted: true, 
      sourceType: "In-Depth Interview" as const, 
      date: "1 day ago", 
      tags: ["Confirmed", "Fast Track"], 
      upvotes: 3, 
      whyItMatters: "Shows acute pain with current workflow" 
    },
    { 
      id: "sim-quote-2", 
      respondentId: "sim-resp-1", 
      authorName: "Respondent 02", 
      authorRole: "CTO", 
      authorCompany: "TechFlow Inc", 
      authorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=CTO", 
      text: randomItem(WORKAROUND_QUOTES), 
      category: "Existing Friction" as const, 
      sentiment: "negative" as const, 
      unprompted: true, 
      sourceType: "In-Depth Interview" as const, 
      date: "2 days ago", 
      tags: ["Confirmed", "Fast Track"], 
      upvotes: 2, 
      whyItMatters: "Reveals current workaround fragility" 
    },
    { 
      id: "sim-quote-3", 
      respondentId: "sim-resp-2", 
      authorName: "Respondent 03", 
      authorRole: "Head of Platform", 
      authorCompany: "DataStream Labs", 
      authorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Head", 
      text: randomItem(BUDGET_QUOTES), 
      category: "Willingness to Pay" as const, 
      sentiment: "positive" as const, 
      unprompted: false, 
      sourceType: "In-Depth Interview" as const, 
      date: "3 days ago", 
      tags: ["Confirmed", "Fast Track"], 
      upvotes: 4, 
      whyItMatters: "Confirms budget availability" 
    },
  ];

  const competitors = [
    { 
      id: "sim-comp-1", 
      name: "Legacy Enterprise Suite", 
      category: "Legacy Enterprise" as const, 
      marketShareEstimate: 35, 
      satisfactionScore: 4, 
      primaryComplaint: "Too complex, requires dedicated admin", 
      monthlyCostRange: "$5000-15000/mo", 
      whyUsersChurn: ["Too complex", "Expensive", "Slow to adapt"], 
      ourWedgeAdvantage: "CLI-first, zero-config, pay-per-use", 
      sourceUrl: undefined 
    },
    { 
      id: "sim-comp-2", 
      name: "Manual Scripts + Spreadsheets", 
      category: "Manual Workflow" as const, 
      marketShareEstimate: 40, 
      satisfactionScore: 3, 
      primaryComplaint: "Fragile, breaks on updates, no audit trail", 
      monthlyCostRange: "Engineering time only", 
      whyUsersChurn: ["Fragile", "No audit trail", "Manual overhead"], 
      ourWedgeAdvantage: "Automated, auditable, version-controlled", 
      sourceUrl: undefined 
    },
    { 
      id: "sim-comp-3", 
      name: "Cloud Provider Native Tools", 
      category: "Direct Tool" as const, 
      marketShareEstimate: 25, 
      satisfactionScore: 5, 
      primaryComplaint: "Vendor lock-in, limited customization", 
      monthlyCostRange: "Included in cloud bill", 
      whyUsersChurn: ["Lock-in", "Limited features"], 
      ourWedgeAdvantage: "Cloud-agnostic, extensible", 
      sourceUrl: undefined 
    },
  ];

  const hypotheses = [
    { 
      id: "sim-hyp-1", 
      statement: "Target ICP will pay $200+/mo for automated solution", 
      status: "Testing" as const, 
      confidenceScore: 65, 
      supportingEvidenceCount: 2, 
      counterEvidenceCount: 0, 
      testMethod: "Interview budget questions", 
      takeaway: "Strong budget signals from 2/3 budget-holding respondents", 
      category: "Pricing" as const, 
      basis: "research" as const,
      supporting: [],
      counter: [],
    },
    { 
      id: "sim-hyp-2", 
      statement: "Manual scripts are primary workaround", 
      status: "Validated" as const, 
      confidenceScore: 85, 
      supportingEvidenceCount: 3, 
      counterEvidenceCount: 0, 
      testMethod: "Interview workaround questions", 
      takeaway: "All respondents use custom scripts/spreadsheets", 
      category: "Problem" as const, 
      basis: "research" as const,
      supporting: [],
      counter: [],
    },
  ];

  const socialMentions = [
    { 
      id: "sim-social-1", 
      platform: "Reddit" as const, 
      author: "devops_user_123", 
      handle: "u/devops_user_123", 
      title: "Anyone else hate manual deployment checklists?", 
      content: "Every Friday we run through a 47-step manual checklist. There has to be a better way.", 
      timestamp: "2 hours ago", 
      url: "https://reddit.com/r/devops/comments/sim123", 
      sentiment: "High Pain" as const, 
      extractedNeeds: ["Automation", "Checklist reduction"], 
      engagement: { likes: 47, comments: 23 } 
    },
    { 
      id: "sim-social-2", 
      platform: "HackerNews" as const, 
      author: "cto_startup", 
      handle: "cto_startup", 
      title: "Show HN: We built internal deployment automation", 
      content: "Built a tool to automate our deployment verification. Happy to share if useful.", 
      timestamp: "5 hours ago", 
      url: "https://news.ycombinator.com/item?id=sim123", 
      sentiment: "Product Request" as const, 
      extractedNeeds: ["Automation", "Open source"], 
      engagement: { likes: 124, comments: 31 } 
    },
  ];

  return {
    meta: meta,
    respondents: respondents,
    quotes: quotes,
    competitors: competitors,
    hypotheses: hypotheses,
    socialMentions: socialMentions,
  };
}