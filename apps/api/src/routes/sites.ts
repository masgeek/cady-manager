import type { FastifyInstance } from 'fastify';
import { createSiteSchema, updateSiteSchema, siteParamsSchema, toJsonSchema } from '../lib/schemas';
import * as siteService from '../services/site';
import { recordAuditEvent } from '../services/audit';

export async function registerSiteRoutes(app: FastifyInstance) {
  app.get(
    '/sites',
    {
      schema: {
        tags: ['Sites'],
        summary: 'List all sites',
        querystring: { type: 'object', properties: { serverId: { type: 'string' } } },
      },
    },
    async (request) => {
      const query = request.query as { serverId?: string };
      return siteService.listSites(query.serverId);
    },
  );

  app.get(
    '/sites/:id',
    {
      schema: {
        tags: ['Sites'],
        summary: 'Get site by ID',
        params: toJsonSchema(siteParamsSchema),
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return siteService.getSite(id);
    },
  );

  app.post(
    '/sites',
    {
      schema: {
        tags: ['Sites'],
        summary: 'Create a site',
        body: toJsonSchema(createSiteSchema),
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
    '/sites/:id',
    {
      schema: {
        tags: ['Sites'],
        summary: 'Update a site',
        params: toJsonSchema(siteParamsSchema),
        body: toJsonSchema(updateSiteSchema),
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
    '/sites/:id',
    {
      schema: {
        tags: ['Sites'],
        summary: 'Delete a site',
        params: toJsonSchema(siteParamsSchema),
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
