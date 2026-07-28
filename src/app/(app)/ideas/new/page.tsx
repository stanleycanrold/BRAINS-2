import type { Metadata } from "next";
import { EntryScreen } from "./EntryForm";
import { NewIdeaTopBar } from "./NewIdeaTopBar";

export const metadata: Metadata = { title: "New Idea" };

/** B2 - New Idea: Entry Point (design system §4.2). */
export default function NewIdeaPage() {
  return (
    <>
      <NewIdeaTopBar />
      <EntryScreen heading="What are you building?" />
    </>
  );
}
