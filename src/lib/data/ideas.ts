import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  emptyIdeaState,
  ideaStateSchema,
  type IdeaState,
  type IdeaStatus,
  type RawSubmission,
  type StageAtEntry,
} from "@/lib/domain/types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Idea repository - the append-only versioning system (PRD §7, §10).
 *
 * The single rule this module enforces: a version's `state_json` is never
 * rewritten in a way that loses history. Edits within a stage patch the
 * current version; a rework forks a NEW version with `parent_version_id` set,
 * so every past report stays readable forever - including for killed ideas.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type IdeaWithState = {
  id: string;
  userId: string;
  title: string;
  summary: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  versionId: string;
  versionNumber: number;
  status: IdeaStatus;
  state: IdeaState;
};

function hydrate(
  idea: typeof schema.ideas.$inferSelect,
  version: typeof schema.ideaStateVersions.$inferSelect,
): IdeaWithState {
  return {
    id: idea.id,
    userId: idea.userId,
    title: idea.title,
    summary: idea.summary,
    archived: idea.archived,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    versionId: version.id,
    versionNumber: version.versionNumber,
    status: version.status,
    // Parsed through the schema so older rows gain any newly-added defaults
    // rather than surfacing as undefined in the UI.
    state: ideaStateSchema.parse(version.stateJson),
  };
}

/** Creates an idea plus version 1. Written before any agent runs (PRD §4.1). */
export async function createIdea(params: {
  userId: string;
  stageAtEntry: StageAtEntry;
  rawSubmission: RawSubmission;
}): Promise<IdeaWithState> {
  const [idea] = await db
    .insert(schema.ideas)
    .values({
      userId: params.userId,
      title: "Untitled idea",
      summary: params.rawSubmission.description.slice(0, 200),
    })
    .returning();

  const state = emptyIdeaState({
    ideaId: idea.id,
    stageAtEntry: params.stageAtEntry,
    rawSubmission: params.rawSubmission,
  });

  const [version] = await db
    .insert(schema.ideaStateVersions)
    .values({
      ideaId: idea.id,
      versionNumber: 1,
      parentVersionId: null,
      status: "draft",
      versionNote: "Original submission",
      stateJson: state,
    })
    .returning();

  const [updated] = await db
    .update(schema.ideas)
    .set({ currentVersionId: version.id })
    .where(eq(schema.ideas.id, idea.id))
    .returning();

  return hydrate(updated, version);
}

/** Loads an idea's current version, scoped to its owner. */
export async function getIdea(
  ideaId: string,
  userId: string,
): Promise<IdeaWithState | null> {
  const rows = await db
    .select()
    .from(schema.ideas)
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .limit(1);

  const idea = rows[0];
  if (!idea) return null;

  const versions = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.ideaId, ideaId))
    .orderBy(desc(schema.ideaStateVersions.versionNumber))
    .limit(1);

  const current =
    versions.find((v) => v.id === idea.currentVersionId) ?? versions[0];
  if (!current) return null;

  return hydrate(idea, current);
}

/** Loads a specific historical version, read-only (PRD §4.5 timeline). */
export async function getIdeaVersion(
  ideaId: string,
  userId: string,
  versionNumber: number,
): Promise<IdeaWithState | null> {
  const rows = await db
    .select()
    .from(schema.ideas)
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .limit(1);
  if (!rows[0]) return null;

  const versions = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(
      and(
        eq(schema.ideaStateVersions.ideaId, ideaId),
        eq(schema.ideaStateVersions.versionNumber, versionNumber),
      ),
    )
    .limit(1);

  return versions[0] ? hydrate(rows[0], versions[0]) : null;
}

export async function listVersions(ideaId: string, userId: string) {
  const rows = await db
    .select()
    .from(schema.ideas)
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .limit(1);
  if (!rows[0]) return [];

  return db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.ideaId, ideaId))
    .orderBy(schema.ideaStateVersions.versionNumber);
}

/**
 * The founder's workspaces, newest activity first.
 *
 * Archived workspaces are left out by default, and that default is the whole
 * point of the option. Killing an idea, or folding a duplicate back into the
 * original, archives rather than deletes it - the report stays readable
 * forever at its own URL. But every list here also went on showing it, so
 * merging two copies of the same idea left the founder looking at two
 * identically-titled rows with no way to tell which one held the responses.
 * An archive that still appears everywhere is not an archive.
 *
 * `includeArchived` is for the places that are counting rather than choosing:
 * billing has to total up work that was paid for whether or not the idea
 * survived.
 */
export async function listIdeas(
  userId: string,
  options: { includeArchived?: boolean } = {},
): Promise<IdeaWithState[]> {
  const ideas = await db
    .select()
    .from(schema.ideas)
    .where(
      options.includeArchived
        ? eq(schema.ideas.userId, userId)
        : and(eq(schema.ideas.userId, userId), eq(schema.ideas.archived, false)),
    )
    .orderBy(desc(schema.ideas.updatedAt));

  if (ideas.length === 0) return [];

  // Scoped to this user's ideas. Selecting the whole table and filtering in
  // memory worked, but cost a full scan on every dashboard load and grew with
  // every other user's history.
  const versions = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(
      inArray(
        schema.ideaStateVersions.ideaId,
        ideas.map((idea) => idea.id),
      ),
    )
    .orderBy(desc(schema.ideaStateVersions.versionNumber));

  const byIdea = new Map<string, typeof schema.ideaStateVersions.$inferSelect>();
  for (const version of versions) {
    if (!byIdea.has(version.ideaId)) byIdea.set(version.ideaId, version);
  }

  return ideas
    .map((idea) => {
      const current =
        versions.find((v) => v.id === idea.currentVersionId) ??
        byIdea.get(idea.id);
      return current ? hydrate(idea, current) : null;
    })
    .filter((x): x is IdeaWithState => x !== null);
}

