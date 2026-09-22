import Link from "next/link";
import { getEvents, getStores } from "@/lib/queries";

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [events, stores, sp] = await Promise.all([getEvents(), getStores(), searchParams]);
  return (
    <div className="space-y-12">
      {sp.deleted && (
        <p className="rounded-lg bg-leaf/10 px-4 py-3 text-sm text-leaf">Your details were deleted. Thank you for letting us know.</p>
      )}

      <section className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-saffron-deep">March 2027 · Rajasthan</p>
        <h1 className="max-w-3xl text-4xl leading-tight sm:text-5xl">Get dressed for every night of Shanai &amp; Rhea&apos;s wedding.</h1>
        <p className="max-w-2xl text-lg text-ink-soft">
          Indian occasion wear is bought in Mumbai, not shipped abroad. Tell us your measurements once, pick a look for
          each event, and the couple will help you reserve it before you arrive, or point you to the right store when you
          land.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary">
            Enter my sizes
          </Link>
          <Link href="/stores" className="btn-secondary">
            See the stores
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1. Measure", "Chest or bust, waist, hip. Two minutes with a soft tape, in cm or inches."],
          ["2. Pick a look", "For each event, choose from curated options at Mumbai stores with real price bands."],
          ["3. The couple sorts it", "They see everyone's sizes and picks, reserve in Mumbai, or you shop yourself with a clear list."],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <h3 className="text-lg">{t}</h3>
            <p className="mt-1 text-sm text-ink-soft">{d}</p>
          </div>
        ))}
      </section>

      <section id="events" className="space-y-4">
        <h2 className="text-2xl">The events</h2>
        <p className="text-sm text-ink-soft">
          Dates will be confirmed by the couple. Rajasthan in March is warm by day (around 33 °C) and cool at night (around 15
          °C), so evening looks need a shawl, bundi or jacket.
        </p>
        <ol className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <li key={e.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg">{e.name}</h3>
                <span className="chip">{e.timeOfDay === "day" ? "Daytime" : "Evening"}</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">{e.dateLabel}</p>
              <p className="mt-3 text-sm">{e.dressCode}</p>
              {e.palette && (
                <p className="mt-2 text-xs text-ink-soft">
                  <span className="font-semibold">Palette:</span> {e.palette}
                </p>
              )}
              {e.notes && <p className="mt-2 text-xs text-ink-soft">{e.notes}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Where the clothes come from</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {stores.map((s) => (
            <li key={s.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg">{s.name}</h3>
                <span className="chip">{s.wardrobe === "both" ? "Men & women" : s.wardrobe === "menswear" ? "Menswear" : "Womenswear"}</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{s.blurb}</p>
              <p className="mt-2 text-xs text-ink-soft">{s.shippingNote}</p>
            </li>
          ))}
        </ul>
        <Link href="/stores" className="text-sm font-semibold text-saffron-deep underline">
          Addresses, phone numbers and alteration policies →
        </Link>
      </section>
    </div>
  );
}
