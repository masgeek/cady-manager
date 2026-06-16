import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              version: { type: 'string' },
              uptime: { type: 'number' },
              checkedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: 'online',
        version: '0.1.0',
        uptime: process.uptime(),
        checkedAt: new Date().toISOString(),
      };
    },
  );
}
