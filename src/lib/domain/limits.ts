/**
 * What we will accept as an idea.
 *
 * Shared by the composer and the API so the limit is one number rather than
 * two that drift. The client copy exists to give immediate feedback; the
 * server copy is the one that actually holds, because a limit only enforced
 * in the browser is decoration.
 */

/** Below this there is not enough for the research agent to work with. */
export const MIN_IDEA = 40;

/**
 * Above this, someone is pasting a whole document. Attachments are the right
 * home for that: they are read as context rather than treated as the idea
 * itself, and they do not crowd the search results out of the prompt.
 */
export const MAX_IDEA = 4000;

/**
 * Length alone is a weak test: forty characters of "aaaa" passes it, and so
 * does the same word typed fifteen times. Counting DISTINCT words catches
 * both, and any real description of a problem clears it without trying.
 */
export const MIN_IDEA_WORDS = 8;

export function describeIdeaProblem(text: string): string | null {
  const trimmed = text.trim();

  if (trimmed.length < MIN_IDEA) {
    return `Describe it in a bit more detail, at least ${MIN_IDEA} characters, so there is something to research.`;
  }

  if (trimmed.length > MAX_IDEA) {
    return `That is longer than we can take in one go. Trim it to ${MAX_IDEA.toLocaleString()} characters, or attach the long version as a document.`;
  }

  const words = trimmed.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  const distinct = new Set(words.map((w) => w.toLowerCase()));

  if (words.length < MIN_IDEA_WORDS || distinct.size < MIN_IDEA_WORDS) {
    return "Tell us a little more: what is the situation, and what goes wrong today?";
  }

  return null;
}
