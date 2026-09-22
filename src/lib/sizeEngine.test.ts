import { describe, expect, it } from "vitest";
import { FABINDIA_MEN_KURTAS, FABINDIA_WOMEN_TOPS } from "./sizeCharts";
import { cmToInches, inchesToCm, recommendForCharts, recommendSize } from "./sizeEngine";

describe("recommendSize — Fabindia women's tops", () => {
  it("bust 36in / waist 32in / hip 40in is an exact M", () => {
    const r = recommendSize(FABINDIA_WOMEN_TOPS, { chest: 36, waist: 32, hip: 40 }, "in");
    expect(r.label).toBe("M");
    expect(r.betweenSizes).toBe(false);
    expect(r.drivenBy).toBeNull();
  });

  it("bust 37in lands on L and is flagged between sizes", () => {
    const r = recommendSize(FABINDIA_WOMEN_TOPS, { chest: 37, waist: 32, hip: 40 }, "in");
    expect(r.label).toBe("L");
    expect(r.betweenSizes).toBe(true);
    expect(r.rationale).toContain("between M");
  });

  it("bust 38.5in is closer to L than M and is not flagged", () => {
    const r = recommendSize(FABINDIA_WOMEN_TOPS, { chest: 38.5, waist: 32, hip: 40 }, "in");
    expect(r.label).toBe("L");
    expect(r.betweenSizes).toBe(false);
  });

  it("smallest guest gets XS without a between-sizes flag", () => {
    const r = recommendSize(FABINDIA_WOMEN_TOPS, { chest: 78, waist: 60, hip: 85 }, "cm");
    expect(r.label).toBe("XS");
    expect(r.betweenSizes).toBe(false);
  });

  it("above XXXL returns null with guidance", () => {
    const r = recommendSize(FABINDIA_WOMEN_TOPS, { chest: 130, waist: 100, hip: 120 }, "cm");
    expect(r.label).toBeNull();
    expect(r.rationale).toMatch(/above the largest size/);
  });
});

describe("recommendSize — Fabindia men's kurtas", () => {
  it("chest 102cm points to M but waist 86cm needs L; rationale names the waist", () => {
    const r = recommendSize(FABINDIA_MEN_KURTAS, { chest: 102, waist: 86, hip: 100 }, "cm");
    expect(r.label).toBe("L");
    expect(r.drivenBy).toBe("waist");
    expect(r.rationale).toContain("waist");
    expect(r.betweenSizes).toBe(false);
  });

  it("chest 40in / waist 32in / hip 41in is an exact M", () => {
    const r = recommendSize(FABINDIA_MEN_KURTAS, { chest: 40, waist: 32, hip: 41 }, "in");
    expect(r.label).toBe("M");
    expect(r.betweenSizes).toBe(false);
  });

  it("hip can drive the size too", () => {
    const r = recommendSize(FABINDIA_MEN_KURTAS, { chest: 95, waist: 75, hip: 108 }, "cm");
    expect(r.label).toBe("L");
    expect(r.drivenBy).toBe("hip");
  });
});

describe("unit round-trip through storage", () => {
  it("inches survive cm storage and come back exact against the inch table", () => {
    // Guest typed 36/32/40 in; we store cm and convert back at read time.
    const stored = { chest: inchesToCm(36), waist: inchesToCm(32), hip: inchesToCm(40) };
    expect(cmToInches(stored.chest)).toBe(36);
    const [r] = recommendForCharts([FABINDIA_WOMEN_TOPS], stored, "in");
    expect(r.label).toBe("M");
    expect(r.betweenSizes).toBe(false);
  });
});
