/**
 * Is this idea the one they already have?
 *
 * A founder who wants to change how their idea is written has two things in
 * front of them: an edit screen inside the workspace, and a prominent "New
 * idea" button. Picking the second produces a second workspace holding the
 * same idea, with the responses split across both - and nothing anywhere says
 * so, because two rows in a list with near-identical titles look like exactly
 * what you would expect after editing a title.
 *
 * Comparison is on the founder's own words rather than the title, because the
 * title is generated and drifts between runs of the extraction agent. It was
 * the titles that differed by a single hyphen while the descriptions were
 * byte-identical.
 */

/** Words too common to carry any signal about which idea this is. */
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "has", "have", "in", "is", "it", "its", "of", "on", "or", "that", "the",
  "their", "them", "they", "this", "to", "was", "we", "were", "with", "you",
  "your",
]);

function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word)),
  );
}

/**
 * Jaccard overlap of the two word sets, 0 to 1.
 *
 * Chosen over comparing a prefix because a founder editing an idea usually
 * changes a clause in the middle and leaves the opening intact - or rewrites
 * the opening and leaves the rest. A prefix check catches the first and misses
 * the second; set overlap catches both.
 */
export function descriptionSimilarity(a: string, b: string): number {
  const left = tokenise(a);
  const right = tokenise(b);
  if (left.size === 0 || right.size === 0) return 0;

  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;

  return shared / (left.size + right.size - shared);
}

/**
 * High enough that two genuinely different ideas in the same domain do not
 * trip it, low enough to catch a real edit-and-resubmit. Two ideas about
 * school software share vocabulary; the same idea pasted twice shares nearly
 * all of it.
 *
 * This only ever produces a prompt, never a refusal - a founder who means to
 * create a near-identical idea can, in one more click.
 */
export const DUPLICATE_THRESHOLD = 0.7;
