/**
 * CORS for the routes the marketing site calls from its own origin.
 *
 * Shared rather than copied per route: the allow-list is a security boundary,
 * and a second copy is a second place for a domain to be added and forgotten
 * when the site moves.
 *
 * Note what is deliberately absent: `Access-Control-Allow-Credentials`. These
 * routes take every signal they need from the request body, so no cookie
 * crosses the origin boundary and none should. An earlier version sent
 * `credentials: "include"` from the client without this header, which made
 * the browser reject every response before the page could read it while the
 * endpoint itself answered normally - the failure looked like the API being
 * down. Cookies set on the app's domain and read from the marketing origin
 * are third-party cookies, which Safari and Firefox drop by default, so the
 * pattern could not have worked in production regardless.
 */

const ALLOWED = [
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://nexabrains.io",
  "https://www.nexabrains.io",
  "http://localhost:3000",
].filter(Boolean) as string[];

export function publicCors(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
