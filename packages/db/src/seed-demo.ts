/**
 * seed-demo.ts — Generate demo data for development/testing.
 * All records tagged with [DEMO] for safe targeted purge.
 * Usage: tsx src/seed-demo.ts
 * Purge: tsx src/seed-demo.ts --purge
 */

import { queryClient } from './connection';

const TAG = '[DEMO]';

async function seedDemo() {
  console.log(`Seeding demo data ${TAG}...`);
  // TODO: generate realistic demo servers, sites, audit events
  console.log('Demo data seeding complete.');
}

async function purgeDemo() {
  const sql = queryClient;
  await sql`DELETE FROM audit_events WHERE details LIKE ${'%' + TAG + '%'}`;
  await sql`DELETE FROM sites WHERE domain LIKE ${'%' + TAG + '%'}`;
  await sql`DELETE FROM servers WHERE name LIKE ${'%' + TAG + '%'}`;
  console.log(`All ${TAG} records purged.`);
}

const shouldPurge = process.argv.includes('--purge');

if (shouldPurge) {
  purgeDemo().catch((err) => {
    console.error('Purge demo failed:', err);
    process.exit(1);
  });
} else {
  seedDemo().catch((err) => {
    console.error('Seed demo failed:', err);
    process.exit(1);
  });
}
