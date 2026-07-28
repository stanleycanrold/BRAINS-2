import "server-only";

/**
 * The origin the browser actually used to reach us.
 *
 * Return URLs handed to Stripe have to point at an address the founder's
 * browser can reach. A configured NEXT_PUBLIC_APP_URL drifts — it pointed at
 * port 3000 while the dev server ran on 3001, so payments completed at Stripe
 * and then returned people to a dead address, which from their side is
 * indistinguishable from the payment failing.
 *
 * Order of preference:
 *  1. Forwarded headers — correct behind a proxy or tunnel, where the request
 *     URL is the internal address rather than the public one.
 *  2. The request URL's own origin — correct in local development.
 *  3. The configured value, as a last resort.
 */
export function originFor(request: Request): string {
  const headers = request.headers;

  const forwardedHost =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "";
  if (forwardedHost) {
    const proto =
      headers.get("x-forwarded-proto") ??
      (forwardedHost.startsWith("localhost") ||
      forwardedHost.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${forwardedHost}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
}
