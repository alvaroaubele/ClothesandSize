import { z } from "zod";
import { inchesToCm } from "./sizeEngine";

const optionalText = (max: number) => z.string().trim().max(max).default("");

const num = z.coerce.number().positive();
const optionalNum = z.preprocess((v) => (v === "" || v == null ? undefined : v), num.optional());

export const guestInputSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Please enter a valid email").max(200),
  phone: optionalText(40),
  country: optionalText(80),
  arrivalDate: optionalText(40),
  wardrobe: z.enum(["menswear", "womenswear"], { error: "Choose menswear or womenswear" }),
  units: z.enum(["cm", "in"]),
  height: optionalNum,
  chest: num,
  waist: num,
  hip: num,
  shoulder: optionalNum,
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

const RANGES_CM = {
  chest: [50, 200],
  waist: [40, 200],
  hip: [50, 200],
  shoulder: [25, 70],
  height: [100, 250],
} as const;

export type ParseResult = { ok: true; data: GuestRecordInput } | { ok: false; errors: Record<string, string> };

export function formDataToObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

/** Validates the raw form and returns a record with measurements normalised to cm. */
export function parseGuestForm(raw: Record<string, string>): ParseResult {
  const parsed = guestInputSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  const d = parsed.data;
  const toCm = (v: number | undefined) => (v == null ? null : d.units === "in" ? inchesToCm(v) : v);
  const rec: GuestRecordInput = {
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
  };
  const errors: Record<string, string> = {};
  const check = (key: keyof typeof RANGES_CM, value: number | null) => {
    if (value == null) return;
    const [lo, hi] = RANGES_CM[key];
    if (value < lo || value > hi) errors[key] = `That ${key} looks out of range. Check the unit toggle (cm / in).`;
  };
  check("chest", rec.chestCm);
  check("waist", rec.waistCm);
  check("hip", rec.hipCm);
  check("shoulder", rec.shoulderCm);
  check("height", rec.heightCm);
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: rec };
}
