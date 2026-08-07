import { parseAnswers } from "@/lib/domain/response-notes";
import { cn } from "@/lib/cn";

/**
 * One response, as the questions it answered.
 *
 * A submitted questionnaire is stored as a single note with the questions
 * folded into it, and every screen was rendering that raw - a paragraph of
 * run-together text where a reader had to work out by eye which sentence was
 * a question and which was the answer. With seven questions per response and
 * eleven responses, that is the difference between evidence and a wall.
 *
 * Split into rows, the question sits quiet and small and the answer carries
 * the weight, because the questions repeat across every response and the
 * answers are the only part that differs.
 *
 * Falls back to the raw text when a note is not in question/answer shape,
 * which is normal for a Fast Track interview: those are typed up as prose by
 * whoever ran the call. Rendering nothing would silently drop the most
 * expensive responses in the pool.
 */
export function ResponseAnswers({
  notes,
  className,
}: {
  notes: string;
  className?: string;
}) {
  const answers = parseAnswers(notes);

  if (answers.length === 0) {
    return (
      <p className={cn("type-body-m whitespace-pre-wrap text-primary", className)}>
        {notes}
      </p>
    );
  }

  return (
    <dl className={cn("divide-y divide-line", className)}>
      {answers.map((entry, i) => (
        <div key={`${entry.question}-${i}`} className="py-3 first:pt-0 last:pb-0">
          <dt className="type-caption text-tertiary">{entry.question}</dt>
          <dd className="type-body-m mt-1.5 whitespace-pre-wrap text-primary">
            {entry.answer}
          </dd>
        </div>
      ))}
    </dl>
  );
}
