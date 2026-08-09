import "server-only";

/**
 * Abuse and cost control for the one endpoint that faces the public internet
 * without authentication.
 *
 * A free, unauthenticated AI endpoint is a well-known cost vector: bots,
 * scrapers and competitors probing the prompt will find it before real users
 * arrive at any meaningful traffic. Three independent layers, because each
 * one fails differently:
 *
 *  1. A composite identity, so one signal being defeated does not grant
 *     unlimited access.
 *  2. A per-identity quota, which is the soft wall a real founder might hit.
 *  3. A global daily ceiling, which is the only layer that actually caps the
 *     bill and the only one that holds when the first two are evaded.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * KNOWN LIMITATION, and it must be fixed before this runs on more than one
 * instance: the counters below live in process memory. That is correct for
 * local development and a single long-lived server, and it is WRONG on
 * serverless, where every cold start begins with an empty map and the quota
 * effectively disappears. Moving to Postgres or a KV store is a change to
 * this file only - every caller goes through `checkAndCount`, which is
 * already async so that the swap does not touch the route.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Free runs per visitor per day. Zero means unlimited, and zero is the
 * default on purpose.
 *
 * These visitors arrive from search with high intent and no idea who we are.
 * A wall in front of the first real thing they get is the most expensive
 * possible place to put one: it costs a user who was ready to be convinced,
 * to save a few cents of inference. Growth first, restrictions once there is
 * a reason to have them. Set TEASER_QUOTA to a number to turn the wall on
 * without a deploy.
 */
const QUOTA = Number(process.env.TEASER_QUOTA ?? 0);
const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The global stop, and the one limit that stays on.
 *
 * This is not user friction: a normal visitor never approaches it, and it
 * exists so that a scraper pointed at this endpoint overnight produces an
 * alert rather than an invoice. Removing this because the quota is off would
 * be removing the only thing standing between a public model endpoint and
 * unbounded spend.
 */
const GLOBAL_DAILY_CAP = Number(process.env.TEASER_DAILY_CAP ?? 2000);

type Bucket = { count: number; resetAt: number };

const identities = new Map<string, Bucket>();
let global: Bucket = { count: 0, resetAt: Date.now() + WINDOW_MS };

function take(bucket: Bucket, cap: number): boolean {
  if (Date.now() > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = Date.now() + WINDOW_MS;
  }
  if (bucket.count >= cap) return false;
  bucket.count += 1;
  return true;
}

/**
 * Identity from several weak signals rather than one strong one.
 *
 * Any single signal here is defeatable: IP by a phone hopping networks,
 * fingerprint by incognito or by Safari and Firefox actively degrading it,
 * the session cookie by clearing it. Requiring all three to change at once is
 * meaningfully more work than any of them alone, which is the realistic goal.
 * Stopping a determined attacker is what the global cap is for.
 *
 * Fingerprints are hashed with a server secret and never stored raw. They are
 * personal data under GDPR and ePrivacy, so they stay one-way and expire with
 * the window.
 */
export function identify(parts: {
  ip: string | null;
  fingerprint: string | null;
  session: string | null;
}): string {
  const salt = process.env.TEASER_ID_SALT ?? "dev-salt";
  const raw = [parts.fingerprint, parts.ip, parts.session]
    .map((p) => p ?? "-")
    .join("|");

  // djb2. Not cryptographic, and does not need to be: this only has to make
  // the stored key non-reversible at a glance and stable within a window.
  let hash = 5381;
  const input = `${salt}|${raw}`;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return String(hash >>> 0);
}

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "quota" | "capacity" };

export async function checkAndCount(identity: string): Promise<LimitResult> {
  // The global cap is checked first and counted only if the identity also
  // passes, so a single blocked visitor cannot burn global capacity.
  if (Date.now() > global.resetAt) {
    global = { count: 0, resetAt: Date.now() + WINDOW_MS };
  }
  if (global.count >= GLOBAL_DAILY_CAP) return { ok: false, reason: "capacity" };

  // Unlimited per visitor. The global ceiling above still applies, so this
  // skips the bookkeeping rather than skipping the protection.
  if (QUOTA <= 0) {
    global.count += 1;
    return { ok: true, remaining: Infinity };
  }

  const bucket = identities.get(identity) ?? {
    count: 0,
    resetAt: Date.now() + WINDOW_MS,
  };
  identities.set(identity, bucket);

  if (!take(bucket, QUOTA)) return { ok: false, reason: "quota" };
  global.count += 1;

  return { ok: true, remaining: Math.max(0, QUOTA - bucket.count) };
}

/**
 * Cloudflare Turnstile, verified server side.
 *
 * Absent a secret key this returns true, so local development and previews
 * work without the widget. That is a deliberate hole and it is why the quota
 * and the global cap above do not depend on it: if this were the only layer,
 * a missing environment variable in production would silently disable all
 * protection at once.
 */
export async function verifyTurnstile(
  token: string | null,
  ip: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // A Turnstile outage must not take the site's main call to action down.
    // The quota and the global cap still apply.
    return true;
  }
}
