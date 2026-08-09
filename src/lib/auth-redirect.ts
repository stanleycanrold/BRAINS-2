/**
 * Where someone goes once Clerk is finished with them.
 *
 * Shared by sign-up and sign-in rather than written twice. Signing in matters
 * as much as signing up here: the marketing site sends everyone to sign-up,
 * and Clerk's own "already have an account?" link moves them across, which
 * would otherwise drop the run they came to keep.
 */
export function destinationAfterAuth({
  draft,
  claim,
}: {
  draft?: string;
  claim?: string;
}): string | undefined {
  // A finished run wins over raw text. Someone who has both typed an idea and
  // had it researched should get the research.
  const token = claim?.trim();
  if (token) return `/claim/${encodeURIComponent(token)}`;

  const trimmed = draft?.trim();
  if (trimmed) return `/ideas/new?draft=${encodeURIComponent(trimmed)}`;

  return undefined;
}
