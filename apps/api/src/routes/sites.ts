import type { FastifyInstance } from 'fastify';
import { createSiteSchema, updateSiteSchema, siteParamsSchema } from '../lib/schemas';
import * as siteService from '../services/site';
import { recordAuditEvent } from '../services/audit';

export async function registerSiteRoutes(app: FastifyInstance) {
  app.get(
    '/api/sites',
    {
      schema: {
        tags: ['Sites'],
        summary: 'List all sites',
        querystring: { type: 'object', properties: { serverId: { type: 'string' } } },
        response: { 200: { type: 'array' } },
      },
    },
    async (request) => {
      const query = request.query as { serverId?: string };
      return siteService.listSites(query.serverId);
    },
  );

  app.get(
    '/api/sites/:id',
    {
      schema: {
        tags: ['Sites'],
        summary: 'Get site by ID',
        params: siteParamsSchema,
        response: { 200: { type: 'object' } },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return siteService.getSite(id);
    },
  );

  app.post(
    '/api/sites',
    {
      schema: {
        tags: ['Sites'],
        summary: 'Create a site',
        body: createSiteSchema,
        response: { 201: { type: 'object' } },
      },
    },
    async (request, reply) => {
      const data = createSiteSchema.parse(request.body);
      const site = await siteService.createSite(data);

      await recordAuditEvent({
        action: 'create',
        entity: 'site',
        entityId: site.id,
        details: `Created site ${site.domain} -> ${site.upstream}`,
      });

      return reply.status(201).send(site);
    },
  );

  app.put(
    '/api/sites/:id',
    {
      schema: {
        tags: ['Sites'],
        summary: 'Update a site',
        params: siteParamsSchema,
        body: updateSiteSchema,
        response: { 200: { type: 'object' } },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = updateSiteSchema.parse(request.body);
      const site = await siteService.updateSite(id, data);

      await recordAuditEvent({
        action: 'update',
        entity: 'site',
        entityId: site.id,
        details: `Updated site ${site.domain}`,
      });

      return site;
    },
  );

  app.delete(
    '/api/sites/:id',
    {
      schema: {
        tags: ['Sites'],
        summary: 'Delete a site',
        params: siteParamsSchema,
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const site = await siteService.getSite(id);
      await siteService.deleteSite(id);

      await recordAuditEvent({
        action: 'delete',
        entity: 'site',
        entityId: id,
        details: `Deleted site ${site.domain}`,
      });

      return reply.status(204).send();
    },
  );
}
