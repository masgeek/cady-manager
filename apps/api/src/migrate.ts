import { runMigrations, closeDb } from "./lib/db";

async function migrate() {
  try {
    await runMigrations();
    console.log("Migrations completed successfully");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

migrate();
