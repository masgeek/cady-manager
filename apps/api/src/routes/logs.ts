import type { FastifyInstance } from 'fastify';
import { logQuerySchema, toJsonSchema } from '../lib/schemas';
import * as logService from '../services/log';

export async function registerLogRoutes(app: FastifyInstance) {
  app.get(
    '/api/logs',
    {
      schema: {
        tags: ['Logs'],
        summary: 'Get application and Caddy logs',
        querystring: toJsonSchema(logQuerySchema),
        response: { 200: { type: 'array' } },
      },
    },
    async (request) => {
      const query = logQuerySchema.parse(request.query);
      return logService.getLogs(query);
    },
  );
}
