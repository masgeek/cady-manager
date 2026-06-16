import type { FastifyInstance } from 'fastify';
import { CaddyProvider } from '../providers/caddy';
import * as serverService from '../services/server';
import * as siteService from '../services/site';
import * as configService from '../services/config';
import { recordAuditEvent } from '../services/audit';
import { NotFoundError } from '../lib/errors';

export async function registerConfigRoutes(app: FastifyInstance) {
  app.get(
    '/config',
    {
      schema: {
        tags: ['Config'],
        summary: 'Get active Caddy configuration',
        querystring: {
          type: 'object',
          properties: { serverId: { type: 'string' } },
          required: ['serverId'],
        },
      },
    },
    async (request) => {
      const query = request.query as { serverId: string };
      const server = await serverService.getServer(query.serverId);
      const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
      return configService.getServerConfig(provider);
    },
  );

  app.post(
    '/config/reload',
    {
      schema: {
        tags: ['Config'],
        summary: 'Build and reload Caddy configuration',
        body: {
          type: 'object',
          properties: { serverId: { type: 'string' } },
          required: ['serverId'],
        },
      },
    },
    async (request) => {
      const { serverId } = request.body as { serverId: string };
      const server = await serverService.getServer(serverId);
      const sites = await siteService.getSitesByServer(serverId);

      if (sites.length === 0) {
        throw new NotFoundError('Sites', 'none found for this server');
      }

      const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
      await configService.reloadServerConfig(provider, server, sites);

      await recordAuditEvent({
        action: 'reload',
        entity: 'config',
        entityId: serverId,
        details: `Reloaded configuration for server ${server.name} with ${sites.length} sites`,
      });

      return { success: true, message: 'Configuration reloaded', siteCount: sites.length };
    },
  );

  app.get(
    '/config/generated',
    {
      schema: {
        tags: ['Config'],
        summary: 'Preview generated configuration without deploying',
        querystring: {
          type: 'object',
          properties: { serverId: { type: 'string' } },
          required: ['serverId'],
        },
      },
    },
    async (request) => {
      const query = request.query as { serverId: string };
      const server = await serverService.getServer(query.serverId);
      const sites = await siteService.getSitesByServer(server.id);
      const config = configService.buildCaddyConfig(server, sites);
      return config;
    },
  );
}
