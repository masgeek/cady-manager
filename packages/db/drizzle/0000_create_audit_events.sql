CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar(36) DEFAULT 'admin' NOT NULL,
	"action" varchar(20) NOT NULL,
	"entity" varchar(20) NOT NULL,
	"entity_id" text,
	"details" text,
	"result" varchar(10) DEFAULT 'success' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
