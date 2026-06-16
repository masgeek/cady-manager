import { randomBytes, scryptSync } from 'node:crypto';
import { db, closeDb } from './lib/db';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function seed() {
  const email = process.env.SEED_EMAIL || 'admin@caddy.local';
  const password = process.env.SEED_PASSWORD || 'admin';
  const role = process.env.SEED_ROLE || 'admin';

  const existing = await db
    .selectFrom('users')
    .select('id')
    .where('email', '=', email)
    .executeTakeFirst();

  if (existing) {
    console.log(`User ${email} already exists, skipping.`);
  } else {
    await db
      .insertInto('users')
      .values({
        email,
        role,
        password_hash: hashPassword(password),
      })
      .execute();
    console.log(`Created admin user: ${email} / ${password}`);
  }

  await closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
