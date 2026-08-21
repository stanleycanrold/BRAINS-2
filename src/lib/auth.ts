import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const WORKSPACE_TOKEN_COOKIE = "brains_workspace_token";

export async function workspaceAccess() {
  const token = (await cookies()).get(WORKSPACE_TOKEN_COOKIE)?.value;
  if (!token || token.length < 16) return null;

  const [idea] = await db
    .select({
      id: schema.ideas.id,
      userId: schema.ideas.userId,
      editorToken: schema.ideas.founderEditorToken,
      readToken: schema.ideas.founderReadOnlyToken,
      archived: schema.ideas.archived,
    })
    .from(schema.ideas)
    .where(
      eq(schema.ideas.founderEditorToken, token),
    )
    .limit(1);

  if (!idea || idea.archived) {
    const [readOnlyIdea] = await db
      .select({
        id: schema.ideas.id,
        userId: schema.ideas.userId,
        editorToken: schema.ideas.founderEditorToken,
        readToken: schema.ideas.founderReadOnlyToken,
        archived: schema.ideas.archived,
      })
      .from(schema.ideas)
      .where(eq(schema.ideas.founderReadOnlyToken, token))
      .limit(1);
    if (!readOnlyIdea || readOnlyIdea.archived) return null;
    return { ...readOnlyIdea, token, permission: "read" as const };
  }

  return { ...idea, token, permission: "edit" as const };
}

export async function requireWorkspaceEditor() {
  const access = await workspaceAccess();
  if (access && access.permission !== "edit") {
    throw new Error("This shared workspace is read-only.");
  }
  return access;
}

/**
 * Maps the Clerk identity onto our own `users` row, creating it on first sight.
 * Every data-access helper goes through this, so a request can never read or
 * write another founder's ideas.
 */
export async function requireUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    const access = await workspaceAccess();
    if (!access) throw new Error("Not authenticated");
    const [owner] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, access.userId))
      .limit(1);
    if (!owner) throw new Error("Workspace owner not found");
    return owner;
  }

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId))
    .limit(1);

  if (existing[0]) return existing[0];

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "";
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    null;

  /**
   * Upsert rather than insert.
   *
   * On first sign-in Next renders this layout for several concurrent requests
   * (the navigation plus RSC prefetches). A check-then-insert lets every one of
   * them read "no user", and all but the first then violate the clerk_id unique
   * constraint - which surfaced as a hard 500 on the very first login. Making
   * creation idempotent removes the race entirely instead of narrowing it, and
   * keeps the profile fresh if the founder later changes their name or email in
   * Clerk.
   */
  const [user] = await db
    .insert(schema.users)
    .values({ clerkId, email, name })
    .onConflictDoUpdate({
      target: schema.users.clerkId,
      set: { email, name },
    })
    .returning();

  return user;
}

/** Ops console access is an explicit allow-list, not a role flag (PRD §8). */
export async function isOpsUser(): Promise<boolean> {
  const allowed = (process.env.OPS_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;

  const user = await requireUser();
  return allowed.includes(user.email.toLowerCase());
}
