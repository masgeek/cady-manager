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
