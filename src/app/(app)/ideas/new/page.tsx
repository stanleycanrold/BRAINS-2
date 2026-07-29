import type { Metadata } from "next";
import { EntryScreen } from "./EntryForm";
import { NewIdeaTopBar } from "./NewIdeaTopBar";

export const metadata: Metadata = { title: "New Idea" };

/**
 * B2 - New Idea: Entry Point (design system §4.2).
 *
 * `?draft=` carries an idea typed on the marketing site before signing up.
 * Read here on the server and handed to the composer as its initial value, so
 * there is no hydration mismatch and nobody is asked to type the same
 * paragraph twice. Absent for anyone who started inside the app.
 */
export default async function NewIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { draft } = await searchParams;

  return (
    <>
      <NewIdeaTopBar />
      <EntryScreen
        heading="What are you building?"
        initialDescription={draft ?? ""}
      />
    </>
  );
}
