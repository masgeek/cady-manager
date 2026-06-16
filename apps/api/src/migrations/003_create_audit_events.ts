import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>) {
  await db.schema
    .createTable('audit_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'varchar(100)', (col) => col.notNull().defaultTo('admin'))
    .addColumn('action', 'varchar(20)', (col) => col.notNull())
    .addColumn('entity', 'varchar(20)', (col) => col.notNull())
    .addColumn('entity_id', 'varchar(255)')
    .addColumn('details', 'text')
    .addColumn('result', 'varchar(10)', (col) => col.notNull().defaultTo('success'))
    .addColumn('timestamp', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();
}

export async function down(db: Kysely<unknown>) {
  await db.schema.dropTable('audit_events').execute();
}
