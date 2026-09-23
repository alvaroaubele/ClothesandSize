import type { Metadata } from "next";
import Link from "next/link";
import { deleteGuestAsAdmin } from "@/app/actions/admin";
import ConfirmButton from "@/components/ConfirmButton";
import { PLAN_STATUSES, budgetLabel, statusLabel, statusShort, type PlanStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";
import { formatMeasurement, sizesForGuest } from "@/lib/sizes";
import { effectiveStatus, getAllGuests, getAllPlans, getEvents, getLooks, getStores } from "@/lib/queries";

export const metadata: Metadata = { title: "Guests — admin", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminGuestsPage({ searchParams }: Props) {
  await requireAdmin();
  const [sp, guests, plans, events, looks, stores] = await Promise.all([
    searchParams,
    getAllGuests(),
    getAllPlans(),
    getEvents(),
    getLooks(),
    getStores(),
  ]);
  const eventFilter = sp.event ?? "";
  const statusFilter = sp.status ?? "";
  const wardrobeFilter = sp.wardrobe ?? "";
  const lookById = new Map(looks.map((l) => [l.id, l]));
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const plansByGuest = new Map<number, typeof plans>();
  for (const p of plans) plansByGuest.set(p.guestId, [...(plansByGuest.get(p.guestId) ?? []), p]);

  const rows = guests
    .map((g) => ({ guest: g, sizes: sizesForGuest(stores, g), plans: plansByGuest.get(g.id) ?? [] }))
    .filter((r) => !wardrobeFilter || r.guest.wardrobe === wardrobeFilter)
    .filter((r) => {
      if (!eventFilter && !statusFilter) return true;
      return events.some((ev) => {
        if (eventFilter && ev.slug !== eventFilter) return false;
        const p = r.plans.find((x) => x.eventId === ev.id);
        const s = effectiveStatus(r.guest, p);
        return !statusFilter || s === statusFilter;
      });
    });

  // Per-event summary: effective status counts and brand-size counts among guests who answered.
  const summary = events.map((ev) => {
    const byStatus = new Map<PlanStatus, number>();
    const bySize = new Map<string, number>();
    let answered = 0;
    for (const g of guests) {
      const p = plansByGuest.get(g.id)?.find((x) => x.eventId === ev.id);
      const s = effectiveStatus(g, p);
      if (!s) continue;
      answered++;
      byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
      if (s === "preorder_for_me") {
        for (const r of sizesForGuest(stores, g)) {
          const key = `${r.brand} ${r.label ?? "above chart"} (${g.wardrobe === "menswear" ? "M" : "W"})`;
          bySize.set(key, (bySize.get(key) ?? 0) + 1);
        }
      }
    }
    return { ev, answered, byStatus, bySize };
  });

  const unanswered = guests.filter((g) => !g.intent).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Guests</h1>
          <p className="text-sm text-ink-soft">
            {guests.length} registered · {guests.length - unanswered} answered · {unanswered} not yet answered
          </p>
        </div>
        <a href="/admin/export" className="btn-primary">
          Download CSV
        </a>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map(({ ev, answered, byStatus, bySize }) => (
          <div key={ev.id} className="card text-sm">
            <h3 className="text-base">{ev.name}</h3>
            <p className="text-xs text-ink-soft">{answered} guest(s) answered</p>
            <ul className="mt-2 space-y-0.5">
              {PLAN_STATUSES.map((s) => (
                <li key={s.value} className="flex justify-between gap-2">
                  <span className="text-ink-soft">{s.short}</span>
                  <span className="font-semibold">{byStatus.get(s.value) ?? 0}</span>
                </li>
              ))}
            </ul>
            {bySize.size > 0 && (
              <p className="mt-2 text-xs text-ink-soft">
                Sizes to reserve: {[...bySize.entries()].map(([k, v]) => `${k} ×${v}`).join(" · ")}
              </p>
            )}
          </div>
        ))}
      </section>

      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <div>
          <label className="label" htmlFor="event">
            Event
          </label>
          <select id="event" name="event" className="field" defaultValue={eventFilter}>
            <option value="">Any</option>
            {events.map((e) => (
              <option key={e.id} value={e.slug}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">
            Answer
          </label>
          <select id="status" name="status" className="field" defaultValue={statusFilter}>
            <option value="">Any</option>
            {PLAN_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.short}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="wardrobe">
            Wardrobe
          </label>
          <select id="wardrobe" name="wardrobe" className="field" defaultValue={wardrobeFilter}>
            <option value="">Any</option>
            <option value="menswear">Menswear</option>
            <option value="womenswear">Womenswear</option>
          </select>
        </div>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
        {(eventFilter || statusFilter || wardrobeFilter) && (
          <Link href="/admin" className="text-sm underline">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="table min-w-[1200px]" data-testid="guests-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Wardrobe</th>
              <th>Answer &amp; budget</th>
              <th>Measurements</th>
              <th>Computed sizes</th>
              <th>Known sizes / notes</th>
              <th>Per event</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-ink-soft">
                  No guests match.
                </td>
              </tr>
            )}
            {rows.map(({ guest: g, sizes, plans: gp }) => (
              <tr key={g.id} data-testid={`guest-row-${g.id}`}>
                <td>
                  <div className="font-semibold">{g.fullName}</div>
                  <div className="text-xs text-ink-soft">{g.email}</div>
                  {g.phone && <div className="text-xs text-ink-soft">{g.phone}</div>}
                  {g.country && <div className="text-xs text-ink-soft">{g.country}</div>}
                  {g.arrivalDate && <div className="text-xs text-ink-soft">Arrives: {g.arrivalDate}</div>}
                </td>
                <td>{g.wardrobe === "menswear" ? "Menswear" : "Womenswear"}</td>
                <td className="text-xs">
                  <div className="font-semibold">{statusLabel(g.intent)}</div>
                  {g.budgetBand && <div className="text-ink-soft">{budgetLabel(g.budgetBand)}</div>}
                </td>
                <td className="text-xs">
                  {g.wardrobe === "womenswear" ? "Bust" : "Chest"} {formatMeasurement(g.chestCm, g.units)}
                  <br />
                  Waist {formatMeasurement(g.waistCm, g.units)}
                  <br />
                  Hip {formatMeasurement(g.hipCm, g.units)}
                  {g.shoulderCm != null && (
                    <>
                      <br />
                      Shoulder {formatMeasurement(g.shoulderCm, g.units)}
                    </>
                  )}
                  {g.heightCm != null && (
                    <>
                      <br />
                      Height {formatMeasurement(g.heightCm, g.units)}
                    </>
                  )}
                  {g.shoeSize && (
                    <>
                      <br />
                      Shoes {g.shoeSize}
                    </>
                  )}
                </td>
                <td className="text-xs">
                  {sizes.map((s) => (
                    <div key={s.chartKey}>
                      <span className="font-semibold">{s.brand}:</span> {s.label ?? "above chart"}
                      {s.betweenSizes && " (between)"}
                      {s.drivenBy && ` (by ${s.drivenBy})`}
                    </div>
                  ))}
                  {g.wardrobe === "menswear" && <div className="text-ink-soft">Tasva: confirm in store</div>}
                </td>
                <td className="max-w-[220px] text-xs">
                  {g.knownSizes && <div>{g.knownSizes}</div>}
                  {g.notes && <div className="mt-1 text-ink-soft">{g.notes}</div>}
                </td>
                <td className="text-xs">
                  {gp.length === 0 && <span className="text-ink-soft">No event notes</span>}
                  {gp.map((p) => {
                    const ev = eventById.get(p.eventId);
                    if (!ev || (!p.status && p.lookIds.length === 0 && !p.notes)) return null;
                    return (
                      <div key={p.id} className="mb-1">
                        <span className="font-semibold">{ev.name}:</span> {p.status ? statusShort(p.status) : "same as answer"}
                        {p.lookIds.length > 0 && (
                          <ul className="ml-3 list-disc">
                            {p.lookIds.map((id) => {
                              const l = lookById.get(id);
                              if (!l) return null;
                              return (
                                <li key={id}>
                                  {storeById.get(l.storeId)?.name} — {l.title}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {p.notes && <div className="text-ink-soft">“{p.notes}”</div>}
                      </div>
                    );
                  })}
                </td>
                <td>
                  <form action={deleteGuestAsAdmin}>
                    <input type="hidden" name="id" value={g.id} />
                    <ConfirmButton type="submit" className="text-xs text-rose underline" message={`Remove ${g.fullName} and all their answers? This cannot be undone.`}>
                      Remove
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
