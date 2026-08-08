import { config } from '@caddy-manager/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

import { errorHandler } from './lib/errors';
import { registerSwagger } from './plugins/swagger';
import { registerAuth } from './plugins/auth';
import { registerAuthRoutes } from './routes/auth';
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
    ajv: {
      customOptions: {
        strict: false,
      },
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

  await app.register(async (scoped) => {
    // Public routes (no JWT required)
    await scoped.register(async (public_) => {
      await registerAuthRoutes(public_);
      await registerHealthRoutes(public_);
    });

    // Protected routes (JWT required)
    await scoped.register(async (protected_) => {
      protected_.addHook('onRequest', async (request, reply) => {
        try {
          await app.authenticate(request, reply);
        } catch {
          reply.status(401).send({ statusCode: 401, message: 'Unauthorized' });
        }
      });
      await registerServerRoutes(protected_);
      await registerSiteRoutes(protected_);
      await registerConfigRoutes(protected_);
      await registerLogRoutes(protected_);
      await registerAuditRoutes(protected_);
    });
  }, { prefix: '/api' });

  return app;
}
