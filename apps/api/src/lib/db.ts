import { config } from '@caddy-manager/config';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator } from 'kysely/migration';
import type { DB } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const MIGRATIONS_DIR = join(__dirname, '../migrations');

export async function runMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .sort();

  const provider = {
    getMigrations: async () => {
      const migrations: Record<string, { up: (db: Kysely<unknown>) => Promise<void>; down: (db: Kysely<unknown>) => Promise<void> }> = {};
      for (const file of files) {
        const name = file.replace(/\.(ts|js)$/, '');
        const mod = await import(pathToFileURL(join(MIGRATIONS_DIR, file)).href);
        migrations[name] = { up: mod.up, down: mod.down };
      }
      return migrations;
    },
  };

  const migrator = new Migrator({ db, provider });
  const { error, results } = await migrator.migrateToLatest();

  if (results) {
    for (const result of results) {
      if (result.status === 'Success') {
        console.log(`  ✓ ${result.migrationName}`);
      } else if (result.status === 'Error') {
        console.error(`  ✗ ${result.migrationName}`);
      }
    }
  }

  if (error) throw error;
}

export async function closeDb() {
  await pool.end();
}
