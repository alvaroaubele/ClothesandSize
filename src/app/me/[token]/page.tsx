import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteGuest, savePlan } from "@/app/actions/guest";
import { PLAN_STATUSES } from "@/db/schema";
import { TASVA_SIZE_LABELS } from "@/lib/sizeCharts";
import { formatMeasurement, sizesForGuest } from "@/lib/sizes";
import { getEvents, getGuestByToken, getLooks, getPlansForGuest, getStores, looksForEvent } from "@/lib/queries";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function PlannerPage({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const guest = await getGuestByToken(token);
  if (!guest) notFound();
  const [events, stores, looks, plans] = await Promise.all([getEvents(), getStores(), getLooks({ activeOnly: true }), getPlansForGuest(guest.id)]);
  const sizes = sizesForGuest(stores, guest);
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const planByEvent = new Map(plans.map((p) => [p.eventId, p]));
  const tasva = stores.find((s) => s.slug === "tasva");
  const showTasva = guest.wardrobe === "menswear" && tasva;

  return (
    <div className="space-y-10">
      {sp.welcome && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          <p className="font-semibold">Saved. Bookmark this page.</p>
          <p className="mt-1 text-ink-soft">
            This private link is the only way back to your sizes and picks. Nobody else can guess it. You can change or
            delete everything from here.
          </p>
        </div>
      )}
      {sp.updated && <p className="rounded-lg bg-leaf/10 px-4 py-3 text-sm text-leaf">Your details are updated.</p>}

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{guest.fullName}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {guest.wardrobe === "menswear" ? "Menswear" : "Womenswear"} · {guest.wardrobe === "womenswear" ? "bust" : "chest"}{" "}
            {formatMeasurement(guest.chestCm, guest.units)} · waist {formatMeasurement(guest.waistCm, guest.units)} · hip{" "}
            {formatMeasurement(guest.hipCm, guest.units)}
            {guest.shoulderCm != null && <> · shoulder {formatMeasurement(guest.shoulderCm, guest.units)}</>}
            {guest.heightCm != null && <> · height {formatMeasurement(guest.heightCm, guest.units)}</>}
            {guest.shoeSize && <> · shoes {guest.shoeSize}</>}
          </p>
        </div>
        <Link href={`/me/${token}/edit`} className="btn-secondary">
          Edit my details
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Your sizes by store</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {sizes.map((r) => (
            <div key={r.chartKey} className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{r.brand}</p>
              <p className="mt-1 font-display text-4xl" data-testid={`size-${r.chartKey}`}>
                {r.label ?? "Above chart"}
              </p>
              <p className="mt-1 text-xs text-ink-soft">{r.chartName}</p>
              <p className="mt-2 text-sm">{r.rationale}</p>
              {r.betweenSizes && <p className="mt-2 chip">Between sizes — try both</p>}
            </div>
          ))}
          {showTasva && (
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Tasva</p>
              <p className="mt-1 font-display text-2xl">{TASVA_SIZE_LABELS.join(" · ")}</p>
              <p className="mt-2 text-sm">{tasva.sizeNote}</p>
              <p className="mt-2 text-xs text-ink-soft">{tasva.alterationNote}</p>
            </div>
          )}
          {sizes.length === 0 && !showTasva && (
            <p className="text-sm text-ink-soft">No verified size chart applies yet. Bring your measurements to the store.</p>
          )}
        </div>
        <p className="text-xs text-ink-soft">
          Sizes are computed from each brand&apos;s published &quot;to fit body measurements&quot; chart. Cuts vary by garment;
          treat this as your starting size, and note that stores hem and take in for a small fee or free.
        </p>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl">Your look for each event</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Tick the options you like and tell the couple what you want them to do. You can change this any time.
          </p>
        </div>
        {events.map((event) => {
          const plan = planByEvent.get(event.id);
          const options = looksForEvent(looks, guest.wardrobe, event.slug);
          const chosen = new Set(plan?.lookIds ?? []);
          const saved = sp.saved === event.slug;
          return (
            <form key={event.id} id={`event-${event.slug}`} action={savePlan} className="card space-y-4 scroll-mt-24">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="eventId" value={event.id} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl">{event.name}</h3>
                  <p className="text-xs text-ink-soft">
                    {event.dateLabel} · {event.timeOfDay === "day" ? "Daytime" : "Evening"}
                  </p>
                </div>
                {plan && <span className="chip">{PLAN_STATUSES.find((s) => s.value === plan.status)?.label}</span>}
              </div>
              <p className="text-sm">{event.dressCode}</p>
              {event.palette && (
                <p className="text-xs text-ink-soft">
                  <span className="font-semibold">Palette:</span> {event.palette}
                </p>
              )}
              {event.notes && <p className="text-xs text-ink-soft">{event.notes}</p>}

              <fieldset className="space-y-2">
                <legend className="label">Options at Mumbai stores</legend>
                {options.length === 0 && <p className="text-sm text-ink-soft">No curated options yet for this event.</p>}
                <ul className="grid gap-2 sm:grid-cols-2">
                  {options.map((l) => {
                    const store = storeById.get(l.storeId);
                    const price =
                      l.priceFromInr && l.priceToInr
                        ? `₹${l.priceFromInr.toLocaleString("en-IN")} – ₹${l.priceToInr.toLocaleString("en-IN")}`
                        : l.priceFromInr
                          ? `from ₹${l.priceFromInr.toLocaleString("en-IN")}`
                          : null;
                    return (
                      <li key={l.id}>
                        <label className="flex h-full cursor-pointer gap-3 rounded-lg border border-line bg-paper p-3 text-sm has-[:checked]:border-saffron has-[:checked]:bg-saffron/10">
                          <input type="checkbox" name="lookIds" value={l.id} defaultChecked={chosen.has(l.id)} className="mt-1 accent-saffron" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold">{l.title}</span>
                            <span className="block text-xs text-ink-soft">
                              {store?.name}
                              {l.garment && <> · {l.garment}</>}
                              {price && <> · {price}</>}
                            </span>
                            {l.priceNote && <span className="mt-1 block text-xs text-ink-soft">{l.priceNote}</span>}
                            {l.notes && <span className="mt-1 block text-xs">{l.notes}</span>}
                            <a href={l.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-saffron-deep underline">
                              Browse at {store?.name} ↗
                            </a>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="label">What should the couple do?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PLAN_STATUSES.map((s) => (
                    <label
                      key={s.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-sm has-[:checked]:border-saffron has-[:checked]:bg-saffron/10"
                    >
                      <input type="radio" name="status" value={s.value} defaultChecked={(plan?.status ?? "undecided") === s.value} className="accent-saffron" />
                      {s.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="label" htmlFor={`notes-${event.slug}`}>
                  Notes for the couple (optional)
                </label>
                <textarea id={`notes-${event.slug}`} name="notes" rows={2} className="field" defaultValue={plan?.notes ?? ""} placeholder="Colour preferences, budget, a link to something you saw…" />
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" className="btn-primary">
                  Save {event.name}
                </button>
                {saved && <span className="text-sm text-leaf" data-testid={`saved-${event.slug}`}>Saved</span>}
              </div>
            </form>
          );
        })}
      </section>

      <section className="card space-y-3 border-rose/30">
        <h2 className="text-lg">Delete my data</h2>
        <p className="text-sm text-ink-soft">
          Removes your measurements and every choice above. The couple will no longer see you in their list.
        </p>
        <form action={deleteGuest}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn-danger">
            Delete everything about me
          </button>
        </form>
      </section>
    </div>
  );
}
