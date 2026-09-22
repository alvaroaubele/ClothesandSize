/**
 * Brand size charts. Every row here is copied from a primary source listed in
 * docs/SOURCES.md. Do not add a chart without a source row there.
 *
 * Brands publish separate inch and cm tables that are rounded independently
 * (Fabindia M bust is 36 in but 91 cm, not 91.44). We keep both verbatim and the
 * engine compares in the units the guest entered, as the brand's own site does.
 */

export type Units = "cm" | "in";

export type Dims = {
  chest: number; // bust for womenswear
  waist: number;
  hip: number;
  shoulder?: number;
};

export type SizeRow = {
  label: string;
  cm: Dims;
  in: Dims;
};

export type SizeChart = {
  key: string;
  brand: string;
  name: string;
  wardrobe: "menswear" | "womenswear";
  primaryLabel: string;
  sourceUrl: string;
  retrievedOn: string;
  rows: SizeRow[];
};

export const FABINDIA_WOMEN_TOPS: SizeChart = {
  key: "fabindia-women-tops",
  brand: "Fabindia",
  name: "Fabindia women's tops (kurtas, kurta sets)",
  wardrobe: "womenswear",
  primaryLabel: "Bust",
  sourceUrl: "https://www.fabindia.com/cotton-straight-style-medium-kurta-10740874",
  retrievedOn: "2026-09-22",
  rows: [
    { label: "XS", in: { shoulder: 13.5, chest: 32, waist: 28, hip: 36 }, cm: { shoulder: 34, chest: 81, waist: 71, hip: 91 } },
    { label: "S", in: { shoulder: 14.25, chest: 34, waist: 30, hip: 38 }, cm: { shoulder: 36, chest: 86, waist: 76, hip: 97 } },
    { label: "M", in: { shoulder: 15, chest: 36, waist: 32, hip: 40 }, cm: { shoulder: 38, chest: 91, waist: 81, hip: 102 } },
    { label: "L", in: { shoulder: 15.5, chest: 39, waist: 35, hip: 43 }, cm: { shoulder: 39, chest: 99, waist: 89, hip: 109 } },
    { label: "XL", in: { shoulder: 16, chest: 42, waist: 38, hip: 46 }, cm: { shoulder: 41, chest: 107, waist: 97, hip: 117 } },
    { label: "XXL", in: { shoulder: 16.5, chest: 45, waist: 41, hip: 49 }, cm: { shoulder: 42, chest: 114, waist: 104, hip: 124 } },
    { label: "XXXL", in: { shoulder: 17, chest: 48, waist: 44, hip: 52 }, cm: { shoulder: 43, chest: 122, waist: 112, hip: 132 } },
  ],
};

export const FABINDIA_MEN_KURTAS: SizeChart = {
  key: "fabindia-men-kurtas",
  brand: "Fabindia",
  name: "Fabindia men's kurtas and Nehru jackets",
  wardrobe: "menswear",
  primaryLabel: "Chest",
  sourceUrl: "https://www.fabindia.com/silk-printed-nehru-jacket-10593111",
  retrievedOn: "2026-09-22",
  rows: [
    { label: "XS", in: { shoulder: 18, chest: 36, waist: 28, hip: 37 }, cm: { shoulder: 46, chest: 91, waist: 71, hip: 94 } },
    { label: "S", in: { shoulder: 19, chest: 38, waist: 30, hip: 39 }, cm: { shoulder: 48, chest: 97, waist: 76, hip: 99 } },
    { label: "M", in: { shoulder: 20, chest: 40, waist: 32, hip: 41 }, cm: { shoulder: 51, chest: 102, waist: 81, hip: 104 } },
    { label: "L", in: { shoulder: 21, chest: 42, waist: 34, hip: 43 }, cm: { shoulder: 53, chest: 107, waist: 86, hip: 109 } },
    { label: "XL", in: { shoulder: 22, chest: 44, waist: 36, hip: 45 }, cm: { shoulder: 56, chest: 112, waist: 91, hip: 114 } },
    { label: "XXL", in: { shoulder: 23, chest: 46, waist: 38, hip: 47 }, cm: { shoulder: 58, chest: 117, waist: 97, hip: 119 } },
    { label: "XXXL", in: { shoulder: 23, chest: 48, waist: 40, hip: 49 }, cm: { shoulder: 58, chest: 122, waist: 102, hip: 124 } },
  ],
};

export const SIZE_CHARTS: Record<string, SizeChart> = {
  [FABINDIA_WOMEN_TOPS.key]: FABINDIA_WOMEN_TOPS,
  [FABINDIA_MEN_KURTAS.key]: FABINDIA_MEN_KURTAS,
};

/**
 * Tasva publishes sizes XS–XXXL on each product page but its measurement table
 * was not retrievable on 2026-09-22 (docs/SOURCES.md). We deliberately do not
 * compute a Tasva size; the label list is shown with in-store guidance.
 */
export const TASVA_SIZE_LABELS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
