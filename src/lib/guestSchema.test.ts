import { describe, expect, it } from "vitest";
import { parseGuestForm } from "./guestSchema";

const base = {
  fullName: "Priya Example",
  email: "priya@example.com",
  wardrobe: "womenswear",
  units: "in",
  chest: "36",
  waist: "32",
  hip: "40",
};

describe("parseGuestForm", () => {
  it("normalises inches to cm and lowercases email", () => {
    const r = parseGuestForm({ ...base, email: "Priya@Example.com" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.chestCm).toBe(91.4);
      expect(r.data.email).toBe("priya@example.com");
      expect(r.data.units).toBe("in");
    }
  });

  it("returns a human message for an empty measurement, not raw zod text", () => {
    const r = parseGuestForm({ ...base, chest: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.chest).toMatch(/Enter your chest or bust/);
      expect(r.errors.chest).not.toMatch(/Too small/);
    }
  });

  it("reports a unit mix-up and a missing field in the same pass", () => {
    const r = parseGuestForm({ ...base, chest: "91", waist: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.chest).toMatch(/Did you mean cm/);
      expect(r.errors.waist).toMatch(/Enter your waist/);
    }
  });

  it("rejects an implausible value even when everything else is valid", () => {
    const r = parseGuestForm({ ...base, units: "cm", chest: "400", waist: "80", hip: "100" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.chest).toMatch(/outside the usual range/);
  });
});
