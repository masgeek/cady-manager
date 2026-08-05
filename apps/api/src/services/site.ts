import type { Site } from '@caddy-manager/shared-types';
import { siteRepo, serverRepo } from '@caddy-manager/db';
import { CaddyProvider } from '../providers/caddy';
import { buildCaddyRoute } from './config';
import { NotFoundError } from '../lib/errors';

export async function listSites(serverId?: string): Promise<Site[]> {
  return siteRepo.findAll(serverId);
}

export async function getSite(id: string): Promise<Site> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError('Site', id);
  return site;
}

export async function createSite(data: {
  serverId: string;
  domain: string;
  upstream: string;
  routeId?: string;
  caddyServerName?: string;
  tlsEnabled: boolean;
  healthEndpoint?: string;
  healthHeaders?: string;
}): Promise<Site> {
  const server = await serverRepo.findById(data.serverId);
  if (!server) throw new NotFoundError('Server', data.serverId);

  const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
  const servers = await provider.getServerNames();
  const serverName = data.caddyServerName ?? servers[0];

  if (serverName && !servers.includes(serverName)) {
    throw new Error(`Caddy server block not found: ${serverName}`);
  }

  if (serverName) {
    const route = buildCaddyRoute(data);
    await provider.addRoute(serverName, route);
  }

  return siteRepo.create(data);
}

export async function updateSite(
  id: string,
  data: Partial<{ domain: string; upstream: string; routeId?: string; caddyServerName?: string; tlsEnabled: boolean; healthEndpoint?: string; healthHeaders?: string }>,
): Promise<Site> {
  const existing = await siteRepo.findById(id);
  if (!existing) throw new NotFoundError('Site', id);

  const merged = { ...existing, ...data };

  if (existing.routeId || data.routeId) {
    const server = await serverRepo.findById(merged.serverId);
    if (server) {
      const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
      const route = buildCaddyRoute(merged);
      delete route['@id'];
      const routeId = data.routeId ?? existing.routeId!;
      await provider.updateRouteByID(routeId, route);
    }
  }

  const site = await siteRepo.update(id, data);
  if (!site) throw new NotFoundError('Site', id);

  if (!site.synced) {
    await siteRepo.updateSyncedStatus(site.id, true);
    site.synced = true;
  }

  return site;
}

export async function deleteSite(id: string): Promise<void> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError('Site', id);

  if (site.routeId) {
    const server = await serverRepo.findById(site.serverId);
    if (server) {
      const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
      await provider.deleteRouteByID(site.routeId).catch(() => {
        // ignore if route already removed
      });
    }
  }

  await siteRepo.delete(id);
}

export async function syncSite(id: string): Promise<Site> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError('Site', id);

  const server = await serverRepo.findById(site.serverId);
  if (!server) throw new NotFoundError('Server', site.serverId);

  const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
  const servers = await provider.getServerNames();
  const serverName = site.caddyServerName ?? servers[0];
  if (!serverName) throw new Error('No Caddy servers found');
  if (!servers.includes(serverName)) throw new Error(`Caddy server block not found: ${serverName}`);

  const routeId = site.routeId || site.domain.replace(/[^a-zA-Z0-9_-]/g, '_');
  const route = buildCaddyRoute({ ...site, routeId });
  await provider.addRoute(serverName, route);

  if (!site.routeId) {
    await siteRepo.update(id, { routeId });
  }
  await siteRepo.updateSyncedStatus(id, true);

  return { ...site, routeId, synced: true };
}

export async function getSitesByServer(serverId: string): Promise<Site[]> {
  return siteRepo.findByServer(serverId);
}
