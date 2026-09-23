import type { Metadata } from "next";
import { deleteLook, saveLook } from "@/app/actions/admin";
import ConfirmButton from "@/components/ConfirmButton";
import type { Event, Look, Store } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";
import { getEvents, getLooks, getStores } from "@/lib/queries";

export const metadata: Metadata = { title: "Looks — admin", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminLooksPage({ searchParams }: Props) {
  await requireAdmin();
  const [sp, looks, stores, events] = await Promise.all([searchParams, getLooks(), getStores(), getEvents()]);
  const storeById = new Map(stores.map((s) => [s.id, s]));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Looks</h1>
        <p className="text-sm text-ink-soft">
          The option cards guests pick from. Link to a category or product page at the store. Leave every event unticked
          to show the look for all events. Untick &quot;Visible&quot; to hide one without deleting it. Stores themselves are
          seeded from <code>src/data/seed.ts</code>.
        </p>
      </div>
      {sp.saved && <p className="rounded-lg bg-leaf/10 px-3 py-2 text-sm text-leaf">Saved.</p>}
      {sp.error && <p className="rounded-lg bg-rose/10 px-3 py-2 text-sm text-rose">{sp.error}</p>}

      <details className="card" open={!!sp.error}>
        <summary className="cursor-pointer font-semibold">Add a look</summary>
        <div className="mt-4">
          <LookForm stores={stores} events={events} />
        </div>
      </details>

      {looks.map((l) => (
        <details key={l.id} className="card">
          <summary className="cursor-pointer">
            <span className="font-semibold">{l.title}</span>
            <span className="ml-2 text-xs text-ink-soft">
              {storeById.get(l.storeId)?.name} · {l.wardrobe} · {l.eventSlugs.length ? l.eventSlugs.join(", ") : "all events"}
              {!l.active && " · hidden"}
            </span>
          </summary>
          <div className="mt-4">
            <LookForm look={l} stores={stores} events={events} />
          </div>
        </details>
      ))}
    </div>
  );
}

function LookForm({ look, stores, events }: { look?: Look; stores: Store[]; events: Event[] }) {
  const id = (f: string) => `${look ? `look-${look.id}` : "look-new"}-${f}`;
  return (
    <form action={saveLook} className="space-y-3">
      {look && <input type="hidden" name="id" value={look.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor={id("title")}>Title</label>
          <input id={id("title")} name="title" className="field" defaultValue={look?.title ?? ""} required />
        </div>
        <div>
          <label className="label" htmlFor={id("storeId")}>Store</label>
          <select id={id("storeId")} name="storeId" className="field" defaultValue={look?.storeId ?? stores[0]?.id}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={id("wardrobe")}>Wardrobe</label>
          <select id={id("wardrobe")} name="wardrobe" className="field" defaultValue={look?.wardrobe ?? "womenswear"}>
            <option value="menswear">Menswear</option>
            <option value="womenswear">Womenswear</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor={id("garment")}>Garment type</label>
          <input id={id("garment")} name="garment" className="field" defaultValue={look?.garment ?? ""} placeholder="e.g. Lehenga" />
        </div>
        <div>
          <label className="label" htmlFor={id("url")}>Link (category or product page)</label>
          <input id={id("url")} name="url" type="url" className="field" defaultValue={look?.url ?? ""} required />
        </div>
        <div>
          <label className="label" htmlFor={id("priceFromInr")}>Price from (₹)</label>
          <input id={id("priceFromInr")} name="priceFromInr" type="number" className="field" defaultValue={look?.priceFromInr ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor={id("priceToInr")}>Price to (₹)</label>
          <input id={id("priceToInr")} name="priceToInr" type="number" className="field" defaultValue={look?.priceToInr ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={id("priceNote")}>Price note</label>
          <input id={id("priceNote")} name="priceNote" className="field" defaultValue={look?.priceNote ?? ""} placeholder="Which product you checked and when" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={id("notes")}>Notes for guests</label>
          <textarea id={id("notes")} name="notes" rows={2} className="field" defaultValue={look?.notes ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor={id("sortOrder")}>Order</label>
          <input id={id("sortOrder")} name="sortOrder" type="number" className="field" defaultValue={look?.sortOrder ?? 0} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={look?.active ?? true} className="accent-saffron" /> Visible to guests
          </label>
        </div>
      </div>
      <fieldset>
        <legend className="label">Suits these events</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {events.map((e) => (
            <label key={e.id} className="flex items-center gap-1.5">
              <input type="checkbox" name="eventSlugs" value={e.slug} defaultChecked={look?.eventSlugs.includes(e.slug) ?? false} className="accent-saffron" />
              {e.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          {look ? "Save" : "Add look"}
        </button>
        {look && (
          <ConfirmButton type="submit" formAction={deleteLook} className="btn-danger" name="id" value={look.id} message={`Delete the look "${look.title}"?`}>
            Delete
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}
