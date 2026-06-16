import pg from 'pg';
import { Kysely, PostgresDialect, sql } from 'kysely';
import type { DB } from './types';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'caddy',
  user: process.env.DB_USER || 'caddy',
  password: process.env.DB_PASSWORD || 'caddy',
  max: 10,
});

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
});

export async function runMigrations() {
  const exists = await sql<{ table_name: string }>`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  `.execute(db);

  const tables = exists.rows.map(r => r.table_name);

  if (!tables.includes('servers')) {
    await sql`
      CREATE TABLE servers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        hostname VARCHAR(255) NOT NULL,
        api_endpoint VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'unknown',
        version VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.execute(db);
  }

  if (!tables.includes('sites')) {
    await sql`
      CREATE TABLE sites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
        domain VARCHAR(255) NOT NULL,
        upstream VARCHAR(255) NOT NULL,
        tls_enabled BOOLEAN NOT NULL DEFAULT true,
        status VARCHAR(20) NOT NULL DEFAULT 'inactive',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.execute(db);
  }

  if (!tables.includes('audit_events')) {
    await sql`
      CREATE TABLE audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(100) NOT NULL DEFAULT 'admin',
        action VARCHAR(20) NOT NULL,
        entity VARCHAR(20) NOT NULL,
        entity_id VARCHAR(255),
        details TEXT,
        result VARCHAR(10) NOT NULL DEFAULT 'success',
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.execute(db);
  }

  if (!tables.includes('users')) {
    await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.execute(db);
  }
}

export async function closeDb() {
  await db.destroy();
}
