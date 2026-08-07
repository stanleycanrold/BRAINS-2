import type { IdeaStatus } from "@/lib/domain/types";

/**
 * Shared between the sidebar and the workspace switcher, which would
 * otherwise import each other.
 */
export type SidebarIdea = {
  id: string;
  title: string;
  status: IdeaStatus;
  score: number | null;
};

/** Status is carried by colour AND text, never colour alone (§Part 5). */
export const STATUS_DOT: Record<IdeaStatus, string> = {
  draft: "bg-line-strong",
  researching: "bg-line-strong",
  validating_normal: "bg-brand",
  validating_fast: "bg-brand",
  gate_review: "bg-caution",
  needs_rework: "bg-caution",
  passed: "bg-success",
  killed: "bg-danger",
};

export const STATUS_TEXT: Record<IdeaStatus, string> = {
  draft: "Draft",
  researching: "Researching",
  validating_normal: "Validating",
  validating_fast: "Validating",
  gate_review: "Ready to decide",
  needs_rework: "Needs rework",
  passed: "Passed",
  killed: "Archived",
};

/**
 * The sections inside one workspace.
 *
 * This is the nav a founder gets once they are inside an idea, replacing the
 * list of every other idea. Which of them are reachable depends on how far
 * the idea has got, and that is decided by the caller from its status - the
 * rule everywhere else in the product is that a stage you have reached stays
 * open forever.
 */
export const WORKSPACE_SECTIONS = [
  { slug: "", label: "Overview" },
  { slug: "/entry", label: "The idea" },
  { slug: "/research", label: "Research" },
  { slug: "/validation", label: "Validation" },
  { slug: "/report", label: "Report" },
  { slug: "/versions", label: "History" },
] as const;
