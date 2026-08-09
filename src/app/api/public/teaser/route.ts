import { NextResponse, type NextRequest } from "next/server";
import { runAgent } from "@/lib/agents/runtime";
import { teaserAgent } from "@/lib/agents/catalog/teaser";
import { checkAndCount, identify, verifyTurnstile } from "@/lib/public-limits";
import { publicCors } from "@/lib/public-cors";

/**
 * The free read, called by the marketing site from a different origin.
 *
 * This is the only route in the application that answers an unauthenticated
 * request with model output, so everything unusual about it is deliberate.
 *
 * It lives here rather than on the marketing site because the model keys, the
 * spend ceiling and the abuse controls should exist in exactly one place. The
 * marketing site has no database and no model SDK, which is what lets it
 * build to static HTML; giving it a second copy of the agent stack would
 * duplicate the pipeline and guarantee the two drift.
 *
 * Not streamed today. The agent decodes against a strict JSON schema, which
 * arrives whole, and at a 900 token ceiling on Groq that lands fast enough to
 * feel immediate. If it stops feeling immediate, the fix is a streaming text
 * pass in front of the structured one, not a spinner.
 */

const corsHeaders = publicCors;

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  let body: {
    description?: unknown;
    fingerprint?: unknown;
    token?: unknown;
    visitor?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400, headers });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";

  // Long enough to reason about, short enough that nobody is using this as a
  // free general-purpose model endpoint.
  if (description.length < 20) {
    return NextResponse.json(
      { error: "Tell us a little more about the idea first." },
      { status: 400, headers },
    );
  }
  if (description.length > 4000) {
    return NextResponse.json(
      { error: "That is longer than this quick read handles. Sign up for the full run." },
      { status: 400, headers },
    );
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  const human = await verifyTurnstile(
    typeof body.token === "string" ? body.token : null,
    ip,
  );
  if (!human) {
    return NextResponse.json(
      { error: "We could not verify that request. Please try again." },
      { status: 403, headers },
    );
  }

  const identity = identify({
    ip,
    fingerprint: typeof body.fingerprint === "string" ? body.fingerprint : null,
    // From the body, not a cookie. See `public-cors` for why nothing
    // cookie-based survives the origin boundary here.
    session: typeof body.visitor === "string" ? body.visitor : null,
  });

  const limit = await checkAndCount(identity);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error:
          limit.reason === "quota"
            ? "That is the last free read for today. Create an account to keep going."
            : "We are at capacity for free reads right now. Please try again later.",
        reason: limit.reason,
      },
      { status: 429, headers },
    );
  }

  try {
    const brief = await runAgent(teaserAgent, { description });

    return NextResponse.json(
      {
        brief: {
          ...brief,
          // Capped here rather than in the schema: array bounds are stripped
          // from the strict decoding grammar, so enforcing them there would
          // only fail after the model had already been paid for.
          questions: brief.questions.slice(0, 3),
        },
        remaining: limit.remaining,
      },
      { headers },
    );
  } catch (error) {
    console.error("[teaser] run failed:", error);
    return NextResponse.json(
      { error: "That read did not complete. Try again in a moment." },
      { status: 502, headers },
    );
  }
}
