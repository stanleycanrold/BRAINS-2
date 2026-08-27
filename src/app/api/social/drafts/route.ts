import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { runAgent } from "@/lib/agents/runtime";
import { postDraftingAgent } from "@/lib/agents/catalog";

export const runtime = "nodejs";
export const maxDuration = 180;

/**
 * POST /api/social/drafts - adapter for the empirical Social Scan tab.
 *
 * The tab supplies a problem statement, ICP and a platform filter and wants
 * back {posts, comments}. We run the engine's Post Drafting Agent against the
 * selected platforms and map its drafts into the tab's shape. Comment replies
 * need real threads, which this ad-hoc surface does not have, so they come
 * back empty rather than invented. Drafts are creative output, not evidence.
 */

const bodySchema = z.object({
  problemStatement: z.string().min(1).max(2000),
  icp: z.string().max(500).default(""),
  valueProp: z.string().max(1000).default(""),
  platform: z.string().default("Reddit & HackerNews"),
});

type Community = {
  name: string;
  platform: string;
  url: string;
  why_relevant: string;
};

function communitiesFor(platform: string): Community[] {
  const p = platform.toLowerCase();
  const list: Community[] = [];
  if (p.includes("reddit") || p.includes("all")) {
    list.push({
      name: "Reddit - founders & SaaS subreddit",
      platform: "Reddit",
      url: "https://reddit.com",
      why_relevant: "Where practitioners describe this problem in their own words.",
    });
  }
  if (p.includes("hacker") || p.includes("all")) {
    list.push({
      name: "Hacker News",
      platform: "HackerNews",
      url: "https://news.ycombinator.com",
      why_relevant: "Technical founders discuss tooling friction candidly.",
    });
  }
  if (list.length === 0) {
    list.push({
      name: `${platform} community`,
      platform,
      url: "",
      why_relevant: "The community the founder selected.",
    });
  }
  return list;
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { problemStatement, icp, platform } = parsed.data;

    const result = await runAgent(postDraftingAgent, {
      problemStatement,
      icp,
      communities: communitiesFor(platform),
    });

    const posts = result.drafts.map((d, i) => ({
      id: `post-${i}`,
      platform: `${d.community}`,
      targetCommunity: d.community,
      title: d.title,
      body: d.draft_text,
      strategyRationale: d.rationale,
    }));

    return NextResponse.json({ posts, comments: [] });
  } catch (err) {
    console.error("[POST /api/social/drafts]", err);
    return NextResponse.json(
      { error: "We couldn't draft those posts right now." },
      { status: 500 },
    );
  }
}
