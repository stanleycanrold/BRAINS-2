import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { WORKSPACE_TOKEN_COOKIE } from "@/lib/workspace-token";

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

/** Role hierarchy: ADMIN > REVIEWER > FREELANCER > FOUNDER */
const ROLE_HIERARCHY = ["ADMIN", "REVIEWER", "FREELANCER", "FOUNDER"] as const;
type RoleName = (typeof ROLE_HIERARCHY)[number];

/** Get all role names for a user (including inherited from hierarchy) */
export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const userRoles = await db
    .select({ name: schema.roles.name })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId));

  const directRoles = userRoles.map((r) => r.name as RoleName);
  
  // Expand via hierarchy: ADMIN gets REVIEWER + FREELANCER, REVIEWER gets FREELANCER
  const expanded = new Set<RoleName>();
  for (const role of directRoles) {
    const idx = ROLE_HIERARCHY.indexOf(role);
    for (let i = idx; i < ROLE_HIERARCHY.length; i++) {
      expanded.add(ROLE_HIERARCHY[i]);
    }
  }
  return Array.from(expanded);
}

/** Check if user has a specific role (or higher in hierarchy) */
export async function hasRole(userId: string, requiredRole: RoleName): Promise<boolean> {
  const roles = await getUserRoles(userId);
  const requiredIdx = ROLE_HIERARCHY.indexOf(requiredRole);
  return roles.some((r) => ROLE_HIERARCHY.indexOf(r) <= requiredIdx);
}

/** Require a specific role, redirect if not authorized */
export async function requireRole(
  requiredRole: RoleName,
  redirectTo = "/dashboard"
) {
  const { redirect } = await import("next/navigation");
  const { userId } = await auth();
  const workspace = await workspaceAccess();
  if (!userId && !workspace) redirect("/sign-in");
  const user = await requireUser();
  const authorized = await hasRole(user.id, requiredRole);
  if (!authorized) {
    redirect(redirectTo);
  }
  return user;
}

/** Get current user with their roles attached */
export async function getUserWithRoles() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);
  return { ...user, roles };
}
