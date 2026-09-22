import { PLAN_STATUSES } from "@/db/schema";
import { isAdmin } from "@/lib/adminAuth";
import { toCsv } from "@/lib/csv";
import { formatMeasurement, sizesForGuest } from "@/lib/sizes";
import { getAllGuests, getAllPlans, getEvents, getLooks, getStores } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const [guests, plans, events, looks, stores] = await Promise.all([getAllGuests(), getAllPlans(), getEvents(), getLooks(), getStores()]);
  const lookById = new Map(looks.map((l) => [l.id, l]));
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const statusLabel = (v: string) => PLAN_STATUSES.find((s) => s.value === v)?.label ?? v;

  const header = [
    "guest_id",
    "full_name",
    "email",
    "phone",
    "country",
    "arrival_date",
    "wardrobe",
    "units",
    "chest_or_bust_cm",
    "waist_cm",
    "hip_cm",
    "shoulder_cm",
    "height_cm",
    "measurements_as_entered",
    "shoe_size",
    "known_sizes",
    "computed_sizes",
    "guest_notes",
    "event",
    "status",
    "chosen_looks",
    "event_notes",
    "registered_at",
  ];

  const rows: unknown[][] = [];
  for (const g of guests) {
    const sizes = sizesForGuest(stores, g)
      .map((s) => `${s.brand} ${s.label ?? "above chart"}${s.betweenSizes ? " (between)" : ""}${s.drivenBy ? ` (by ${s.drivenBy})` : ""}`)
      .join("; ");
    const entered = [
      `${g.wardrobe === "womenswear" ? "bust" : "chest"} ${formatMeasurement(g.chestCm, g.units)}`,
      `waist ${formatMeasurement(g.waistCm, g.units)}`,
      `hip ${formatMeasurement(g.hipCm, g.units)}`,
      g.shoulderCm != null ? `shoulder ${formatMeasurement(g.shoulderCm, g.units)}` : null,
      g.heightCm != null ? `height ${formatMeasurement(g.heightCm, g.units)}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    const base = [
      g.id,
      g.fullName,
      g.email,
      g.phone,
      g.country,
      g.arrivalDate,
      g.wardrobe,
      g.units,
      g.chestCm,
      g.waistCm,
      g.hipCm,
      g.shoulderCm ?? "",
      g.heightCm ?? "",
      entered,
      g.shoeSize,
      g.knownSizes,
      sizes,
      g.notes,
    ];
    const gp = plans.filter((p) => p.guestId === g.id);
    if (gp.length === 0) {
      rows.push([...base, "", "", "", "", g.createdAt.toISOString()]);
      continue;
    }
    for (const ev of events) {
      const p = gp.find((x) => x.eventId === ev.id);
      if (!p) continue;
      const chosen = p.lookIds
        .map((id) => lookById.get(id))
        .filter((l): l is NonNullable<typeof l> => !!l)
        .map((l) => `${storeById.get(l.storeId)?.name ?? ""} — ${l.title} (${l.url})`)
        .join(" | ");
      rows.push([...base, ev.name, statusLabel(p.status), chosen, p.notes, g.createdAt.toISOString()]);
    }
  }

  const csv = toCsv(header, rows);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wedding-wardrobe-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
