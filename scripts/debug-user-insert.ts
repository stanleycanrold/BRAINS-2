/**
 * Reproduces the first-login race: several concurrent requests each try to
 * create the same user. Before the upsert fix this threw a unique-constraint
 * violation and surfaced as a 500 on the very first sign-in.
 *
 *   npx tsx --env-file=.env.local scripts/debug-user-insert.ts
 */
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";

const CLERK_ID = "race_test_" + Date.now();

/** Mirrors the upsert in requireUser(). */
async function createUser(email: string, name: string) {
  const [user] = await db
    .insert(schema.users)
    .values({ clerkId: CLERK_ID, email, name })
    .onConflictDoUpdate({
      target: schema.users.clerkId,
      set: { email, name },
    })
    .returning();
  return user;
}

async function main() {
  console.log("Firing 6 concurrent creates for the same clerk_id…");

  const results = await Promise.allSettled(
    Array.from({ length: 6 }, () =>
      createUser("race@test.local", "Race Test"),
    ),
  );

  const ok = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected");

  console.log(`  succeeded: ${ok}/6`);
  for (const f of failed) {
    console.log("  FAILED:", (f as PromiseRejectedResult).reason?.message);
  }

  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkId, CLERK_ID));
  console.log(`  rows created: ${rows.length} (expected exactly 1)`);

  await db.delete(schema.users).where(eq(schema.users.clerkId, CLERK_ID));
  console.log("  cleanup OK");

  const passed = failed.length === 0 && rows.length === 1;
  console.log(passed ? "\nPASS - race handled" : "\nFAIL");
  if (!passed) process.exit(1);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
