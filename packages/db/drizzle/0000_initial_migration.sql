CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'admin' NOT NULL,
	"action" varchar(20) NOT NULL,
	"entity" varchar(20) NOT NULL,
	"entity_id" text,
	"details" text,
	"result" varchar(10) DEFAULT 'success' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"hostname" varchar(255) NOT NULL,
	"api_endpoint" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'unknown' NOT NULL,
	"version" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"domain" varchar(255) NOT NULL,
	"upstream" varchar(255) NOT NULL,
	"route_id" varchar(255),
	"tls_enabled" boolean DEFAULT true NOT NULL,
	"synced" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'inactive' NOT NULL,
	"health_endpoint" varchar(150),
	"health_headers" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" varchar(30) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;