/**
 * Patches the CURRENT version in place. Used for progress within a stage
 * (research results landing, a response being logged, a proposal accepted) -
 * never for a rework, which must fork instead.
 */
export async function updateCurrentState(
  versionId: string,
  mutate: (state: IdeaState) => IdeaState,
): Promise<IdeaState> {
  const rows = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.id, versionId))
    .limit(1);

  const version = rows[0];
  if (!version) throw new Error(`Version ${versionId} not found`);

  const next = mutate(ideaStateSchema.parse(version.stateJson));
  next.updated_at = new Date().toISOString();

  await db
    .update(schema.ideaStateVersions)
    .set({
      stateJson: next,
      status: next.status,
      updatedAt: new Date(),
    })
    .where(eq(schema.ideaStateVersions.id, versionId));

  await db
    .update(schema.ideas)
    .set({
      updatedAt: new Date(),
      title: next.title || "Untitled idea",
      summary:
        next.structured.problem_statement ||
        next.raw_submission.description.slice(0, 200),
    })
    .where(eq(schema.ideas.id, next.idea_id));

  return next;
}

/**
 * Forks a new version for a rework (PRD §4.5).
 *
 * The loop is unbounded by design and available regardless of score - a
 * founder may rework after a `go_ahead` just as freely as after a `rethink`.
 * Accepted improvement proposals are patched into the new version's structured
 * fields before it is written, so the next round starts from the sharpened
 * idea rather than the original.
 */
export async function forkVersion(params: {
  ideaId: string;
  userId: string;
  note: string;
  patches: Partial<{
    problem_statement: string;
    icp: string;
    value_prop: string;
  }>;
  /** Where the new version resumes: research (B3) or validation (B4). */
  resumeAt: "research" | "validation";
}): Promise<IdeaWithState> {
  const current = await getIdea(params.ideaId, params.userId);
  if (!current) throw new Error("Idea not found");

  const previous = current.state;
  const nextNumber = current.versionNumber + 1;
  const now = new Date().toISOString();

  const next: IdeaState = {
    ...previous,
    version: nextNumber,
    parent_version: previous.version,
    status: params.resumeAt === "research" ? "researching" : "validating_normal",
    version_note: params.note,
    structured: {
      ...previous.structured,
      problem_statement:
        params.patches.problem_statement ?? previous.structured.problem_statement,
      icp: params.patches.icp ?? previous.structured.icp,
      value_prop: params.patches.value_prop ?? previous.structured.value_prop,
    },
    // A new round gathers its own evidence - carrying responses forward would
    // silently inflate the next confirmation rate with stale data.
    research_report: params.resumeAt === "research" ? null : previous.research_report,
    validation: {
      track: null,
      communities: params.resumeAt === "research" ? [] : previous.validation.communities,
      script: params.resumeAt === "research" ? "" : previous.validation.script,
      // Questions carry forward on a light rework so a shared link keeps
      // working; a research rework regenerates them against the new framing.
      questionnaire:
        params.resumeAt === "research"
          ? {
              questions: [],
              share_token: null,
              panel_share_token: null,
              accepting_responses: true,
              intro: "",
              generated_at: "",
            }
          : previous.validation.questionnaire,
      responses: [],
      confirmation_rate: 0,
      synthesis_summary: { themes: [], notable_points: [], objections: [], narrative: "" },
      forced_early_analysis: false,
    },
    social_engagement: { drafted_posts: [], drafted_comments: [] },
    fast_track_order: null,
    decision_gate: null,
    created_at: now,
    updated_at: now,
  };

  const [version] = await db
    .insert(schema.ideaStateVersions)
    .values({
      ideaId: params.ideaId,
      versionNumber: nextNumber,
      parentVersionId: current.versionId,
      status: next.status,
      versionNote: params.note,
      stateJson: next,
    })
    .returning();

  const [idea] = await db
    .update(schema.ideas)
    .set({ currentVersionId: version.id, updatedAt: new Date() })
    .where(eq(schema.ideas.id, params.ideaId))
    .returning();

  return hydrate(idea, version);
}

/** Terminal states retain the full report permanently; nothing is deleted. */
export async function setTerminalStatus(params: {
  ideaId: string;
  userId: string;
  status: Extract<IdeaStatus, "passed" | "killed">;
  killReason?: string | null;
}) {
  const current = await getIdea(params.ideaId, params.userId);
  if (!current) throw new Error("Idea not found");

  await updateCurrentState(current.versionId, (state) => ({
    ...state,
    status: params.status,
    decision_gate: state.decision_gate
      ? {
          ...state.decision_gate,
          user_decision: params.status === "passed" ? "proceed" : "kill",
          kill_reason: params.killReason ?? null,
          decided_at: new Date().toISOString(),
        }
      : state.decision_gate,
  }));

  await db
    .update(schema.ideas)
    .set({ archived: params.status === "killed", updatedAt: new Date() })
    .where(eq(schema.ideas.id, params.ideaId));
}
