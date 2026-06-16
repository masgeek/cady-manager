import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '@caddy-manager/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseUrl = `postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}`;

export const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });

export async function runMigrations() {
  const migrationsDir = join(__dirname, '../drizzle');
  console.log(`Running migrations from ${migrationsDir}...`);
  await migrate(db, { migrationsFolder: migrationsDir });
  console.log('Migrations complete.');
}

export async function closeDb() {
  await queryClient.end();
}
