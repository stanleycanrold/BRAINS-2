import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main(){
  const roles = await db.select().from(schema.roles);
  const map = new Map(roles.map(r=>[r.name, r.id] as const));
  const adminId = map.get("ADMIN")!;
  const founderId = map.get("FOUNDER")!;
  const freelancerId = map.get("FREELANCER")!;
  const reviewerId = map.get("REVIEWER")!;

  const users = await db.select().from(schema.users);
  console.log(`Found ${users.length} users`);

  // 1. Ensure every user has FOUNDER + FREELANCER
  for(const u of users){
    const existing = await db.select({role: schema.roles.name}).from(schema.userRoles).innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id)).where(eq(schema.userRoles.userId, u.id));
    const has = new Set(existing.map(x=>x.role));
    if(!has.has("FOUNDER")){
      await db.insert(schema.userRoles).values({userId: u.id, roleId: founderId}).onConflictDoNothing();
      console.log(`+ FOUNDER -> ${u.email}`);
    }
    if(!has.has("FREELANCER")){
      await db.insert(schema.userRoles).values({userId: u.id, roleId: freelancerId}).onConflictDoNothing();
      console.log(`+ FREELANCER -> ${u.email}`);
    }
  }

  // 2. Assign ADMIN to the actual admin emails (fix typo: pattikiplagat)
  const adminEmails = ["pattikiplagat@gmail.com", "stanleycanrold@gmail.com", "pattykiplagat@gmail.com", "stanley@nexabrains.io"];
  for(const email of adminEmails){
    const u = users.find(x=>x.email.toLowerCase()===email.toLowerCase());
    if(!u){ console.log(`ADMIN skip (not in DB): ${email}`); continue; }
    const existing = await db.select({role: schema.roles.name}).from(schema.userRoles).innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id)).where(eq(schema.userRoles.userId, u.id));
    const has = new Set(existing.map(x=>x.role));
    if(!has.has("ADMIN")){
      await db.insert(schema.userRoles).values({userId: u.id, roleId: adminId});
      console.log(`+ ADMIN -> ${u.email}`);
    } else {
      console.log(`ADMIN already -> ${u.email}`);
    }
  }

  // 3. Report
  console.log("\n=== FINAL ===");
  const all = await db.select().from(schema.users);
  for(const u of all){
    const urs = await db.select({role: schema.roles.name}).from(schema.userRoles).innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id)).where(eq(schema.userRoles.userId, u.id));
    console.log(`${u.email}: ${urs.map(x=>x.role).join(", ")}`);
  }
}
main().then(()=>process.exit(0));
