import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  // Server
  port: z.coerce.number().default(3500),
  logLevel: z.string().default('info'),

  // Auth
  authUsername: z.string().default('admin'),
  authPassword: z.string().default('admin'),

  // Database
  dbHost: z.string().default('localhost'),
  dbPort: z.coerce.number().default(5432),
  dbName: z.string().default('caddy'),
  dbUser: z.string().default('caddy'),
  dbPassword: z.string().default('caddy'),

  // Seed
  seedEmail: z.string().default('admin@caddy.local'),
  seedPassword: z.string().default('admin'),
  seedRole: z.string().default('admin'),
});

const parsed = configSchema.safeParse({
  port: process.env.PORT,
  logLevel: process.env.LOG_LEVEL,
  authUsername: process.env.AUTH_USERNAME,
  authPassword: process.env.AUTH_PASSWORD,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  seedEmail: process.env.SEED_EMAIL,
  seedPassword: process.env.SEED_PASSWORD,
  seedRole: process.env.SEED_ROLE,
});

if (!parsed.success) {
  console.error('Invalid configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const config = parsed.data;
