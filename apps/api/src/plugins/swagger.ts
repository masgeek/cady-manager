import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Caddy Manager API',
        description: 'REST API for managing Caddy web servers',
        version: '0.1.0',
      },
      servers: [
        { url: 'http://localhost:3500', description: 'Development' },
      ],
      components: {
        securitySchemes: {
          basicAuth: {
            type: 'http',
            scheme: 'basic',
          },
        },
      },
      security: [{ basicAuth: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });
}
