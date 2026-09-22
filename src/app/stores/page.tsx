import { SIZE_CHARTS } from "@/lib/sizeCharts";
import { getStores } from "@/lib/queries";

export default async function StoresPage() {
  const stores = await getStores();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Stores in Mumbai</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Addresses marked <span className="chip">from the store&apos;s site</span> were read from the brand&apos;s own store
          locator. Others come from third-party listings: call before you go.
        </p>
      </div>
      {stores.map((s) => {
        const charts = [s.sizeChartMen, s.sizeChartWomen].filter((k): k is string => !!k && !!SIZE_CHARTS[k]);
        return (
          <section key={s.id} className="card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl">{s.name}</h2>
                <a href={s.website} target="_blank" rel="noreferrer" className="text-sm text-saffron-deep underline">
                  {s.website}
                </a>
              </div>
              <span className="chip">{s.wardrobe === "both" ? "Men & women" : s.wardrobe === "menswear" ? "Menswear" : "Womenswear"}</span>
            </div>
            <p className="text-sm">{s.blurb}</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold">Shipping</dt>
                <dd className="text-ink-soft">{s.shippingNote}</dd>
              </div>
              <div>
                <dt className="font-semibold">Alterations</dt>
                <dd className="text-ink-soft">{s.alterationNote}</dd>
              </div>
              <div>
                <dt className="font-semibold">Sizing</dt>
                <dd className="text-ink-soft">{s.sizeNote}</dd>
              </div>
            </dl>
            {charts.length > 0 && (
              <div className="space-y-4">
                {charts.map((k) => {
                  const c = SIZE_CHARTS[k];
                  return (
                    <div key={k} className="overflow-x-auto">
                      <h3 className="mb-2 text-base">{c.name} — to fit body measurements</h3>
                      <table className="table min-w-[520px]">
                        <thead>
                          <tr>
                            <th>Size</th>
                            <th>Shoulder</th>
                            <th>{c.primaryLabel}</th>
                            <th>Waist</th>
                            <th>Hip</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.rows.map((r) => (
                            <tr key={r.label}>
                              <td className="font-semibold">{r.label}</td>
                              <td>
                                {r.in.shoulder} in · {r.cm.shoulder} cm
                              </td>
                              <td>
                                {r.in.chest} in · {r.cm.chest} cm
                              </td>
                              <td>
                                {r.in.waist} in · {r.cm.waist} cm
                              </td>
                              <td>
                                {r.in.hip} in · {r.cm.hip} cm
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="hint">
                        Source: <a className="underline" href={c.sourceUrl} target="_blank" rel="noreferrer">brand product page</a>, checked {c.retrievedOn}.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            <div>
              <h3 className="mb-2 text-base">Mumbai locations</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {s.locations.map((loc) => (
                  <li key={loc.name} className="rounded-lg border border-line bg-paper p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{loc.name}</span>
                      <span className="chip">{loc.verified ? "from the store's site" : "confirm before visiting"}</span>
                    </div>
                    <p className="mt-1 text-ink-soft">{loc.address}</p>
                    {loc.phone && (
                      <p className="mt-1">
                        <a className="underline" href={`tel:${loc.phone.replace(/\s+/g, "")}`}>
                          {loc.phone}
                        </a>
                      </p>
                    )}
                    {loc.hours && <p className="mt-1 text-xs text-ink-soft">{loc.hours}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
