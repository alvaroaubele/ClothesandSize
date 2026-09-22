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
export type PlanStatus = "undecided" | "interested" | "buy_myself" | "preorder_for_me";
export type Units = "cm" | "in";

export const PLAN_STATUSES: { value: PlanStatus; label: string }[] = [
  { value: "undecided", label: "Still deciding" },
  { value: "interested", label: "Interested, want to see it first" },
  { value: "buy_myself", label: "I will buy it myself in Mumbai" },
  { value: "preorder_for_me", label: "Please reserve or pre-order this for me" },
];

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
    status: text("status").$type<PlanStatus>().notNull().default("undecided"),
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
