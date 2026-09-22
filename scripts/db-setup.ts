/**
 * Migrate + seed. Runs before `next build` on Vercel (DATABASE_URL injected by the
 * Neon integration). Without DATABASE_URL it sets up the local PGlite database so
 * a local build or e2e run has data. Exits 0 in every non-error case.
 */
import fs from "node:fs";
import path from "node:path";
import * as schema from "../src/db/schema";
import { setupDatabase } from "../src/db/setup";

async function main() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const db = drizzle({ client: neon(url), schema });
    await setupDatabase(db as never);
    console.log("db-setup: Neon database migrated and seeded.");
    return;
  }
  if (process.env.SKIP_LOCAL_DB_SETUP) {
    console.log("db-setup: skipped (SKIP_LOCAL_DB_SETUP set).");
    return;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle({ client, schema });
  await setupDatabase(db as never);
  await client.close();
  console.log(`db-setup: local PGlite database ready at ${dataDir}.`);
}

main().catch((err) => {
  console.error("db-setup failed:", err);
  process.exit(1);
});
