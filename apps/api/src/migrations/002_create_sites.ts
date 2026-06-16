import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await db.schema
    .createTable('sites')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('server_id', 'uuid', (col) => col.notNull().references('servers.id').onDelete('cascade'))
    .addColumn('domain', 'varchar(255)', (col) => col.notNull())
    .addColumn('upstream', 'varchar(255)', (col) => col.notNull())
    .addColumn('tls_enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('inactive'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();
}

export async function down(db: Kysely<unknown>) {
  await db.schema.dropTable('sites').execute();
}
