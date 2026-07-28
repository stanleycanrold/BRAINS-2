import type { Metadata } from "next";
import { EntryForm } from "./EntryForm";
import { NewIdeaTopBar } from "./NewIdeaTopBar";

export const metadata: Metadata = { title: "New Idea" };

/** B2 — New Idea: Entry Point (design system §4.2). */
export default function NewIdeaPage() {
  return (
    <>
      <NewIdeaTopBar />
      <div className="mx-auto max-w-[640px]">
        <h1 className="type-display-l text-primary">
          Describe what you&rsquo;re building
        </h1>
        <p className="type-body-l mt-2 max-w-prose text-secondary">
          A whole product or a single feature — validating one uncertain part
          gets you a sharper answer than validating everything at once. Nothing
          is lost if you stop partway; we save your idea before any research
          starts.
        </p>
        <div className="mt-8">
          <EntryForm />
        </div>
      </div>
    </>
  );
}
