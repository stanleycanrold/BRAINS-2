/**
 * The one place that knows how a questionnaire answer is written down.
 *
 * A submitted response is stored as a single `notes` string rather than a
 * parallel structure, because every channel - questionnaire, interview,
 * social reply - has to land in the same shape for the synthesis agent to
 * read them together. That decision is right and stays.
 *
 * What was missing is the way back. The format was built inline where the
 * response is stored and parsed nowhere, so every screen rendered a wall of
 * concatenated text and a reader had to pick the questions out of it by eye.
 * Formatter and parser now sit together, so the two cannot drift.
 */

export type Answer = { question: string; answer: string };

/** Separates the answer from its question. Chosen to be unlikely in prose. */
const ARROW = "→ ";

export function formatAnswers(answers: Answer[]): string {
  return answers
    .filter((a) => a.answer.trim())
    .map((a) => `${a.question}\n${ARROW}${a.answer.trim()}`)
    .join("\n\n");
}

/**
 * Recovers the question/answer pairs from a stored note.
 *
 * Returns an empty array for anything that is not in this shape, which is the
 * common case for a Fast Track interview: those are typed up as prose by
 * whoever ran the call. Callers render the raw text when this comes back
 * empty rather than showing an empty list, so a free-text note is displayed
 * as what it is instead of being lost.
 */
export function parseAnswers(notes: string): Answer[] {
  if (!notes.includes(ARROW)) return [];

  return notes
    .split(/\n{2,}/)
    .map((block) => {
      const at = block.indexOf(`\n${ARROW}`);
      if (at === -1) return null;
      return {
        question: block.slice(0, at).trim(),
        answer: block.slice(at + 1 + ARROW.length).trim(),
      };
    })
    .filter((pair): pair is Answer => pair !== null && pair.answer.length > 0);
}
