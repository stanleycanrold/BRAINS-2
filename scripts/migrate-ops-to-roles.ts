#!/usr/bin/env tsx
/**
 * Migration script: Migrate OPS_ALLOWED_EMAILS to roles table
 * 
 * This script:
 * 1. Reads OPS_ALLOWED_EMAILS from environment
 * 2. Finds matching users in the database
 * 3. Assigns them ADMIN role (which implies REVIEWER + FREELANCER via hierarchy)
 * 4. Also assigns FOUNDER role to all existing users (they can create ideas)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("🔄 Starting OPS_ALLOWED_EMAILS → roles migration...\n");

  // 1. Parse OPS_ALLOWED_EMAILS
  const allowedEmails = (process.env.OPS_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length === 0) {
    console.log("⚠️  No OPS_ALLOWED_EMAILS found in environment. Skipping admin assignment.");
  } else {
    console.log(`📧 Found ${allowedEmails.length} admin email(s):`);
    allowedEmails.forEach((email) => console.log(`   - ${email}`));
  }

  // 2. Ensure roles exist (insert if not exists)
  type RoleName = "ADMIN" | "REVIEWER" | "FREELANCER" | "FOUNDER";
  const defaultRoles: { name: RoleName; description: string }[] = [
    { name: "ADMIN", description: "Full platform access including admin console, reviewer tools, and freelancer abilities" },
    { name: "REVIEWER", description: "AI-assisted review of freelancer submissions" },
    { name: "FREELANCER", description: "Access to freelancer portal: claim work, submit deliverables, track earnings" },
    { name: "FOUNDER", description: "Access to founder portal: create ideas, run validation, view reports" },
  ];

  for (const role of defaultRoles) {
    await db
      .insert(schema.roles)
      .values(role)
      .onConflictDoNothing({ target: schema.roles.name });
  }

  // 3. Get role IDs
  const roles = await db
    .select()
    .from(schema.roles);

  const roleMap = new Map(roles.map((r) => [r.name, r.id]));

  console.log("\n📋 Available roles:");
  roleMap.forEach((id, name) => console.log(`   - ${name}: ${id}`));

  const adminRoleId = roleMap.get("ADMIN");
  const founderRoleId = roleMap.get("FOUNDER");
  const freelancerRoleId = roleMap.get("FREELANCER");

  if (!adminRoleId || !founderRoleId || !freelancerRoleId) {
    console.error("❌ Required roles not found. Run migrations first.");
    process.exit(1);
  }

  // 3. Assign ADMIN role to OPS_ALLOWED_EMAILS users
  if (allowedEmails.length > 0) {
    const adminUsers = await db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.email, allowedEmails));

    console.log(`\n👥 Found ${adminUsers.length} matching user(s) for admin role:`);

    for (const user of adminUsers) {
      console.log(`   - ${user.email} (${user.id})`);

      // Check if already has admin role
      const existing = await db
        .select()
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(
          eq(schema.userRoles.userId, user.id) && eq(schema.roles.name, "ADMIN")
        );

      if (existing.length > 0) {
        console.log(`     ✓ Already has ADMIN role`);
        continue;
      }

      // Assign ADMIN role
      await db.insert(schema.userRoles).values({
        userId: user.id,
        roleId: adminRoleId,
      });
      console.log(`     ✅ Assigned ADMIN role`);
    }
  }

  // 4. Assign FOUNDER role to ALL existing users (they can create ideas)
  console.log("\n👑 Assigning FOUNDER role to all existing users...");
  const allUsers = await db.select().from(schema.users);

  for (const user of allUsers) {
    const existing = await db
      .select()
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(
        eq(schema.userRoles.userId, user.id) && eq(schema.roles.name, "FOUNDER")
      );

    if (existing.length > 0) {
      continue;
    }

    await db.insert(schema.userRoles).values({
      userId: user.id,
      roleId: founderRoleId,
    });
  }
  console.log(`   ✅ Assigned FOUNDER role to ${allUsers.length} user(s)`);

  // 5. Also assign FREELANCER role to all users (they can opt-in to freelance work)
  console.log("\n💼 Assigning FREELANCER role to all existing users...");
  for (const user of allUsers) {
    const existing = await db
      .select()
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(
        eq(schema.userRoles.userId, user.id) && eq(schema.roles.name, "FREELANCER")
      );

    if (existing.length > 0) {
      continue;
    }

    await db.insert(schema.userRoles).values({
      userId: user.id,
      roleId: freelancerRoleId,
    });
  }
  console.log(`   ✅ Assigned FREELANCER role to ${allUsers.length} user(s)`);

  console.log("\n✨ Migration complete!");
  console.log("\n📝 Summary:");
  console.log("   - ADMIN role assigned to OPS_ALLOWED_EMAILS users");
  console.log("   - FOUNDER role assigned to all users (create ideas)");
  console.log("   - FREELANCER role assigned to all users (opt-in to work)");
  console.log("   - REVIEWER role available for promoted freelancers");
  console.log("\n🔑 Role hierarchy: ADMIN > REVIEWER > FREELANCER > FOUNDER");
  console.log("   (Higher roles inherit lower role permissions)");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});