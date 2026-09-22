"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db/client";
import { clearAdminSession, isAdmin, passcodeMatches, setAdminSession } from "@/lib/adminAuth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const passcode = String(fd.get("passcode") ?? "");
  if (!passcodeMatches(passcode)) return { error: "That passcode is not right." };
  await setAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || `event-${Date.now()}`;

const eventSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1).max(120),
  dateLabel: z.string().trim().max(120).default(""),
  timeOfDay: z.enum(["day", "evening"]),
  dressCode: z.string().trim().max(1000).default(""),
  palette: z.string().trim().max(300).default(""),
  notes: z.string().trim().max(2000).default(""),
  sortOrder: z.coerce.number().int().default(0),
});

function obj(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

export async function saveEvent(fd: FormData): Promise<void> {
  await requireAdmin();
  const raw = obj(fd);
  if (raw.id === "") delete raw.id;
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) redirect(`/admin/events?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid")}`);
  const { id, ...data } = parsed.data;
  const db = await getDb();
  if (id) {
    await db.update(schema.events).set(data).where(eq(schema.events.id, id));
  } else {
    const base = slugify(data.name);
    const taken = new Set((await db.select({ slug: schema.events.slug }).from(schema.events)).map((r) => r.slug));
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
    await db.insert(schema.events).values({ ...data, slug });
  }
  revalidatePath("/");
  revalidatePath("/admin/events");
  redirect("/admin/events?saved=1");
}

export async function deleteEvent(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id)) {
    const db = await getDb();
    await db.delete(schema.events).where(eq(schema.events.id, id));
  }
  revalidatePath("/");
  redirect("/admin/events?saved=1");
}

const emptyToUndefined = (v: unknown) => (v === "" || v == null ? undefined : v);

const lookSchema = z.object({
  id: z.coerce.number().int().optional(),
  storeId: z.coerce.number().int(),
  title: z.string().trim().min(1).max(160),
  wardrobe: z.enum(["menswear", "womenswear"]),
  garment: z.string().trim().max(80).default(""),
  url: z.url(),
  priceFromInr: z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional()),
  priceToInr: z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional()),
  priceNote: z.string().trim().max(300).default(""),
  notes: z.string().trim().max(1000).default(""),
  sortOrder: z.coerce.number().int().default(0),
  active: z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

export async function saveLook(fd: FormData): Promise<void> {
  await requireAdmin();
  const raw = obj(fd);
  if (raw.id === "") delete raw.id;
  const parsed = lookSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    redirect(`/admin/looks?error=${encodeURIComponent(`${issue?.path.join(".")}: ${issue?.message}`)}`);
  }
  const eventSlugs = fd.getAll("eventSlugs").map(String).filter(Boolean);
  const { id, priceFromInr, priceToInr, ...rest } = parsed.data;
  const data = { ...rest, eventSlugs, priceFromInr: priceFromInr ?? null, priceToInr: priceToInr ?? null, verifiedOn: new Date().toISOString().slice(0, 10) };
  const db = await getDb();
  if (id) await db.update(schema.looks).set(data).where(eq(schema.looks.id, id));
  else await db.insert(schema.looks).values(data);
  revalidatePath("/admin/looks");
  redirect("/admin/looks?saved=1");
}

export async function deleteLook(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id)) {
    const db = await getDb();
    await db.delete(schema.looks).where(eq(schema.looks.id, id));
  }
  redirect("/admin/looks?saved=1");
}

export async function deleteGuestAsAdmin(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id)) {
    const db = await getDb();
    await db.delete(schema.guests).where(eq(schema.guests.id, id));
  }
  revalidatePath("/admin");
  redirect("/admin?saved=1");
}
