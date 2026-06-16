import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://${process.env.DB_USER ?? 'caddy'}:${process.env.DB_PASSWORD ?? 'caddy'}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME ?? 'caddy'}`,
  },
});
