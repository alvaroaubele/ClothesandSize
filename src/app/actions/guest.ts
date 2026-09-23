"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { BUDGET_BANDS, PLAN_STATUSES, type BudgetBand, type PlanStatus } from "@/db/schema";
import { formDataToObject, parseGuestForm } from "@/lib/guestSchema";
import { getGuestByToken, getLooks, looksForEvent } from "@/lib/queries";
import { newGuestToken } from "@/lib/tokens";

export type GuestFormState = { errors: Record<string, string>; values: Record<string, string> };

const GUEST_COOKIE = "wardrobe_guest";

/** Remembers the guest's token on this device so the header's "My planner" link and /me can find it. */
async function rememberGuest(token: string | null): Promise<void> {
  const jar = await cookies();
  if (!token) {
    jar.delete(GUEST_COOKIE);
    return;
  }
  jar.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function rememberedGuestToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GUEST_COOKIE)?.value ?? null;
}

export async function createGuest(_prev: GuestFormState, fd: FormData): Promise<GuestFormState> {
  const raw = formDataToObject(fd);
  const parsed = parseGuestForm(raw);
  if (!parsed.ok) return { errors: parsed.errors, values: raw };
  const db = await getDb();
  const token = newGuestToken();
  await db.insert(schema.guests).values({ ...parsed.data, token });
  await rememberGuest(token);
  redirect(`/me/${token}?welcome=1`);
}

export async function updateGuest(_prev: GuestFormState, fd: FormData): Promise<GuestFormState> {
  const raw = formDataToObject(fd);
  const token = raw.token ?? "";
  const guest = await getGuestByToken(token);
  if (!guest) return { errors: { form: "This link is no longer valid." }, values: raw };
  const parsed = parseGuestForm(raw);
  if (!parsed.ok) return { errors: parsed.errors, values: raw };
  const db = await getDb();
  await db
    .update(schema.guests)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.guests.id, guest.id));
  revalidatePath(`/me/${token}`);
  redirect(`/me/${token}?updated=1`);
}

export async function deleteGuest(fd: FormData): Promise<void> {
  const token = String(fd.get("token") ?? "");
  const guest = await getGuestByToken(token);
  if (!guest) redirect("/");
  const db = await getDb();
  await db.delete(schema.guests).where(eq(schema.guests.id, guest.id));
  await rememberGuest(null);
  redirect("/?deleted=1");
}

/** Issues a new private link and invalidates the old one. */
export async function regenerateToken(fd: FormData): Promise<void> {
  const token = String(fd.get("token") ?? "");
  const guest = await getGuestByToken(token);
  if (!guest) redirect("/");
  const next = newGuestToken();
  const db = await getDb();
  await db.update(schema.guests).set({ token: next, updatedAt: new Date() }).where(eq(schema.guests.id, guest.id));
  await rememberGuest(next);
  redirect(`/me/${next}?relinked=1`);
}

const isStatus = (v: string): v is PlanStatus => PLAN_STATUSES.some((s) => s.value === v);
const isBudget = (v: string): v is BudgetBand => BUDGET_BANDS.some((b) => b.value === v);

/**
 * Saves the whole planner in one go: the guest's intent and budget band, then
 * one row per event with an optional status override, ticked looks and notes.
 * Fields are namespaced by event id (`status-12`, `lookIds-12`, `notes-12`).
 */
export async function savePlans(fd: FormData): Promise<void> {
  const token = String(fd.get("token") ?? "");
  const guest = await getGuestByToken(token);
  if (!guest) redirect("/");

  const intentRaw = String(fd.get("intent") ?? "");
  if (!isStatus(intentRaw)) redirect(`/me/${token}?error=intent#intent`);
  const budgetRaw = String(fd.get("budgetBand") ?? "");
  const budgetBand = isBudget(budgetRaw) ? budgetRaw : null;

  const db = await getDb();
  const [events, looks] = await Promise.all([db.select().from(schema.events), getLooks({ activeOnly: true })]);

  await db
    .update(schema.guests)
    .set({ intent: intentRaw, budgetBand, updatedAt: new Date() })
    .where(eq(schema.guests.id, guest.id));

  for (const event of events) {
    const overrideRaw = String(fd.get(`status-${event.id}`) ?? "");
    const status = isStatus(overrideRaw) && overrideRaw !== intentRaw ? overrideRaw : null;
    const allowed = new Set(looksForEvent(looks, guest.wardrobe, event.slug).map((l) => l.id));
    const lookIds = fd
      .getAll(`lookIds-${event.id}`)
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && allowed.has(n));
    const notes = String(fd.get(`notes-${event.id}`) ?? "")
      .trim()
      .slice(0, 1000);
    const existing = await db
      .select({ id: schema.guestEventPlans.id })
      .from(schema.guestEventPlans)
      .where(and(eq(schema.guestEventPlans.guestId, guest.id), eq(schema.guestEventPlans.eventId, event.id)))
      .limit(1);
    if (existing[0]) {
      await db
        .update(schema.guestEventPlans)
        .set({ status, lookIds, notes, updatedAt: new Date() })
        .where(eq(schema.guestEventPlans.id, existing[0].id));
    } else if (status || lookIds.length || notes) {
      await db.insert(schema.guestEventPlans).values({ guestId: guest.id, eventId: event.id, status, lookIds, notes });
    }
  }
  revalidatePath(`/me/${token}`);
  redirect(`/me/${token}?saved=1`);
}
