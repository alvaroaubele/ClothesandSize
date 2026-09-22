import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { setupDatabase } from "./setup";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

type Cache = { db?: Db; ready?: Promise<void> };
const g = globalThis as unknown as { __clothesDb?: Cache };
const cache: Cache = (g.__clothesDb ??= {});

async function create(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle({ client: neon(url), schema }) as unknown as Db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  return drizzle({ client, schema }) as unknown as Db;
}

/**
 * Single database handle per process. With PGlite (no DATABASE_URL) the schema
 * is migrated and seeded on first use so `npm run dev` needs no setup step. With
 * Neon the same work runs once at build time via `npm run db:setup`.
 */
export async function getDb(): Promise<Db> {
  if (!cache.db) cache.db = await create();
  if (!process.env.DATABASE_URL) {
    cache.ready ??= setupDatabase(cache.db);
    await cache.ready;
  }
  return cache.db;
}

export { schema };
