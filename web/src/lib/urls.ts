/**
 * Every absolute URL this site emits, in one place.
 *
 * Two rules here, both learned the hard way on this project.
 *
 * 1. Production never falls back to localhost. The previous version defaulted
 *    to `http://localhost:3001` whenever `NEXT_PUBLIC_APP_URL` was unset, so a
 *    deploy that forgot the variable shipped a Sign up button pointing at the
 *    visitor's own machine. A missing variable in production now resolves to
 *    the real domain instead, which is wrong in far less damaging ways.
 *
 * 2. One definition, imported everywhere. The site URL was duplicated across
 *    five files, each with its own copy of the same fallback string. Five
 *    copies of a constant is five chances for one of them to drift when the
 *    domain moves to brains-ai.com.
 *
 * The env vars still win when set, which is what makes preview deployments and
 * staging domains work without touching code.
 */

const PRODUCTION_SITE = "https://brains.im";
const PRODUCTION_APP = "https://app.brains.im";

/** Only `next dev` sets this. A production build resolves to the real domains. */
const isDev = process.env.NODE_ENV === "development";

function resolve(configured: string | undefined, production: string, dev: string) {
  const trimmed = configured?.trim().replace(/\/+$/, "");
  if (trimmed) return trimmed;
  return isDev ? dev : production;
}

/** This marketing site. Canonicals, sitemap, robots, Open Graph. */
export const SITE_URL = resolve(
  process.env.NEXT_PUBLIC_SITE_URL,
  PRODUCTION_SITE,
  "http://localhost:3001",
);

/** The product. Every Log in, Sign up, and composer submission lands here. */
export const APP_URL = resolve(
  process.env.NEXT_PUBLIC_APP_URL,
  PRODUCTION_APP,
  "http://localhost:3000",
);

export const signInUrl = `${APP_URL}/sign-in`;
export const signUpUrl = `${APP_URL}/sign-up`;
export const dashboardUrl = `${APP_URL}/dashboard`;

/**
 * The free read. Served by the app, not by this site.
 *
 * The model keys, the spend ceiling and the abuse controls belong in one
 * place, and this site deliberately has no database and no model SDK, which
 * is what keeps every page static HTML. Calling across origins costs a
 * preflight; owning a second copy of the agent stack would cost far more.
 */
export const teaserUrl = `${APP_URL}/api/public/teaser`;

/**
 * The real research pass, run before signup. Started with POST, polled with
 * GET, and the same pipeline function the signed-in product calls.
 */
export const researchUrl = `${APP_URL}/api/public/research`;
export const researchStatusUrl = researchUrl;

/**
 * Sign up carrying whatever the visitor already typed, so the app can put it
 * straight back in front of them instead of asking twice.
 *
 * For a composer that has not run anything. If a research pass has already
 * happened, use `signUpWithBrief` instead: handing over the text would make
 * the app run the identical pass a second time and throw away the brief the
 * visitor is looking at.
 */
export function signUpWithDraft(draft: string): string {
  const trimmed = draft.trim();
  if (!trimmed) return signUpUrl;
  return `${signUpUrl}?draft=${encodeURIComponent(trimmed)}`;
}

/**
 * Sign up carrying a finished research run, by token.
 *
 * The run already exists as a real record owned by a system account, so
 * signing up transfers it rather than repeating it. The visitor lands back on
 * the same brief, now theirs, with the proposals live.
 */
export function signUpWithBrief(token: string): string {
  return `${signUpUrl}?claim=${encodeURIComponent(token)}`;
}
