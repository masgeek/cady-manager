ALTER TABLE "sites" ADD COLUMN "last_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "health_latency_ms" integer;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "consecutive_failures" integer DEFAULT 0 NOT NULL;