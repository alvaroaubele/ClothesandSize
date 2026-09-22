import type { Dims, SizeChart, Units } from "./sizeCharts";

export type BodyMeasurements = {
  chest: number;
  waist: number;
  hip: number;
  shoulder?: number | null;
};

export type SizeRecommendation = {
  chartKey: string;
  brand: string;
  chartName: string;
  /** null when the guest is above the largest size on the chart */
  label: string | null;
  betweenSizes: boolean;
  /** dimension that pushed the size up beyond what the primary dimension implied */
  drivenBy: "chest" | "waist" | "hip" | null;
  rationale: string;
};

export const CM_PER_INCH = 2.54;
const round1 = (v: number) => Math.round(v * 10) / 10;
export const inchesToCm = (v: number) => round1(v * CM_PER_INCH);
export const cmToInches = (v: number) => round1(v / CM_PER_INCH);

/** Absorbs 0.1-unit rounding from unit round-trips. */
const EPS = 0.06;

type Dim = "chest" | "waist" | "hip";

function smallestFitting(rows: Dims[], dim: Dim, value: number): number {
  return rows.findIndex((r) => r[dim] + EPS >= value); // -1 = above chart
}

/**
 * Picks the smallest size whose "to fit" chest, waist and hip all cover the
 * guest's measurements, comparing in the units the guest entered against the
 * brand's own table for those units. Flags "between sizes" when the guest sits
 * closer to the next size down on the primary dimension than to the chosen one.
 */
export function recommendSize(chart: SizeChart, body: BodyMeasurements, units: Units): SizeRecommendation {
  const rows = chart.rows.map((r) => r[units]);
  const labels = chart.rows.map((r) => r.label);
  const unit = units === "cm" ? "cm" : "in";
  const byChest = smallestFitting(rows, "chest", body.chest);
  const byWaist = smallestFitting(rows, "waist", body.waist);
  const byHip = smallestFitting(rows, "hip", body.hip);
  const base = { chartKey: chart.key, brand: chart.brand, chartName: chart.name };
  const primary = chart.primaryLabel.toLowerCase();

  if (byChest === -1 || byWaist === -1 || byHip === -1) {
    const over = byChest === -1 ? primary : byWaist === -1 ? "waist" : "hip";
    return {
      ...base,
      label: null,
      betweenSizes: false,
      drivenBy: null,
      rationale: `Your ${over} is above the largest size on this chart (${labels[labels.length - 1]}). Ask the store about extended sizes or tailoring.`,
    };
  }

  const chosen = Math.max(byChest, byWaist, byHip);
  const row = rows[chosen];
  const label = labels[chosen];
  let drivenBy: SizeRecommendation["drivenBy"] = null;
  if (chosen > byChest) drivenBy = byWaist === chosen ? "waist" : "hip";

  let betweenSizes = false;
  if (chosen > 0 && drivenBy === null) {
    const prev = rows[chosen - 1];
    const step = row.chest - prev.chest;
    const slack = row.chest - body.chest;
    betweenSizes = slack > step / 2 + EPS && body.chest > prev.chest + EPS;
  }

  let rationale: string;
  if (drivenBy) {
    rationale = `${chart.primaryLabel} alone points to ${labels[byChest]}, but your ${drivenBy} needs ${label} (to fit ${drivenBy} ${row[drivenBy]} ${unit}).`;
  } else if (betweenSizes) {
    const prev = rows[chosen - 1];
    rationale = `Your ${primary} (${body.chest} ${unit}) sits between ${labels[chosen - 1]} (${prev.chest} ${unit}) and ${label} (${row.chest} ${unit}). ${label} is the safe choice; try both if you can.`;
  } else {
    rationale = `${label} fits ${primary} up to ${row.chest} ${unit}, waist ${row.waist} ${unit} and hip ${row.hip} ${unit}.`;
  }

  return { ...base, label, betweenSizes, drivenBy, rationale };
}

/** Converts stored cm measurements back to the guest's entered units. */
export function bodyInUnits(bodyCm: BodyMeasurements, units: Units): BodyMeasurements {
  if (units === "cm") return bodyCm;
  return {
    chest: cmToInches(bodyCm.chest),
    waist: cmToInches(bodyCm.waist),
    hip: cmToInches(bodyCm.hip),
    shoulder: bodyCm.shoulder == null ? bodyCm.shoulder : cmToInches(bodyCm.shoulder),
  };
}

export function recommendForCharts(charts: SizeChart[], bodyCm: BodyMeasurements, units: Units): SizeRecommendation[] {
  const body = bodyInUnits(bodyCm, units);
  return charts.map((c) => recommendSize(c, body, units));
}
