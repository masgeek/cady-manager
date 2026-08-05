CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"domain" varchar(255) NOT NULL,
	"upstream" varchar(255) NOT NULL,
	"route_id" varchar(255),
	"caddy_server_name" varchar(255),
	"route_config" jsonb,
	"tls_enabled" boolean DEFAULT true NOT NULL,
	"synced" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'inactive' NOT NULL,
	"status_detail" text,
	"last_checked_at" timestamp,
	"health_latency_ms" integer,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"health_endpoint" varchar(150),
	"health_headers" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "sites_server_domain_unique" ON "sites" USING btree ("server_id","domain");
