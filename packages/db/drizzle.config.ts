import { defineConfig } from 'drizzle-kit';
import { buildDatabaseUrl } from './src/env';

export default defineConfig({
  out: './drizzle',
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: buildDatabaseUrl() },
  migrations: { schema: process.env.DB_SCHEMA ?? 'public' },
});
