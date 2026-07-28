import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Maps the Clerk identity onto our own `users` row, creating it on first sight.
 * Every data-access helper goes through this, so a request can never read or
 * write another founder's ideas.
 */
export async function requireUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

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
   * constraint — which surfaced as a hard 500 on the very first login. Making
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
