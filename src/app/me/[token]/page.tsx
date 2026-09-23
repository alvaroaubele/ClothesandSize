import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { deleteGuest, regenerateToken, savePlans } from "@/app/actions/guest";
import ConfirmButton from "@/components/ConfirmButton";
import PrivateLinkCard from "@/components/PrivateLinkCard";
import { BUDGET_BANDS, PLAN_STATUSES, statusShort } from "@/db/schema";
import { TASVA_SIZE_LABELS } from "@/lib/sizeCharts";
import { formatMeasurement, sizesForGuest } from "@/lib/sizes";
import { effectiveStatus, getEvents, getGuestByToken, getLooks, getPlansForGuest, getStores, looksForEvent } from "@/lib/queries";

export const metadata: Metadata = { title: "My planner — Shanai & Rhea", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> };

const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function PlannerPage({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const guest = await getGuestByToken(token);
  if (!guest) notFound();
  const [events, stores, looks, plans, h] = await Promise.all([
    getEvents(),
    getStores(),
    getLooks({ activeOnly: true }),
    getPlansForGuest(guest.id),
    headers(),
  ]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const privateUrl = `${proto}://${host}/me/${token}`;

  const sizes = sizesForGuest(stores, guest);
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const planByEvent = new Map(plans.map((p) => [p.eventId, p]));
  const tasva = stores.find((s) => s.slug === "tasva");
  const showTasva = guest.wardrobe === "menswear" && tasva;
  const answered = !!guest.intent;

  return (
    <div className="space-y-8">
      {sp.welcome && (
        <p className="rounded-lg bg-leaf/10 px-4 py-3 text-sm text-leaf" role="status">
          Saved. Your sizes are below. Next, tell the couple what you would like them to do.
        </p>
      )}
      {sp.updated && (
        <p className="rounded-lg bg-leaf/10 px-4 py-3 text-sm text-leaf" role="status">
          Your details are updated.
        </p>
      )}
      {sp.relinked && (
        <p className="rounded-lg bg-leaf/10 px-4 py-3 text-sm text-leaf" role="status">
          New link issued. The old one no longer works; copy this one.
        </p>
      )}
      {sp.error === "intent" && (
        <p className="rounded-lg bg-rose/10 px-4 py-3 text-sm text-rose" role="alert">
          Please choose what the couple should do before saving.
        </p>
      )}

      <PrivateLinkCard url={privateUrl} token={token} regenerate={regenerateToken} />

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
          Computed from each brand&apos;s published &quot;to fit body measurements&quot; chart. Cuts vary by garment; treat this as
          your starting size. Stores hem and take in for a small fee or free.
        </p>
      </section>

      <form action={savePlans} className="space-y-6">
        <input type="hidden" name="token" value={token} />

        <section id="intent" className="card space-y-4 scroll-mt-24">
          <div>
            <h2 className="text-2xl">What should Shanai &amp; Rhea do for you?</h2>
            <p className="mt-1 text-sm text-ink-soft">
              One answer for the whole wedding. The couple buys in Mumbai before you land; stores here do not ship abroad.
              You can change this any time.
            </p>
          </div>
          <fieldset>
            <legend className="label">Your answer</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {PLAN_STATUSES.map((s) => (
                <label key={s.value} className="choice">
                  <input type="radio" name="intent" value={s.value} defaultChecked={guest.intent === s.value} required className="accent-saffron" />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Rough budget per outfit, so the couple can shortlist (optional)</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {BUDGET_BANDS.map((b) => (
                <label key={b.value} className="choice">
                  <input type="radio" name="budgetBand" value={b.value} defaultChecked={guest.budgetBand === b.value} className="accent-saffron" />
                  {b.label}
                </label>
              ))}
            </div>
            <p className="hint">A guide for shortlisting, not an instruction to spend. Nothing is bought without a message to you first.</p>
          </fieldset>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-2xl">The events</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Open an event to see the dress code and what the couple is looking at in Mumbai. Tick anything you would like to
              see, add a note, or change your answer for that one event.
            </p>
          </div>
          {events.map((event, i) => {
            const plan = planByEvent.get(event.id);
            const options = looksForEvent(looks, guest.wardrobe, event.slug);
            const chosen = new Set(plan?.lookIds ?? []);
            const status = effectiveStatus(guest, plan);
            return (
              <details key={event.id} id={`event-${event.slug}`} className="card scroll-mt-24" open={i === 0 && !answered}>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-display text-lg">{event.name}</span>
                    <span className="ml-2 text-xs text-ink-soft">
                      {event.dateLabel} · {event.timeOfDay === "day" ? "Daytime" : "Evening"}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {plan?.status && <span className="chip">{statusShort(plan.status)} for this one</span>}
                    {!plan?.status && status && <span className="chip">{statusShort(status)}</span>}
                    {chosen.size > 0 && <span className="chip">{chosen.size} ticked</span>}
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  <p className="text-sm">{event.dressCode}</p>
                  {event.palette && (
                    <p className="text-xs text-ink-soft">
                      <span className="font-semibold">Palette:</span> {event.palette}
                    </p>
                  )}
                  {event.notes && <p className="text-xs text-ink-soft">{event.notes}</p>}

                  <fieldset className="space-y-2">
                    <legend className="label">What the couple is looking at in Mumbai — tick anything you would like to see</legend>
                    {options.length === 0 && <p className="text-sm text-ink-soft">No options listed yet for this event.</p>}
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {options.map((l) => {
                        const store = storeById.get(l.storeId);
                        const price =
                          l.priceFromInr && l.priceToInr
                            ? `${formatPrice(l.priceFromInr)} – ${formatPrice(l.priceToInr)}`
                            : l.priceFromInr
                              ? `from ${formatPrice(l.priceFromInr)}`
                              : null;
                        return (
                          <li key={l.id} className="flex h-full flex-col rounded-lg border border-line bg-paper p-3 text-sm has-[:checked]:border-saffron has-[:checked]:bg-saffron/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-saffron">
                            <label className="flex cursor-pointer gap-3">
                              <input type="checkbox" name={`lookIds-${event.id}`} value={l.id} defaultChecked={chosen.has(l.id)} className="mt-1 accent-saffron" />
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold">{l.title}</span>
                                <span className="block text-xs text-ink-soft">
                                  {store?.name}
                                  {l.garment && <> · {l.garment}</>}
                                  {price && <> · {price}</>}
                                </span>
                                {!price && <span className="chip mt-1">Price to confirm</span>}
                                {l.priceNote && <span className="mt-1 block text-xs text-ink-soft">{l.priceNote}</span>}
                                {l.notes && <span className="mt-1 block text-xs">{l.notes}</span>}
                              </span>
                            </label>
                            <a href={l.url} target="_blank" rel="noreferrer noopener" className="mt-2 ml-7 inline-block text-xs text-saffron-deep underline">
                              Browse at {store?.name} (opens in a new tab)
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor={`status-${event.id}`}>
                        Different answer for {event.name}?
                      </label>
                      <select id={`status-${event.id}`} name={`status-${event.id}`} className="field" defaultValue={plan?.status ?? ""}>
                        <option value="">Same as my answer above</option>
                        {PLAN_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor={`notes-${event.id}`}>
                        Notes for the couple (optional)
                      </label>
                      <textarea id={`notes-${event.id}`} name={`notes-${event.id}`} rows={2} className="field" defaultValue={plan?.notes ?? ""} placeholder="A colour you would love, something you already own, a link…" />
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </section>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur">
          <button type="submit" className="btn-primary">
            Save my answers
          </button>
          {sp.saved && (
            <span className="text-sm text-leaf" role="status" data-testid="saved">
              Saved. The couple can see this now.
            </span>
          )}
          {!sp.saved && answered && <span className="text-xs text-ink-soft">Last saved answer: {statusShort(guest.intent)}</span>}
        </div>
      </form>

      <section className="card space-y-3 border-rose/30">
        <h2 className="text-lg">Delete my data</h2>
        <p className="text-sm text-ink-soft">
          Removes your measurements and every answer above. The couple will no longer see you in their list.
        </p>
        <form action={deleteGuest}>
          <input type="hidden" name="token" value={token} />
          <ConfirmButton type="submit" className="btn-danger" message="Delete your measurements and all your answers? This cannot be undone.">
            Delete everything about me
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
