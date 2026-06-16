import { config } from '@caddy-manager/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { Kysely, PostgresDialect, sql } from 'kysely';
import type { DB } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '../../migrations');

const pool = new pg.Pool({
  host: config.dbHost,
  port: config.dbPort,
  database: config.dbName,
  user: config.dbUser,
  password: config.dbPassword,
  max: 10,
});

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
});

export async function runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  const { rows } = await sql<{ name: string }>`
    SELECT name FROM _migrations ORDER BY name
  `.execute(db);

  const executed = new Set(rows.map(r => r.name));
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executed.has(file)) continue;

    const sqlContent = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    await sql.raw(sqlContent).execute(db);
    await sql`INSERT INTO _migrations (name) VALUES (${file})`.execute(db);
  }
}

export async function closeDb() {
  await pool.end();
}
