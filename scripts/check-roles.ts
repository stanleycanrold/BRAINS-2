import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main(){
const users = await db.select().from(schema.users).limit(20);
console.log("=== USERS ===");
users.forEach(u => console.log(`${u.email} | ${u.id} | clerk:${u.clerkId.slice(0,12)}`));

const roles = await db.select().from(schema.roles);
console.log("\n=== ROLES ===");
roles.forEach(r => console.log(`${r.name} | ${r.id}`));

console.log("\n=== USER_ROLES ===");
for (const u of users.slice(0,5)) {
  const urs = await db.select({role: schema.roles.name}).from(schema.userRoles).innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id)).where(eq(schema.userRoles.userId, u.id));
  console.log(`${u.email}: ${urs.map(x=>x.role).join(", ") || "(none)"}`);
}

const envEmails = (process.env.OPS_ALLOWED_EMAILS ?? "").split(",").map(e=>e.trim().toLowerCase()).filter(Boolean);
console.log("\n=== OPS_ALLOWED_EMAILS env ===");
console.log(envEmails);
for (const email of envEmails) {
  const found = users.find(u=>u.email.toLowerCase()===email);
  console.log(`${email}: ${found ? "FOUND in DB" : "NOT FOUND - need to sign in first"}`);
}
}
main().then(()=>process.exit(0));
