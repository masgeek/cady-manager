import type { FastifyInstance } from 'fastify';
import { createServerSchema, updateServerSchema, serverParamsSchema, toJsonSchema } from '../lib/schemas';
import * as serverService from '../services/server';
import { CaddyProvider } from '../providers/caddy';
import { importSitesFromConfig } from '../services/config';
import { recordAuditEvent } from '../services/audit';

export async function registerServerRoutes(app: FastifyInstance) {
  app.get(
    '/servers',
    {
      schema: {
        tags: ['Servers'],
        summary: 'List all servers',
      },
    },
    async () => {
      return serverService.listServers();
    },
  );

  app.get(
    '/servers/:id',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Get server by ID',
        params: toJsonSchema(serverParamsSchema),
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return serverService.getServer(id);
    },
  );

  app.post(
    '/servers',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Create a server',
        body: toJsonSchema(createServerSchema),
      },
    },
    async (request, reply) => {
      const data = createServerSchema.parse(request.body);
      const server = await serverService.createServer(data);

      await recordAuditEvent({
        action: 'create',
        entity: 'server',
        entityId: server.id,
        details: `Created server ${server.name}`,
      });

      return reply.status(201).send(server);
    },
  );

  app.put(
    '/servers/:id',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Update a server',
        params: toJsonSchema(serverParamsSchema),
        body: toJsonSchema(updateServerSchema),
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = updateServerSchema.parse(request.body);
      const server = await serverService.updateServer(id, data);

      await recordAuditEvent({
        action: 'update',
        entity: 'server',
        entityId: server.id,
        details: `Updated server ${server.name}`,
      });

      return server;
    },
  );

  app.delete(
    '/servers/:id',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Delete a server',
        params: toJsonSchema(serverParamsSchema),
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const server = await serverService.getServer(id);
      await serverService.deleteServer(id);

      await recordAuditEvent({
        action: 'delete',
        entity: 'server',
        entityId: id,
        details: `Deleted server ${server.name}`,
      });

      return reply.status(204).send();
    },
  );

  app.post(
    '/servers/:id/health',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Check server health',
        params: toJsonSchema(serverParamsSchema),
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const server = await serverService.getServer(id);

      const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
      try {
        const health = await provider.health();
        await serverService.updateServerStatus(id, 'online', health.status);
        return { status: 'online', server: await serverService.getServer(id) };
      } catch {
        await serverService.updateServerStatus(id, 'offline');
        return { status: 'offline', server: await serverService.getServer(id) };
      }
    },
  );

  app.post(
    '/servers/:id/import',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Import sites from server config',
        params: toJsonSchema(serverParamsSchema),
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const server = await serverService.getServer(id);
      const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });

      try {
        const result = await importSitesFromConfig(server, provider);

        await recordAuditEvent({
          action: 'create',
          entity: 'site',
          details: `Imported ${result.imported} sites from ${server.name} config (${result.skipped} skipped)`,
        });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(502).send({
          statusCode: 502,
          message: `Failed to import config from ${server.apiEndpoint}: ${message}`,
        });
      }
    },
  );
}
