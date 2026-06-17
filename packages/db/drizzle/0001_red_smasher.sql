ALTER TABLE "audit_events" ALTER COLUMN "user_id" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "user_id" SET DEFAULT 'admin';