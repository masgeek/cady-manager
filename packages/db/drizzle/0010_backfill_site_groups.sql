INSERT INTO "site_groups" ("server_id", "name", "description")
SELECT DISTINCT
  "server_id",
  CASE
    WHEN length(coalesce("caddy_server_name", "route_id") || ':' || "route_id") <= 100
      THEN coalesce("caddy_server_name", "route_id") || ':' || "route_id"
    ELSE substr(coalesce("caddy_server_name", "route_id") || ':' || "route_id", 1, 90)
      || '-' || substr(md5(coalesce("caddy_server_name", "route_id") || ':' || "route_id"), 1, 9)
  END,
  'Backfilled from provisioned site route data'
FROM "sites"
WHERE "route_id" IS NOT NULL
ON CONFLICT ("server_id", "name") DO NOTHING;
--> statement-breakpoint
UPDATE "site_inventory" AS inventory
SET "group_id" = groups.id
FROM "sites" AS sites
JOIN "site_groups" AS groups
  ON groups."server_id" = sites."server_id"
 AND groups."name" = CASE
   WHEN length(coalesce(sites."caddy_server_name", sites."route_id") || ':' || sites."route_id") <= 100
     THEN coalesce(sites."caddy_server_name", sites."route_id") || ':' || sites."route_id"
   ELSE substr(coalesce(sites."caddy_server_name", sites."route_id") || ':' || sites."route_id", 1, 90)
     || '-' || substr(md5(coalesce(sites."caddy_server_name", sites."route_id") || ':' || sites."route_id"), 1, 9)
 END
WHERE inventory."server_id" = sites."server_id"
  AND inventory."domain" = sites."domain"
  AND sites."route_id" IS NOT NULL;
