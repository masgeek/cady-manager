import type { FastifyInstance } from 'fastify';
import { auditQuerySchema, toJsonSchema } from '../lib/schemas';
import * as auditService from '../services/audit';

export async function registerAuditRoutes(app: FastifyInstance) {
  app.get(
    '/audit',
    {
      schema: {
        tags: ['Audit'],
        summary: 'Get audit trail',
        querystring: toJsonSchema(auditQuerySchema),
        response: { 200: { type: 'array' } },
      },
    },
    async (request) => {
      const query = auditQuerySchema.parse(request.query);
      return auditService.getAuditEvents(query.limit);
    },
  );
}
