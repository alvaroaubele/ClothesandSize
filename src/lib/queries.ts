import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { Event, Guest, GuestEventPlan, Look, PlanStatus, Store } from "@/db/schema";
import { requireAdmin } from "./adminAuth";

export async function getEvents(): Promise<Event[]> {
  const db = await getDb();
  return db.select().from(schema.events).orderBy(asc(schema.events.sortOrder), asc(schema.events.id));
}

export async function getStores(): Promise<Store[]> {
  const db = await getDb();
  return db.select().from(schema.stores).orderBy(asc(schema.stores.sortOrder), asc(schema.stores.id));
}

export async function getLooks(opts: { activeOnly?: boolean } = {}): Promise<Look[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.looks).orderBy(asc(schema.looks.sortOrder), asc(schema.looks.id));
  return opts.activeOnly ? rows.filter((l) => l.active) : rows;
}

export async function getGuestByToken(token: string): Promise<Guest | null> {
  if (!token) return null;
  const db = await getDb();
  const rows = await db.select().from(schema.guests).where(eq(schema.guests.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function getPlansForGuest(guestId: number): Promise<GuestEventPlan[]> {
  const db = await getDb();
  return db.select().from(schema.guestEventPlans).where(eq(schema.guestEventPlans.guestId, guestId));
}

/** Admin only. The check lives here so no page can list guests without it. */
export async function getAllGuests(): Promise<Guest[]> {
  await requireAdmin();
  const db = await getDb();
  return db.select().from(schema.guests).orderBy(asc(schema.guests.fullName), asc(schema.guests.id));
}

/** Admin only. */
export async function getAllPlans(): Promise<GuestEventPlan[]> {
  await requireAdmin();
  const db = await getDb();
  return db.select().from(schema.guestEventPlans);
}

export async function getLooksByIds(ids: number[]): Promise<Look[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  return db.select().from(schema.looks).where(inArray(schema.looks.id, ids));
}

/** Looks a guest of this wardrobe can pick for an event. Empty eventSlugs = all events. */
export function looksForEvent(looks: Look[], wardrobe: Guest["wardrobe"], eventSlug: string): Look[] {
  return looks.filter(
    (l) => l.active && l.wardrobe === wardrobe && (l.eventSlugs.length === 0 || l.eventSlugs.includes(eventSlug)),
  );
}

/** The status that applies to an event: the per-event override, else the guest's intent. */
export function effectiveStatus(guest: Pick<Guest, "intent">, plan: Pick<GuestEventPlan, "status"> | undefined): PlanStatus | null {
  return plan?.status ?? guest.intent ?? null;
}
