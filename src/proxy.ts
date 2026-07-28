import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk only attaches the auth context here - it deliberately does NOT gate
 * routes by path.
 *
 * Protection is enforced at the resource instead: every server component and
 * route handler that touches founder data calls `requireUser()`, which scopes
 * the query to the signed-in user. Path matching in a proxy can diverge from
 * how Next actually routes a request and leave a protected resource reachable;
 * checking at the point of data access cannot.
 */
export default clerkMiddleware();

/**
 * Note: `/q/:token` and `/api/q/:token` are intentionally public. Respondents
 * are strangers to the product and must never be asked to sign in - the share
 * token is their only credential, and the data those routes expose is limited
 * to the questions themselves (see lib/data/questionnaire.ts).
 */

export const config = {
  matcher: [
    // Skip Next internals and static files, but always run on API routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
