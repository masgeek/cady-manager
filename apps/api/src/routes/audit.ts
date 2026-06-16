import type { FastifyInstance } from 'fastify';
import { auditQuerySchema } from '../lib/schemas';
import * as auditService from '../services/audit';

export async function registerAuditRoutes(app: FastifyInstance) {
  app.get(
    '/api/audit',
    {
      schema: {
        tags: ['Audit'],
        summary: 'Get audit trail',
        querystring: auditQuerySchema,
        response: { 200: { type: 'array' } },
      },
    },
    async (request) => {
      const query = auditQuerySchema.parse(request.query);
      return auditService.getAuditEvents(query.limit);
    },
  );
}
