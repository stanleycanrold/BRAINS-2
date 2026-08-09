import { NextResponse, type NextRequest, after } from "next/server";
import { createAnonIdea, getAnonIdea } from "@/lib/anon";
import { runResearchPipeline } from "@/lib/agents/orchestrator";
import { publicCors } from "@/lib/public-cors";

export const runtime = "nodejs";
// Research fans out across extraction and five live search queries, same as
// the signed-in route. It needs the same ceiling.
export const maxDuration = 300;

/**
 * The real research pass, run for a visitor who has not signed up.
 *
 * This is not a lighter imitation of step one. It calls `runResearchPipeline`,
 * the exact function the signed-in route calls, so the extraction, the five
 * search queries, the sourced evidence, the workarounds, the counter-evidence
 * and the proposed changes are all the genuine article. A visitor arriving
 * from a search result gets what a customer gets.
 *
 * ─── Start and poll, not one long request ─────────────────────────────────
 *
 * The pass takes roughly one to two minutes. Holding an HTTP request open
 * that long is fragile: proxies and browsers time it out, a dropped
 * connection loses work already paid for, and a reload starts again from
 * nothing. So POST creates the record and returns a token immediately, the
 * work continues in the background via `after`, and the client polls. That is
 * the same shape the signed-in flow uses, and it means a visitor can reload,
 * or come back to the URL later, and still find their report.
 */

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: publicCors(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const headers = publicCors(request.headers.get("origin"));

  let body: { description?: unknown; location?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400, headers });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (description.length < 20) {
    return NextResponse.json(
      { error: "Tell us a little more about the idea first." },
      { status: 400, headers },
    );
  }
  if (description.length > 6000) {
    return NextResponse.json(
      { error: "That is longer than this handles. Trim it to the essentials." },
      { status: 400, headers },
    );
  }

  try {
    const idea = await createAnonIdea({
      description,
      locationFocus: typeof body.location === "string" ? body.location.trim() : "",
    });

    /**
     * `after` keeps the work running once the response has been sent, which
     * is what makes the immediate token possible. On a platform that kills
     * the process at response time this is where a queue would go instead;
     * everything else about the route stays the same.
     */
    after(async () => {
      try {
        await runResearchPipeline({ versionId: idea.versionId, state: idea.state });
      } catch (error) {
        console.error(`[public-research] ${idea.id} failed:`, error);
      }
    });

    return NextResponse.json({ token: idea.id }, { headers });
  } catch (error) {
    console.error("[public-research] could not start:", error);
    return NextResponse.json(
      { error: "We could not start that run. Try again in a moment." },
      { status: 502, headers },
    );
  }
}

/**
 * The poll. Returns the whole idea state once research has landed.
 *
 * `ready` is derived from the report being present rather than from a status
 * column, because the pipeline writes the report as its last act. A status
 * that says "researching" while the report exists, or the reverse, would
 * strand the client on either side.
 */
export async function GET(request: NextRequest) {
  const headers = publicCors(request.headers.get("origin"));
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400, headers });
  }

  const idea = await getAnonIdea(token);
  if (!idea) {
    return NextResponse.json({ error: "Not found." }, { status: 404, headers });
  }

  const report = idea.state.research_report;

  return NextResponse.json(
    {
      ready: Boolean(report),
      title: idea.title,
      // Returned so the results page can carry the original wording into
      // signup without keeping it in the URL or in client storage, where a
      // reload or a shared link would lose it.
      description: idea.state.raw_submission.description,
      structured: idea.state.structured,
      report: report ?? null,
    },
    { headers },
  );
}
