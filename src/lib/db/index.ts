import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Do NOT throw at import — Vercel runs `Collecting page data` at build without
// runtime env, and every API route imports `auth` → `db`. Throwing here
// breaks `next build` even when the route will never query at build time.
// Fail only when a query actually runs without a real URL.
if (!connectionString) {
  console.warn(
    "[db] DATABASE_URL not set — using dummy connection for build. Set it in Vercel Project Settings → Environment Variables.",
  );
}

const sql = neon(connectionString || "postgresql://dummy:dummy@localhost:5432/dummy");

export const db = drizzle(sql, { schema });
export { schema };
