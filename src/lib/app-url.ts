import "server-only";

/**
 * The origin the browser actually used to reach us.
 *
 * Return URLs handed to Stripe have to point at an address the founder's
 * browser can reach. A configured NEXT_PUBLIC_APP_URL drifts - it pointed at
 * port 3000 while the dev server ran on 3001, so payments completed at Stripe
 * and then returned people to a dead address, which from their side is
 * indistinguishable from the payment failing.
 *
 * Order of preference:
 *  1. Forwarded headers - correct behind a proxy or tunnel, where the request
 *     URL is the internal address rather than the public one.
 *  2. The request URL's own origin - correct in local development.
 *  3. The configured value, as a last resort.
 */
export function originFor(request: Request): string {
  const headers = request.headers;

  const forwardedHost =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "";
  if (forwardedHost) {
    return `${protoFor(forwardedHost, headers.get("x-forwarded-proto"))}://${forwardedHost}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
}

/**
 * The same answer for a server component, which has headers but no Request.
 *
 * Needed wherever a page has to render an absolute URL the founder will copy
 * and send somewhere - a share link is useless if it points at the wrong
 * host. Reading it on the client instead would render an empty string first
 * and correct it after hydration, which shows a broken link long enough to
 * be copied.
 */
export async function originFromHeaders(): Promise<string> {
  const { headers } = await import("next/headers");
  const store = await headers();

  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "";
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return `${protoFor(host, store.get("x-forwarded-proto"))}://${host}`;
}

/** Local hosts are plain http; everything else is assumed to be terminated TLS. */
function protoFor(host: string, forwarded: string | null): string {
  if (forwarded) return forwarded;
  return host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
}
