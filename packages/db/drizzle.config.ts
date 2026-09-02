import { defineConfig } from "drizzle-kit";
import { buildDatabaseUrl } from "@caddy-manager/config";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: buildDatabaseUrl() },
  migrations: { schema: "public" },
});
