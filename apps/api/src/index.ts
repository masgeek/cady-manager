import { buildApp } from './app.js';
import { runMigrations, closeDb } from './lib/db.js';

const start = async () => {
  const app = await buildApp();

  try {
    await runMigrations();
  } catch (err) {
    app.log.warn('Database not available, running with in-memory storage');
  }

  try {
    const port = parseInt(process.env.PORT || '3500', 10);
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    await closeDb();
    process.exit(1);
  }
};

start();
