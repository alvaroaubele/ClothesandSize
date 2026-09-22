CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"date_label" text DEFAULT '' NOT NULL,
	"time_of_day" text DEFAULT 'evening' NOT NULL,
	"dress_code" text DEFAULT '' NOT NULL,
	"palette" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "guest_event_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"status" text DEFAULT 'undecided' NOT NULL,
	"look_ids" integer[] DEFAULT '{}' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"arrival_date" text DEFAULT '' NOT NULL,
	"wardrobe" text NOT NULL,
	"units" text DEFAULT 'cm' NOT NULL,
	"height_cm" real,
	"chest_cm" real NOT NULL,
	"waist_cm" real NOT NULL,
	"hip_cm" real NOT NULL,
	"shoulder_cm" real,
	"shoe_size" text DEFAULT '' NOT NULL,
	"known_sizes" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "looks" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"title" text NOT NULL,
	"wardrobe" text NOT NULL,
	"garment" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"price_from_inr" integer,
	"price_to_inr" integer,
	"price_note" text DEFAULT '' NOT NULL,
	"event_slugs" text[] DEFAULT '{}' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"verified_on" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"wardrobe" text NOT NULL,
	"website" text NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"shipping_note" text DEFAULT '' NOT NULL,
	"alteration_note" text DEFAULT '' NOT NULL,
	"size_chart_men" text,
	"size_chart_women" text,
	"size_note" text DEFAULT '' NOT NULL,
	"locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "guest_event_plans" ADD CONSTRAINT "guest_event_plans_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_event_plans" ADD CONSTRAINT "guest_event_plans_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "looks" ADD CONSTRAINT "looks_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_event_plans_guest_event_idx" ON "guest_event_plans" USING btree ("guest_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_token_idx" ON "guests" USING btree ("token");