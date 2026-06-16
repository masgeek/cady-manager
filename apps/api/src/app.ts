import { config } from '@caddy-manager/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

import { errorHandler } from './lib/errors';
import { registerSwagger } from './plugins/swagger';
import { registerAuth } from './plugins/auth';
import { registerHealthRoutes } from './routes/health';
import { registerServerRoutes } from './routes/servers';
import { registerSiteRoutes } from './routes/sites';
import { registerConfigRoutes } from './routes/config';
import { registerLogRoutes } from './routes/logs';
import { registerAuditRoutes } from './routes/audit';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  app.setErrorHandler(errorHandler);

  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
  await app.register(sensible);

  await registerSwagger(app);
  await registerAuth(app);

  await registerHealthRoutes(app);
  await registerServerRoutes(app);
  await registerSiteRoutes(app);
  await registerConfigRoutes(app);
  await registerLogRoutes(app);
  await registerAuditRoutes(app);

  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api') && !request.url.startsWith('/api/health') && request.url !== '/docs' && !request.url.startsWith('/docs/') && !request.url.startsWith('/swagger')) {
      try {
        await app.authenticate(request, reply);
      } catch {
        reply.status(401).send({ statusCode: 401, message: 'Unauthorized' });
      }
    }
  });

  return app;
}
