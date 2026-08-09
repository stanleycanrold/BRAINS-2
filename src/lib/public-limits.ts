import "server-only";

/**
 * Abuse and cost control for the one endpoint that faces the public internet
 * without authentication.
 *
 * A free, unauthenticated AI endpoint is a well-known cost vector: bots,
 * scrapers and competitors probing the prompt will find it before real users
 * arrive at any meaningful traffic. Three layers, because each fails
 * differently:
 *
 *  1. Several independent identity signals, each with its own bucket, so
 *     defeating one does not hand out a fresh allowance on the others.
 *  2. A per-signal quota, which is the soft wall a real founder might hit.
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

/**
 * One IP is not one person.
 *
 * Offices, universities, coworking spaces and mobile carriers all put many
 * genuine visitors behind a single address, so an IP bucket as tight as a
 * device bucket would lock out a whole building because one person in it
 * was curious. A device is much closer to a person, so it gets the strict
 * cap and the IP gets a looser one.
 */
const IP_MULTIPLE = 4;

/**
 * Each signal counted on its own, rather than combined into one key.
 *
 * This is the correction of a real hole. The previous version hashed
 * fingerprint, IP and visitor id together into a single identity, which
 * meant changing ANY one of them produced a brand new key and a brand new
 * allowance. Rotating IPs behind one device - exactly the abuse worth
 * defending against - reset the quota every time, while the comment above it
 * claimed all three had to change at once. The code did the opposite of what
 * it said.
 *
 * Counting each signal separately, and refusing when any one of them is
 * spent, is what actually holds: a device that rotates a hundred addresses
 * still presents the same fingerprint and the same stored visitor id, and is
 * stopped by those buckets regardless of what the IP does.
 *
 * Every signal remains individually defeatable - fingerprints are degraded by
 * Safari and Firefox and changed by incognito, visitor ids die with site
 * data, addresses rotate - so this raises cost rather than making anything
 * impossible. The global ceiling is what bounds the bill.
 *
 * Values are hashed with a server secret and never stored raw. A device
 * fingerprint is personal data under GDPR and ePrivacy, so it stays one-way
 * and expires with the window.
 */
export type IdentityKey = { key: string; cap: number };

export function identityKeys(parts: {
  ip: string | null;
  fingerprint: string | null;
  visitor: string | null;
}): IdentityKey[] {
  const keys: IdentityKey[] = [];

  // Namespaced per signal, so a fingerprint hash can never land in the same
  // bucket as an address that happens to hash alike.
  if (parts.fingerprint) keys.push({ key: hash(`fp:${parts.fingerprint}`), cap: QUOTA });
  if (parts.visitor) keys.push({ key: hash(`vi:${parts.visitor}`), cap: QUOTA });
  if (parts.ip) keys.push({ key: hash(`ip:${parts.ip}`), cap: QUOTA * IP_MULTIPLE });

  return keys;
}

function hash(value: string): string {
  const salt = process.env.TEASER_ID_SALT ?? "dev-salt";

  // djb2. Not cryptographic, and does not need to be: this only has to make
  // the stored key non-reversible at a glance and stable within a window.
  let h = 5381;
  const input = `${salt}|${value}`;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "quota" | "capacity" };

export async function checkAndCount(keys: IdentityKey[]): Promise<LimitResult> {
  // The global cap is checked first and counted only if the visitor also
  // passes, so a rejected request cannot burn global capacity.
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

  /**
   * Every signal is checked before any is incremented.
   *
   * Charging one bucket and then rejecting on the next would spend a
   * visitor's device allowance on a request they were never served, and over
   * a day of shared-address traffic that quietly eats the allowance of people
   * who did nothing.
   */
  const buckets = keys.map(({ key, cap }) => {
    const bucket = identities.get(key) ?? { count: 0, resetAt: Date.now() + WINDOW_MS };
    identities.set(key, bucket);
    if (Date.now() > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = Date.now() + WINDOW_MS;
    }
    return { bucket, cap };
  });

  if (buckets.some(({ bucket, cap }) => bucket.count >= cap)) {
    return { ok: false, reason: "quota" };
  }

  for (const { bucket } of buckets) bucket.count += 1;
  global.count += 1;

  // The tightest remaining allowance, since that is the one that will stop
  // them next. Absent any signal at all, the global cap is all that applies.
  const remaining = buckets.length
    ? Math.min(...buckets.map(({ bucket, cap }) => Math.max(0, cap - bucket.count)))
    : Infinity;

  return { ok: true, remaining };
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
