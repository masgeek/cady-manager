ALTER TABLE "audit_events" ALTER COLUMN "user_id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "user_id" SET DEFAULT 'admin';