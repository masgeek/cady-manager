import type { FastifyInstance } from 'fastify';
import { createServerSchema, updateServerSchema, serverParamsSchema } from '../lib/schemas';
import * as serverService from '../services/server';
import { CaddyProvider } from '../providers/caddy';
import { recordAuditEvent } from '../services/audit';

export async function registerServerRoutes(app: FastifyInstance) {
  app.get(
    '/api/servers',
    {
      schema: {
        tags: ['Servers'],
        summary: 'List all servers',
        response: { 200: { type: 'array' } },
      },
    },
    async () => {
      return serverService.listServers();
    },
  );

  app.get(
    '/api/servers/:id',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Get server by ID',
        params: serverParamsSchema,
        response: { 200: { type: 'object' } },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return serverService.getServer(id);
    },
  );

  app.post(
    '/api/servers',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Create a server',
        body: createServerSchema,
        response: { 201: { type: 'object' } },
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
    '/api/servers/:id',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Update a server',
        params: serverParamsSchema,
        body: updateServerSchema,
        response: { 200: { type: 'object' } },
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
    '/api/servers/:id',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Delete a server',
        params: serverParamsSchema,
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
    '/api/servers/:id/health',
    {
      schema: {
        tags: ['Servers'],
        summary: 'Check server health',
        params: serverParamsSchema,
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
}
