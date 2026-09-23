import { z } from "zod";
import { inchesToCm } from "./sizeEngine";

const optionalText = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters`).default("");

/** A required body measurement with a message a guest can act on. */
const measurement = (what: string) =>
  z.coerce
    .number({ error: `Enter your ${what} as a number, e.g. 92` })
    .positive({ error: `Enter your ${what}; a soft tape measure around the body is all you need` });

const optionalMeasurement = (what: string) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), measurement(what).optional());

export const guestInputSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(120, "Please keep your name under 120 characters"),
  email: z.email("Please enter a valid email, e.g. name@example.com").max(200),
  phone: optionalText(40),
  country: optionalText(80),
  arrivalDate: optionalText(40),
  wardrobe: z.enum(["menswear", "womenswear"], { error: "Choose menswear or womenswear" }),
  units: z.enum(["cm", "in"], { error: "Choose cm or inches" }),
  height: optionalMeasurement("height"),
  chest: measurement("chest or bust"),
  waist: measurement("waist"),
  hip: measurement("hip"),
  shoulder: optionalMeasurement("shoulder"),
  shoeSize: optionalText(20),
  knownSizes: optionalText(300),
  notes: optionalText(1000),
});

export type GuestInput = z.infer<typeof guestInputSchema>;

export type GuestRecordInput = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  arrivalDate: string;
  wardrobe: "menswear" | "womenswear";
  units: "cm" | "in";
  heightCm: number | null;
  chestCm: number;
  waistCm: number;
  hipCm: number;
  shoulderCm: number | null;
  shoeSize: string;
  knownSizes: string;
  notes: string;
};

/** Plausible body ranges in cm; anything outside almost always means the wrong unit was selected. */
const RANGES_CM: Record<"chest" | "waist" | "hip" | "shoulder" | "height", [number, number]> = {
  chest: [50, 200],
  waist: [40, 200],
  hip: [50, 200],
  shoulder: [25, 70],
  height: [100, 250],
};

export type ParseResult = { ok: true; data: GuestRecordInput } | { ok: false; errors: Record<string, string> };

export function formDataToObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

/**
 * Range errors are computed from the raw fields independently of the zod pass,
 * so a guest sees every problem in one round rather than one at a time.
 */
function rangeErrors(raw: Record<string, string>): Record<string, string> {
  const units = raw.units === "in" ? "in" : "cm";
  const errors: Record<string, string> = {};
  for (const key of Object.keys(RANGES_CM) as (keyof typeof RANGES_CM)[]) {
    const v = Number(raw[key]);
    if (!raw[key] || !Number.isFinite(v) || v <= 0) continue;
    const cm = units === "in" ? inchesToCm(v) : v;
    const [lo, hi] = RANGES_CM[key];
    if (cm < lo || cm > hi) {
      const other = units === "cm" ? "inches" : "cm";
      errors[key] = `${v} ${units} looks outside the usual range for a ${key}. Did you mean ${other}? Use the cm / inches switch above.`;
    }
  }
  return errors;
}

/** Validates the raw form and returns a record with measurements normalised to cm. */
export function parseGuestForm(raw: Record<string, string>): ParseResult {
  const parsed = guestInputSchema.safeParse(raw);
  const errors = rangeErrors(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  const d = parsed.data;
  const toCm = (v: number | undefined) => (v == null ? null : d.units === "in" ? inchesToCm(v) : v);
  return {
    ok: true,
    data: {
      fullName: d.fullName,
      email: d.email.toLowerCase(),
      phone: d.phone,
      country: d.country,
      arrivalDate: d.arrivalDate,
      wardrobe: d.wardrobe,
      units: d.units,
      heightCm: toCm(d.height),
      chestCm: toCm(d.chest)!,
      waistCm: toCm(d.waist)!,
      hipCm: toCm(d.hip)!,
      shoulderCm: toCm(d.shoulder),
      shoeSize: d.shoeSize,
      knownSizes: d.knownSizes,
      notes: d.notes,
    },
  };
}
