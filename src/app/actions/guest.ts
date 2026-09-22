"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { PLAN_STATUSES, type PlanStatus } from "@/db/schema";
import { formDataToObject, parseGuestForm } from "@/lib/guestSchema";
import { getGuestByToken } from "@/lib/queries";
import { newGuestToken } from "@/lib/tokens";

export type GuestFormState = { errors: Record<string, string>; values: Record<string, string> };

export async function createGuest(_prev: GuestFormState, fd: FormData): Promise<GuestFormState> {
  const raw = formDataToObject(fd);
  const parsed = parseGuestForm(raw);
  if (!parsed.ok) return { errors: parsed.errors, values: raw };
  const db = await getDb();
  const token = newGuestToken();
  await db.insert(schema.guests).values({ ...parsed.data, token });
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
  redirect("/?deleted=1");
}

export async function savePlan(fd: FormData): Promise<void> {
  const token = String(fd.get("token") ?? "");
  const eventId = Number(fd.get("eventId"));
  const guest = await getGuestByToken(token);
  if (!guest || !Number.isInteger(eventId)) redirect("/");
  const statusRaw = String(fd.get("status") ?? "undecided");
  const status: PlanStatus = PLAN_STATUSES.some((s) => s.value === statusRaw)
    ? (statusRaw as PlanStatus)
    : "undecided";
  const lookIds = fd
    .getAll("lookIds")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
  const notes = String(fd.get("notes") ?? "")
    .trim()
    .slice(0, 1000);

  const db = await getDb();
  const [event] = await db.select().from(schema.events).where(eq(schema.events.id, eventId)).limit(1);
  if (!event) redirect(`/me/${token}`);

  const existing = await db
    .select({ id: schema.guestEventPlans.id })
    .from(schema.guestEventPlans)
    .where(and(eq(schema.guestEventPlans.guestId, guest.id), eq(schema.guestEventPlans.eventId, eventId)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(schema.guestEventPlans)
      .set({ status, lookIds, notes, updatedAt: new Date() })
      .where(eq(schema.guestEventPlans.id, existing[0].id));
  } else {
    await db.insert(schema.guestEventPlans).values({ guestId: guest.id, eventId, status, lookIds, notes });
  }
  revalidatePath(`/me/${token}`);
  redirect(`/me/${token}?saved=${event.slug}#event-${event.slug}`);
}
