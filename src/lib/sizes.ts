import type { Guest, Store } from "@/db/schema";
import { SIZE_CHARTS, type SizeChart } from "./sizeCharts";
import { recommendForCharts, type SizeRecommendation } from "./sizeEngine";

/** Charts that apply to this guest, taken from the seeded stores' chart keys. */
export function chartsForGuest(stores: Store[], wardrobe: Guest["wardrobe"]): SizeChart[] {
  const keys = new Set<string>();
  for (const s of stores) {
    const k = wardrobe === "menswear" ? s.sizeChartMen : s.sizeChartWomen;
    if (k && SIZE_CHARTS[k]) keys.add(k);
  }
  return [...keys].map((k) => SIZE_CHARTS[k]);
}

export function sizesForGuest(stores: Store[], guest: Guest): SizeRecommendation[] {
  const charts = chartsForGuest(stores, guest.wardrobe);
  return recommendForCharts(
    charts,
    { chest: guest.chestCm, waist: guest.waistCm, hip: guest.hipCm, shoulder: guest.shoulderCm },
    guest.units,
  );
}

export function formatMeasurement(cm: number | null, units: Guest["units"]): string {
  if (cm == null) return "—";
  if (units === "cm") return `${Math.round(cm * 10) / 10} cm`;
  return `${Math.round((cm / 2.54) * 10) / 10} in`;
}
