ALTER TABLE "guest_event_plans" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "guest_event_plans" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "intent" text;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "budget_band" text;