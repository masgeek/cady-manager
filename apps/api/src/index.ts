import { buildApp } from './app.js';

const start = async () => {
  const app = await buildApp();

  try {
    const port = parseInt(process.env.PORT || '3500', 10);
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
