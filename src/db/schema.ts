import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type Wardrobe = "menswear" | "womenswear";
export type StoreWardrobe = Wardrobe | "both";
export type TimeOfDay = "day" | "evening";
/** What the guest wants the couple to do. Asked once per guest; events may override. */
export type PlanStatus = "preorder_for_me" | "buy_myself" | "undecided";
export type Units = "cm" | "in";
export type BudgetBand = "under_3k" | "3k_8k" | "8k_15k" | "15k_30k" | "over_30k";

export const PLAN_STATUSES: { value: PlanStatus; label: string; short: string }[] = [
  { value: "preorder_for_me", label: "Please reserve or buy it for me in Mumbai", short: "Reserve for me" },
  { value: "buy_myself", label: "I will buy it myself in Mumbai", short: "Buying myself" },
  { value: "undecided", label: "Still deciding, ask me later", short: "Still deciding" },
];

export const BUDGET_BANDS: { value: BudgetBand; label: string }[] = [
  { value: "under_3k", label: "Under ₹3,000 per outfit" },
  { value: "3k_8k", label: "₹3,000 – ₹8,000" },
  { value: "8k_15k", label: "₹8,000 – ₹15,000" },
  { value: "15k_30k", label: "₹15,000 – ₹30,000" },
  { value: "over_30k", label: "Over ₹30,000" },
];

export const statusLabel = (v: PlanStatus | null | undefined) => PLAN_STATUSES.find((s) => s.value === v)?.label ?? "Not answered";
export const statusShort = (v: PlanStatus | null | undefined) => PLAN_STATUSES.find((s) => s.value === v)?.short ?? "Not answered";
export const budgetLabel = (v: BudgetBand | null | undefined) => BUDGET_BANDS.find((b) => b.value === v)?.label ?? "";

export type StoreLocation = {
  name: string;
  address: string;
  phone?: string;
  hours?: string;
  /** true when read from the store's own site; false = third-party listing */
  verified: boolean;
};

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** Free text so the couple can write "TBC", "12 March 2027" or "Day 2, evening". */
  dateLabel: text("date_label").notNull().default(""),
  timeOfDay: text("time_of_day").$type<TimeOfDay>().notNull().default("evening"),
  dressCode: text("dress_code").notNull().default(""),
  palette: text("palette").notNull().default(""),
  notes: text("notes").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  wardrobe: text("wardrobe").$type<StoreWardrobe>().notNull(),
  website: text("website").notNull(),
  blurb: text("blurb").notNull().default(""),
  shippingNote: text("shipping_note").notNull().default(""),
  alterationNote: text("alteration_note").notNull().default(""),
  /** Key into src/lib/sizeCharts.ts; null when no verified chart exists. */
  sizeChartMen: text("size_chart_men"),
  sizeChartWomen: text("size_chart_women"),
  sizeNote: text("size_note").notNull().default(""),
  locations: jsonb("locations").$type<StoreLocation[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const looks = pgTable("looks", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  wardrobe: text("wardrobe").$type<Wardrobe>().notNull(),
  garment: text("garment").notNull().default(""),
  url: text("url").notNull(),
  priceFromInr: integer("price_from_inr"),
  priceToInr: integer("price_to_inr"),
  priceNote: text("price_note").notNull().default(""),
  /** Event slugs this look suits; empty = suits every event. */
  eventSlugs: text("event_slugs").array().notNull().default([]),
  notes: text("notes").notNull().default(""),
  verifiedOn: text("verified_on").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const guests = pgTable(
  "guests",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    country: text("country").notNull().default(""),
    arrivalDate: text("arrival_date").notNull().default(""),
    wardrobe: text("wardrobe").$type<Wardrobe>().notNull(),
    /** Guest-level answer to "what should the couple do?"; null until the planner is saved once. */
    intent: text("intent").$type<PlanStatus>(),
    budgetBand: text("budget_band").$type<BudgetBand>(),
    units: text("units").$type<Units>().notNull().default("cm"),
    heightCm: real("height_cm"),
    chestCm: real("chest_cm").notNull(),
    waistCm: real("waist_cm").notNull(),
    hipCm: real("hip_cm").notNull(),
    shoulderCm: real("shoulder_cm"),
    shoeSize: text("shoe_size").notNull().default(""),
    knownSizes: text("known_sizes").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("guests_token_idx").on(t.token)],
);

export const guestEventPlans = pgTable(
  "guest_event_plans",
  {
    id: serial("id").primaryKey(),
    guestId: integer("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    /** Per-event override; null means "same as the guest's intent". */
    status: text("status").$type<PlanStatus>(),
    lookIds: integer("look_ids").array().notNull().default([]),
    notes: text("notes").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("guest_event_plans_guest_event_idx").on(t.guestId, t.eventId)],
);

export type Event = typeof events.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Look = typeof looks.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type GuestEventPlan = typeof guestEventPlans.$inferSelect;
