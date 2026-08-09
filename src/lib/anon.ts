import "server-only";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createIdea } from "@/lib/data/ideas";
import type { IdeaWithState } from "@/lib/data/ideas";
import { ideaStateSchema } from "@/lib/domain/types";

/**
 * Anonymous runs: a visitor on the marketing site getting the real research
 * pass before they have an account.
 *
 * ─── Why a system user rather than a nullable owner ───────────────────────
 *
 * `ideas.user_id` is NOT NULL, and that constraint is what makes every
 * ownership query in the application safe by construction. Loosening it to
 * let anonymous rows exist would weaken the guarantee everywhere in order to
 * serve one route, and every `WHERE user_id = ?` in the codebase would
 * silently become a query that could match rows nobody owns.
 *
 * Instead, anonymous ideas belong to one real `users` row with a reserved
 * clerk_id. Nothing about the schema changes, no migration is needed, the
 * existing pipeline runs untouched, and claiming an idea at signup is a
 * single UPDATE of `user_id` rather than a copy.
 *
 * ─── The rule that must not be broken ─────────────────────────────────────
 *
 * Every read here is scoped to the anonymous owner. The token is an idea id,
 * so without that scope a signed-out request could fetch any founder's idea
 * by guessing or replaying an id. `getAnonIdea` is the only way this route
 * loads anything, and it always filters on the system user.
 */

const ANON_CLERK_ID = "system:anonymous";

/**
 * Tokens are idea ids. Checked before any query, because Postgres raises on a
 * malformed uuid rather than returning no rows, which would turn a mistyped
 * link into a 500 instead of a redirect.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let cachedId: string | null = null;

/** The system owner for pre-signup runs. Created on first use. */
export async function anonUserId(): Promise<string> {
  if (cachedId) return cachedId;

  const [user] = await db
    .insert(schema.users)
    .values({
      clerkId: ANON_CLERK_ID,
      email: "anonymous@system.invalid",
      name: "Anonymous visitor",
    })
    // Idempotent for the same reason `requireUser` is: concurrent first
    // requests would otherwise race on the unique clerk_id and all but one
    // would 500.
    .onConflictDoUpdate({
      target: schema.users.clerkId,
      set: { email: "anonymous@system.invalid" },
    })
    .returning();

  cachedId = user.id;
  return user.id;
}

/**
 * Starts an anonymous run and returns the idea, whose id doubles as the
 * token the visitor polls with.
 *
 * A v4 UUID is unguessable enough to act as a capability, which is the same
 * assumption the existing share links at /s/[token] already make.
 */
export async function createAnonIdea(params: {
  description: string;
  locationFocus?: string;
}): Promise<IdeaWithState> {
  const userId = await anonUserId();

  return createIdea({
    userId,
    // The public composer asks one open question rather than a stage picker.
    // Most visitors typing into a page they reached from search have not
    // built anything, and asking before giving them something is the friction
    // this whole route exists to remove.
    stageAtEntry: "idea_only",
    rawSubmission: {
      description: params.description,
      // Deliberately blank. The extraction agent infers the audience from the
      // description, and an empty field it can reason about beats a required
      // one the visitor has to fill in before seeing any value.
      target_audience: "",
      product_link: null,
      location_focus: params.locationFocus ?? "",
      attachments: [],
    },
  });
}

/**
 * Hands a pre-signup run to the account that just signed up.
 *
 * This is the whole reason anonymous runs are real rows rather than a cache.
 * Without it a visitor watches the research finish, reads the brief, creates
 * an account, and then watches the identical pass run a second time while the
 * sourced report they were just reading is discarded. That is the worst
 * possible moment to waste ninety seconds and a paid run, because it is the
 * one where they have decided to trust us.
 *
 * A single UPDATE, because the record was built by the same pipeline and in
 * the same shape as any other idea. Nothing is copied and no state is
 * rebuilt: only the owner changes.
 *
 * Returns the idea id when it now belongs to this user, null when the token
 * matches nothing claimable. Both outcomes are ordinary. A token that has
 * already been claimed by someone else is indistinguishable from a made-up
 * one, on purpose: answering differently would confirm that a given id exists
 * to anyone willing to guess.
 */
export async function claimAnonIdea(
  token: string,
  userId: string,
): Promise<string | null> {
  if (!UUID.test(token)) return null;

  const anonId = await anonUserId();

  const [claimed] = await db
    .update(schema.ideas)
    .set({ userId })
    // Scoped to the anonymous owner, so this can never take an idea that
    // already belongs to a real founder.
    .where(and(eq(schema.ideas.id, token), eq(schema.ideas.userId, anonId)))
    .returning({ id: schema.ideas.id });

  if (claimed) return claimed.id;

  /**
   * Already theirs. Reloading the claim URL, or arriving on it twice through
   * a back button, should land on the brief rather than on an error: the
   * outcome the visitor wanted has already happened.
   */
  const [owned] = await db
    .select({ id: schema.ideas.id })
    .from(schema.ideas)
    .where(and(eq(schema.ideas.id, token), eq(schema.ideas.userId, userId)))
    .limit(1);

  return owned?.id ?? null;
}

/**
 * Loads an anonymous idea by token, scoped to the system owner.
 *
 * The scope is the security boundary of this entire feature. Do not add a
 * lookup that omits it.
 */
export async function getAnonIdea(token: string): Promise<IdeaWithState | null> {
  if (!UUID.test(token)) return null;

  const userId = await anonUserId();

  const rows = await db
    .select()
    .from(schema.ideas)
    .where(and(eq(schema.ideas.id, token), eq(schema.ideas.userId, userId)))
    .limit(1);

  const idea = rows[0];
  if (!idea?.currentVersionId) return null;

  const versions = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.id, idea.currentVersionId))
    .limit(1);

  const version = versions[0];
  if (!version) return null;

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
    // Parsed rather than cast, matching `hydrate`, so a row written before a
    // field was added still gains that field's default instead of reaching
    // the UI as undefined.
    state: ideaStateSchema.parse(version.stateJson),
  };
}
