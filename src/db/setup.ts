import path from "node:path";
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { SEED_EVENTS, SEED_LOOKS, SEED_STORES } from "@/data/seed";

type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema>;

const migrationsFolder = path.join(process.cwd(), "drizzle");

async function migrate(db: AnyDb) {
  if (process.env.DATABASE_URL) {
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    await migrate(db as never, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as never, { migrationsFolder });
  }
}

/**
 * Inserts seed rows that do not exist yet, keyed by slug (events, stores) or by
 * store + title (looks). Never overwrites rows the couple has edited.
 */
export async function seed(db: AnyDb) {
  for (const e of SEED_EVENTS) {
    await db.insert(schema.events).values(e).onConflictDoNothing({ target: schema.events.slug });
  }
  for (const s of SEED_STORES) {
    await db.insert(schema.stores).values(s).onConflictDoNothing({ target: schema.stores.slug });
  }
  const storeRows = await db.select({ id: schema.stores.id, slug: schema.stores.slug }).from(schema.stores);
  const storeId = new Map(storeRows.map((r) => [r.slug, r.id]));
  const existing = await db.select({ storeId: schema.looks.storeId, title: schema.looks.title }).from(schema.looks);
  const have = new Set(existing.map((l) => `${l.storeId}::${l.title}`));
  for (const l of SEED_LOOKS) {
    const sid = storeId.get(l.storeSlug);
    if (!sid || have.has(`${sid}::${l.title}`)) continue;
    const { storeSlug: _drop, ...rest } = l;
    void _drop;
    await db.insert(schema.looks).values({ ...rest, storeId: sid });
  }
}

export async function setupDatabase(db: AnyDb) {
  await migrate(db);
  await seed(db);
  await db.execute(sql`select 1`);
}
